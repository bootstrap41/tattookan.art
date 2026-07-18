// ============================================
// TATTOOKAN AI TASARIM KÖPRÜSÜ
// ============================================
// Bu worker: müşterinin tarayıcısından gelen tasarım isteğini alır,
// OpenAI'a güvenli şekilde (anahtar gizli kalarak) iletir, üretilen
// görseli hem müşteriye geri döndürür hem de e-posta ile stüdyoya bildirir.
//
// Gerekli KV Namespace: AI_USAGE (kullanım sayaçlarını tutmak için)
// Gerekli Secret'lar: OPENAI_API_KEY, RESEND_API_KEY, NOTIFY_EMAIL

const ALLOWED_ORIGIN = "https://tattookanart.com";
const MONTHLY_LIMIT = 100; // Aylık toplam üretim sınırı
const DAILY_IP_LIMIT = 3; // Aynı ziyaretçinin günlük deneme sınırı

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Desteklenmeyen istek." }, 405);
    }

    // --- 1) Aylık toplam limit kontrolü ---
    const monthKey = `usage:${new Date().toISOString().slice(0, 7)}`;
    const currentMonthCount = parseInt((await env.AI_USAGE.get(monthKey)) || "0", 10);

    if (currentMonthCount >= MONTHLY_LIMIT) {
      return jsonResponse(
        { error: "Bu ay için AI tasarım deneme hakkımız doldu. Lütfen WhatsApp üzerinden bize ulaşın." },
        429,
      );
    }

    // --- 2) Aynı ziyaretçi için günlük limit kontrolü ---
    const ip = request.headers.get("CF-Connecting-IP") || "bilinmiyor";
    const dayKey = `usage-ip:${ip}:${new Date().toISOString().slice(0, 10)}`;
    const currentIpCount = parseInt((await env.AI_USAGE.get(dayKey)) || "0", 10);

    if (currentIpCount >= DAILY_IP_LIMIT) {
      return jsonResponse(
        { error: "Günlük deneme hakkınızı kullandınız. Yarın tekrar deneyebilir ya da WhatsApp'tan bize yazabilirsiniz." },
        429,
      );
    }

    // --- 3) Gelen veriyi oku ---
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Geçersiz istek." }, 400);
    }

    const userPrompt = String(body.prompt || "").trim().slice(0, 500);
    const contact = String(body.contact || "").trim().slice(0, 200);
    const code = String(body.code || "").trim().toUpperCase();

    if (!userPrompt) {
      return jsonResponse({ error: "Lütfen tasarımınızı kısaca açıklayın." }, 400);
    }

    if (!code) {
      return jsonResponse({ error: "Lütfen tasarım kodunu girin." }, 400);
    }

    // --- 3.5) Tasarım kodunu (voucher) doğrula ---
    const voucherKey = `voucher:${code}`;
    const voucherRaw = await env.AI_USAGE.get(voucherKey);

    if (voucherRaw === null) {
      return jsonResponse({ error: "Bu kod geçerli değil. Kodunu kontrol edip tekrar dene." }, 403);
    }

    const remainingUses = parseInt(voucherRaw, 10);

    if (!Number.isFinite(remainingUses) || remainingUses <= 0) {
      return jsonResponse({ error: "Bu kodun hakkı dolmuş. Yeni bir kod için bize WhatsApp'tan yazabilirsin." }, 403);
    }

    // --- 4) OpenAI'a görsel üretim isteği gönder ---
    const finalPrompt =
      "Professional tattoo design, clean black and white line art, high contrast stencil style, " +
      "centered composition on a plain white background, no color, no photorealism, no shading noise: " +
      userPrompt;

    let openaiData;

    try {
      const openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: finalPrompt,
          size: "1024x1024",
          quality: "medium",
          n: 1,
        }),
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        console.error("OpenAI hata:", errText);
        return jsonResponse({ error: "Tasarım oluşturulamadı, lütfen tekrar deneyin." }, 502);
      }

      openaiData = await openaiRes.json();
    } catch (error) {
      console.error("OpenAI isteği başarısız:", error);
      return jsonResponse({ error: "Tasarım oluşturulamadı, lütfen tekrar deneyin." }, 502);
    }

    const b64Image = openaiData?.data?.[0]?.b64_json;

    if (!b64Image) {
      return jsonResponse({ error: "Tasarım oluşturulamadı, lütfen tekrar deneyin." }, 502);
    }

    // --- 5) Sayaçları güncelle ---
    await env.AI_USAGE.put(monthKey, String(currentMonthCount + 1), {
      expirationTtl: 60 * 60 * 24 * 40,
    });
    await env.AI_USAGE.put(dayKey, String(currentIpCount + 1), {
      expirationTtl: 60 * 60 * 24 * 2,
    });
    await env.AI_USAGE.put(voucherKey, String(remainingUses - 1));

    // --- 6) Stüdyoya e-posta bildirimi gönder (Resend) ---
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: env.NOTIFY_EMAIL,
          subject: "Yeni AI Tasarım Talebi - Tattookan Art",
          html:
            `<p><strong>Yeni bir AI tasarım talebi geldi.</strong></p>` +
            `<p><strong>Kullanılan kod:</strong> ${escapeHtml(code)} (kalan hak: ${remainingUses - 1})</p>` +
            `<p><strong>İstek:</strong> ${escapeHtml(userPrompt)}</p>` +
            `<p><strong>Müşteri iletişim bilgisi:</strong> ${escapeHtml(contact) || "belirtilmedi"}</p>`,
          attachments: [
            {
              filename: "ai-tasarim.png",
              content: b64Image,
            },
          ],
        }),
      });
    } catch (error) {
      // E-posta gönderimi başarısız olsa bile müşteriye görseli göstermeye devam ediyoruz.
      console.error("Resend e-posta hatası:", error);
    }

    // --- 7) Görseli müşteriye geri döndür ---
    return jsonResponse({
      image: `data:image/png;base64,${b64Image}`,
      remainingVoucherUses: remainingUses - 1,
    });
  },
};
