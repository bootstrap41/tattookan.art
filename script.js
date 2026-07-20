// 1. Sayfa yüklenmeye başladığı an zamanı tut ve kaydırmayı kilitle
const preloaderStartTime = Date.now();
document.body.classList.add("loading");

window.addEventListener("load", function () {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    const minDisplayTime = 1900; // Ekranın en az kalacağı süre (1.8 saniye)
    const elapsedTime = Date.now() - preloaderStartTime; // Ne kadar süre geçtiğini hesapla

    // Eğer resimler çok hızlı yüklendiyse, 1.8 saniyeye tamamlamak için kalan süreyi bul
    const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

    // Kalan süre bittiğinde preloader'ı pürüzsüzce kaldır
    setTimeout(() => {
      preloader.classList.add("fade-out");
      document.body.classList.remove("loading");
    }, remainingTime);
  }
});
document.addEventListener("DOMContentLoaded", () => {
  let tattoos = [];
  let dailyCampaigns = [];
  let currentAiDesignReference = "";

  // Ayarlar yüklenene kadar (ya da yüklenemezse) kullanılacak varsayılanlar
  let siteSettings = {
    whatsappNumber: "905388746412",
    workingHoursText: "10:00 - 23:00",
    campaignRates: {
      "dark-realism": 25,
      "fine-line": 20,
      minimal: 15,
      "cover-up": 25,
      mandala: 20,
    },
    googleRating: {
      ratingValue: "5.0",
      reviewCount: "189",
    },
  };

  const grid = document.getElementById("tattoo-grid");

  const categories = [
    { id: "all", name: "Tümü" },
    { id: "daily-campaign", name: "🔥 Günün Kampanyaları" },
    { id: "dark-realism", name: "Dark Realism" },
    { id: "fine-line", name: "Fine Line" },
    { id: "minimal", name: "Minimal" },
    { id: "cover-up", name: "Cover Up" },
    { id: "mandala", name: "Mandala" },
  ];

  // Kategori butonlarını oluştur
  const filterContainer = document.getElementById("filter-buttons");

  categories.forEach((cat) => {
    const btn = document.createElement("button");

    btn.className = `btn btn-filter ${cat.id === "all" ? "active" : ""}`;

    btn.setAttribute("data-filter", cat.id);

    btn.textContent = cat.name;

    filterContainer.appendChild(btn);
  });

  function getDailyViews(item) {
    const storageKey = `tattooInterest_${item.id}`;
    const today = new Date();

    // Yerel tarihle YYYY-MM-DD oluşturur
    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const categoryRanges = {
      "dark-realism": {
        min: 16,
        max: 38,
        startMin: 140,
        startMax: 320,
      },

      "fine-line": {
        min: 10,
        max: 27,
        startMin: 100,
        startMax: 260,
      },

      "cover-up": {
        min: 6,
        max: 19,
        startMin: 70,
        startMax: 190,
      },

      mandala: {
        min: 8,
        max: 23,
        startMin: 80,
        startMax: 220,
      },
      minimal: {
        min: 8,
        max: 23,
        startMin: 80,
        startMax: 220,
      },
    };

    const range = categoryRanges[item.category] || {
      min: 8,
      max: 25,
      startMin: 80,
      startMax: 220,
    };

    function randomBetween(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function calculateDailyIncrease(date, min, max) {
      const day = date.getDay();

      let dailyMin = min;
      let dailyMax = max;

      // Cuma, cumartesi ve pazar günleri daha yüksek ilgi
      if (day === 5 || day === 6 || day === 0) {
        dailyMin = Math.round(min * 1.15);
        dailyMax = Math.round(max * 1.35);
      }

      // Bazı günlerde düşük hareket
      const activityChance = Math.random();

      if (activityChance < 0.08) {
        return 0;
      }

      if (activityChance < 0.2) {
        dailyMin = Math.max(2, Math.round(dailyMin * 0.45));
        dailyMax = Math.max(dailyMin, Math.round(dailyMax * 0.65));
      }

      return randomBetween(dailyMin, dailyMax);
    }

    let storedData;

    try {
      storedData = JSON.parse(localStorage.getItem(storageKey));
    } catch (error) {
      storedData = null;
    }

    // İlk kez oluşturuluyorsa başlangıç değeri ver
    if (
      !storedData ||
      typeof storedData.total !== "number" ||
      !storedData.lastUpdate
    ) {
      storedData = {
        total: randomBetween(range.startMin, range.startMax),
        lastUpdate: todayKey,
      };

      localStorage.setItem(storageKey, JSON.stringify(storedData));

      return storedData.total;
    }

    const lastDate = new Date(`${storedData.lastUpdate}T00:00:00`);
    const currentDate = new Date(`${todayKey}T00:00:00`);

    const passedDays = Math.floor(
      (currentDate - lastDate) / (1000 * 60 * 60 * 24),
    );

    if (passedDays > 0) {
      for (let dayIndex = 1; dayIndex <= passedDays; dayIndex++) {
        const calculationDate = new Date(lastDate);

        calculationDate.setDate(calculationDate.getDate() + dayIndex);

        storedData.total += calculateDailyIncrease(
          calculationDate,
          range.min,
          range.max,
        );
      }

      storedData.lastUpdate = todayKey;

      localStorage.setItem(storageKey, JSON.stringify(storedData));
    }

    return storedData.total;
  }

  function shuffleArray(array) {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[i],
      ];
    }

    return shuffled;
  }

  const categoryMeta = {
    "dark-realism": { style: "Dark Realism", prefix: "DR" },
    "fine-line": { style: "Fine Line", prefix: "FL" },
    mandala: { style: "Mandala", prefix: "MA" },
    "cover-up": { style: "Cover Up", prefix: "CU" },
    minimal: { style: "Minimal", prefix: "MI" },
  };

  function getImageFileName(imagePath) {
    return (
      String(imagePath || "")
        .split("/")
        .pop() || ""
    );
  }

  function createReference(item) {
    const meta = categoryMeta[item.category] || {
      style: item.category || "Tattoo",
      prefix: "TT",
    };

    const fileName = getImageFileName(item.image);

    // Yeni önerilen ad biçimi: dr-001-antik-misir.webp
    const prefixedMatch = fileName.match(/^([a-z]{2})-(\d{1,4})-/i);

    if (prefixedMatch) {
      return `${prefixedMatch[1].toUpperCase()}-${String(
        Number(prefixedMatch[2]),
      ).padStart(3, "0")}`;
    }

    // Mevcut ad biçimi: image1.webp
    const imageNumberMatch = fileName.match(/(?:image|img)[-_]?(\d+)/i);

    if (imageNumberMatch) {
      return `${meta.prefix}-${String(Number(imageNumberMatch[1])).padStart(
        3,
        "0",
      )}`;
    }

    // Son çare: benzersiz id kullanılır.
    return `${meta.prefix}-${String(item.id).padStart(3, "0")}`;
  }

  function normalizeTattoo(item) {
    const meta = categoryMeta[item.category] || {
      style: item.category || "Tattoo",
      prefix: "TT",
    };

    return {
      ...item,
      style: meta.style,
      reference: createReference(item),
    };
  }

  function sortByReference(items) {
    return [...items].sort((a, b) => {
      const refA = String(a.reference || "");
      const refB = String(b.reference || "");

      const [prefixA, numberTextA] = refA.split("-");
      const [prefixB, numberTextB] = refB.split("-");

      if (prefixA !== prefixB) {
        return prefixA.localeCompare(prefixB, "tr");
      }

      return (Number(numberTextA) || 0) - (Number(numberTextB) || 0);
    });
  }

  function updateBusinessSchemaRating() {
    const schemaTag = document.getElementById("business-schema");

    if (!schemaTag) return;

    try {
      const schema = JSON.parse(schemaTag.textContent);

      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: siteSettings.googleRating.ratingValue,
        reviewCount: siteSettings.googleRating.reviewCount,
        bestRating: "5",
      };

      schemaTag.textContent = JSON.stringify(schema);
    } catch (error) {
      console.error("İşletme schema'sı güncellenemedi:", error);
    }
  }

  function renderFAQ(items) {
    const faqAccordion = document.getElementById("faqAccordion");

    if (!faqAccordion) return;

    const FAQ_INITIAL_COUNT = 6;

    function buildFaqItem(item, index) {
      const headingId = `faqHeading${index}`;
      const collapseId = `faqCollapse${index}`;

      return `
        <div class="accordion-item bg-transparent border-0 mb-3">
          <h3 class="accordion-header" id="${headingId}">
            <button class="accordion-button collapsed custom-faq-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
              ${item.question}
            </button>
          </h3>
          <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#faqAccordion">
            <div class="accordion-body text-muted small-text">
              ${item.answer}
            </div>
          </div>
        </div>`;
    }

    const visibleItems = items.slice(0, FAQ_INITIAL_COUNT);
    const hiddenItems = items.slice(FAQ_INITIAL_COUNT);

    let html = visibleItems.map((item, index) => buildFaqItem(item, index)).join("");

    if (hiddenItems.length > 0) {
      html += `<div id="faqHiddenItems" style="display:none;">`;
      html += hiddenItems
        .map((item, index) => buildFaqItem(item, index + FAQ_INITIAL_COUNT))
        .join("");
      html += `</div>`;
      html += `
        <div class="text-center mt-2">
          <button type="button" id="faqShowMoreBtn" class="btn ai-design-btn btn-sm">
            Tüm Soruları Gör (+${hiddenItems.length})
          </button>
        </div>`;
    }

    faqAccordion.innerHTML = html;

    const faqShowMoreBtn = document.getElementById("faqShowMoreBtn");

    if (faqShowMoreBtn) {
      faqShowMoreBtn.addEventListener("click", () => {
        document.getElementById("faqHiddenItems").style.display = "block";
        faqShowMoreBtn.style.display = "none";
      });
    }

    injectFAQSchema(items);
  }

  function injectFAQSchema(items) {
    const existing = document.getElementById("faq-schema");

    if (existing) {
      existing.remove();
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-schema";
    script.textContent = JSON.stringify(schema);

    document.head.appendChild(script);
  }

  function renderReviews(items) {
    const reviewsGrid = document.getElementById("reviewsGrid");

    if (!reviewsGrid) return;

    const REVIEWS_INITIAL_COUNT = 6;

    function buildReviewCard(item) {
      return `
        <div class="col-md-4">
          <div class="review-card${item.featured ? " featured-card" : ""}">
            <div class="review-stars">★★★★★</div>
            <p class="review-text">"${item.text}"</p>
            <h5 class="client-name">- ${item.name}</h5>
          </div>
        </div>`;
    }

    const visibleItems = items.slice(0, REVIEWS_INITIAL_COUNT);
    const hiddenItems = items.slice(REVIEWS_INITIAL_COUNT);

    let html = visibleItems.map((item) => buildReviewCard(item)).join("");

    if (hiddenItems.length > 0) {
      html += `<div class="col-12"><div id="reviewsHiddenItems" class="row g-4 justify-content-center" style="display:none;">`;
      html += hiddenItems.map((item) => buildReviewCard(item)).join("");
      html += `</div></div>`;
      html += `
        <div class="col-12 text-center mt-3">
          <button type="button" id="reviewsShowMoreBtn" class="btn ai-design-btn btn-sm">
            Tüm Yorumları Gör (+${hiddenItems.length})
          </button>
        </div>`;
    }

    reviewsGrid.innerHTML = html;

    const reviewsShowMoreBtn = document.getElementById("reviewsShowMoreBtn");

    if (reviewsShowMoreBtn) {
      reviewsShowMoreBtn.addEventListener("click", () => {
        document.getElementById("reviewsHiddenItems").style.display = "flex";
        reviewsShowMoreBtn.style.display = "none";
      });
    }
  }

  // Site ayarları, FAQ, yorumlar ve portfolyo JSON yükleme

  Promise.all([
    fetch("./data/tattoos.json").then((r) => r.json()),
    fetch("./data/settings.json")
      .then((r) => r.json())
      .catch(() => null),
    fetch("./data/faq.json")
      .then((r) => r.json())
      .catch(() => null),
    fetch("./data/yorumlar.json")
      .then((r) => r.json())
      .catch(() => null),
  ])
    .then(([data, settingsData, faqData, reviewsData]) => {
      if (settingsData) {
        siteSettings = { ...siteSettings, ...settingsData };
      }

      updateBusinessSchemaRating();

      if (faqData && faqData.items) {
        renderFAQ(faqData.items);
      }

      if (reviewsData && reviewsData.items) {
        renderReviews(reviewsData.items);
      }

      // style ve reference artık JSON'da tutulmaz.
      // Kategori ve görsel dosya adından otomatik üretilir.
      const normalizedData = data.models.map(normalizeTattoo);

      dailyCampaigns = createDailyCampaigns(normalizedData);

      const campaignMap = new Map(
        dailyCampaigns.map((item) => [String(item.id), item]),
      );

      const dataWithCampaigns = normalizedData.map((item) => {
        const campaignItem = campaignMap.get(String(item.id));

        return campaignItem || item;
      });

      tattoos = shuffleArray(dataWithCampaigns);

      // Kampanya kategorisindeki sıralama
      dailyCampaigns = tattoos.filter((item) => item.isDailyCampaign === true);

      console.log("Yüklenen portfolyo:", tattoos);
      console.log("Günün kampanyaları:", dailyCampaigns);

      renderTattoos(tattoos);

      // Bildirim/paylaşım linklerinden gelen kullanıcıları doğrudan ilgili
      // kategoriye filtreleyip o bölüme kaydırıyoruz.
      // Örn: https://tattookanart.com/#daily-campaign -> "Günün Kampanyaları" filtresi
      const hashCategory = window.location.hash.replace("#", "");
      const matchingFilterBtn = document.querySelector(
        `.btn-filter[data-filter="${hashCategory}"]`,
      );

      if (matchingFilterBtn) {
        matchingFilterBtn.click();

        document
          .getElementById("models")
          .scrollIntoView({ behavior: "smooth" });
      }
    })

    .catch((error) => {
      console.error("JSON yüklenemedi:", error);

      grid.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          <i class="fas fa-triangle-exclamation text-gold mb-3" style="font-size: 2rem;"></i>
          <p class="mb-2">Modeller şu anda yüklenemedi.</p>
          <p class="small">Lütfen sayfayı yenileyin ya da daha sonra tekrar deneyin.</p>
        </div>`;
    });
  const styleDescriptions = {
    "Dark Realism": "Gölge ve Kontrast Sanatı",

    "Fine Line": "Mikro Detay & İnce Çizgi",

    Mandala: "Spiritüel ve Geometrik Dövmeler",

    "Cover Up": "Kapama Dövme Modelleri",

    Minimal: "Temiz & çizgili Dövme Modelleri",
  };

  // Kartları oluşturma

  function renderStars(rating) {
    const value = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
    let starsHTML = "";

    for (let i = 1; i <= 5; i++) {
      starsHTML +=
        i <= value
          ? '<i class="fas fa-star"></i>'
          : '<i class="far fa-star"></i>';
    }

    return starsHTML;
  }

  function createSeededRandom(seed) {
    return function () {
      seed += 0x6d2b79f5;

      let value = seed;

      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Kategoriye göre SABİT günlük kampanya indirim oranları.
  function getCampaignRate(category) {
    return siteSettings.campaignRates[category] || 20;
  }

  // item.basePrice, normal indirim (item.discount) ZATEN uygulanmış olan
  // güncel satış fiyatıdır — kampanya indirimini basePrice üzerinden
  // hesaplarsak "indirimin indirimi" oluşur. Bu yüzden kampanya hesaplaması
  // için önce indirim uygulanmamış GERÇEK orijinal fiyatı buluyoruz.
  function getTrueOriginalPrice(item) {
    const discountRate = Number(item.discount) || 0;

    if (discountRate <= 0) {
      return Number(item.basePrice);
    }

    return Math.round(Number(item.basePrice) / (1 - discountRate / 100));
  }

  function roundCampaignPrice(price) {
    if (price < 5000) {
      return Math.round(price / 50) * 50;
    }

    return Math.round(price / 100) * 100;
  }

  function createDailyCampaigns(items) {
    const campaignCategories = [
      "dark-realism",
      "fine-line",
      "minimal",
      "cover-up",
      "mandala",
    ];

    // Bütün cihazlarda Türkiye tarihini kullanır
    const dateText = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const dateSeed = Number(dateText.replaceAll("-", ""));

    const random = createSeededRandom(dateSeed);
    const selectedItems = [];
    const selectedIds = new Set();

    // Önce her kategoriden en az bir çalışma seç
    campaignCategories.forEach((categoryId) => {
      const categoryItems = items.filter(
        (item) => item.category === categoryId,
      );

      if (categoryItems.length === 0) {
        return;
      }

      const selectedIndex = Math.floor(random() * categoryItems.length);

      const selectedItem = categoryItems[selectedIndex];

      selectedItems.push(selectedItem);
      selectedIds.add(String(selectedItem.id));
    });

    // Geriye kalan ürünlerden 10 kampanyaya tamamla
    const remainingItems = items.filter(
      (item) => !selectedIds.has(String(item.id)),
    );

    for (let i = remainingItems.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(random() * (i + 1));

      [remainingItems[i], remainingItems[randomIndex]] = [
        remainingItems[randomIndex],
        remainingItems[i],
      ];
    }

    while (selectedItems.length < 10 && remainingItems.length > 0) {
      selectedItems.push(remainingItems.shift());
    }

    return selectedItems.map((item) => {
      const campaignRate = getCampaignRate(item.category);

      const trueOriginalPrice = getTrueOriginalPrice(item);

      const rawCampaignPrice = trueOriginalPrice * (1 - campaignRate / 100);

      const campaignPrice = roundCampaignPrice(rawCampaignPrice);

      return {
        ...item,
        isDailyCampaign: true,
        campaignRate,
        campaignPrice,
        // Kartlarda/lightbox'ta "eski fiyat" olarak bunu gösteriyoruz,
        // basePrice'ı değil (basePrice zaten indirimli olabilir).
        campaignOriginalPrice: trueOriginalPrice,
      };
    });
  }

  function getCampaignTimeLeft() {
    const now = new Date();

    const istanbulDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const campaignEnd = new Date(`${istanbulDate}T23:59:59+03:00`);

    const difference = campaignEnd - now;

    if (difference <= 0) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  }

  function updateCampaignCountdowns() {
    const timeLeft = getCampaignTimeLeft();

    const formattedTime = [
      String(timeLeft.hours).padStart(2, "0"),
      String(timeLeft.minutes).padStart(2, "0"),
      String(timeLeft.seconds).padStart(2, "0"),
    ].join(":");

    document.querySelectorAll(".campaign-countdown").forEach((element) => {
      element.textContent = formattedTime;
    });

    if (
      timeLeft.hours === 0 &&
      timeLeft.minutes === 0 &&
      timeLeft.seconds === 0
    ) {
      setTimeout(() => {
        location.reload();
      }, 1200);
    }
  }

  function renderTattoos(data) {
    grid.innerHTML = "";
    let cardsHTML = "";

    if (data.length === 0) {
      grid.innerHTML = `
            <p class="text-center text-muted w-100">
            Bu kategoriye ait çalışma bulunamadı.
            </p>`;

      return;
    }

    data.forEach((item, index) => {
      const totalViews = getDailyViews(item);

      const discountRate = Number(item.discount) || 0;

      const isCampaign = item.isDailyCampaign === true;

      const newPrice = isCampaign
        ? Number(item.campaignPrice)
        : Number(item.basePrice);

      let oldPrice = isCampaign
        ? Number(item.campaignOriginalPrice)
        : Number(item.basePrice);

      if (!isCampaign && discountRate > 0) {
        oldPrice = Math.round(newPrice / (1 - discountRate / 100));
      }

      const formattedOldPrice = oldPrice.toLocaleString("tr-TR") + "₺";

      const formattedNewPrice = newPrice.toLocaleString("tr-TR") + "₺";

      const googleRate = item.rating;

      const card = `


<div class="col-6 col-md-6 col-lg-4 mb-3 px-2">


<div class="premium-card"
onclick="openLightbox('${item.id}')">


<div class="card-img-wrapper">


<img
  src="${item.image}"
  alt="${item.title} - ${item.style} dövme - Tattookan Art İzmit"
  class="tattoo-image loading-blur"
  loading="${index < 6 ? "eager" : "lazy"}"
  fetchpriority="${index < 3 ? "high" : "auto"}"
  decoding="async"
  onload="this.classList.remove('loading-blur'); this.classList.add('image-loaded');">
${
  isCampaign
    ? `<span class="discount-badge campaign-badge">
         🔥 %${item.campaignRate} KAMPANYA
       </span>`
    : discountRate > 0
      ? `<span class="discount-badge">
           %${discountRate} İNDİRİM
         </span>`
      : ""
}


<div class="card-overlay">


<button

class="overlay-btn detail-btn"

onclick="event.stopPropagation(); openLightbox('${item.id}')">

<i class="fas fa-search-plus"></i>

Detayları Gör

</button>




<a

href="https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(`Merhaba ${item.reference} kodlu ${item.style} çalışması hakkında bilgi almak istiyorum.`)}"

target="_blank"

class="overlay-btn whatsapp-btn-card"

onclick="event.stopPropagation();">


<i class="fab fa-whatsapp"></i>

WhatsApp Randevu


</a>


</div>


</div>




<div class="p-4">


<h5 class="text-gold mb-1">

${item.style} <span class="ref-number">${item.reference}</span>

</h5>



<p class="style-description">

${styleDescriptions[item.style] || ""}

</p>



<div class="google-rating">


${renderStars(googleRate)}


<span>

${googleRate} Google

</span>


</div>






<div class="price-container">

  ${
    isCampaign || discountRate > 0
      ? `<span class="old-price">
           ${formattedOldPrice}
         </span>`
      : ""
  }

  <span class="new-price">
    ${formattedNewPrice}
  </span>

</div>

${
  isCampaign
    ? `
      <div class="campaign-timer">
        <span class="campaign-timer-label">
          Kampanya bitimine
        </span>

        <strong class="campaign-countdown">
          00:00:00
        </strong>
      </div>
    `
    : ""
}




 <div class="availability">

🟢 Bugün uygun randevu

</div> 

<div class="weekly-views">
    <i class="fas fa-fire"></i>
    Kişi bu modeli inceledi: ${totalViews}
</div>


</div>



</div>


</div>


`;

      cardsHTML += card;
    });
    grid.innerHTML = cardsHTML;
    updateCampaignCountdowns();
  }

  // Filtreleme

  const filterBtns = document.querySelectorAll(".btn-filter");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      filterBtns.forEach((b) => b.classList.remove("active"));

      e.target.classList.add("active");

      const filterValue = e.target.getAttribute("data-filter");

      let filteredData;

      if (filterValue === "all") {
        filteredData = tattoos;
      } else if (filterValue === "daily-campaign") {
        filteredData = sortByReference(dailyCampaigns);
      } else {
        filteredData = sortByReference(
          tattoos.filter((tattoo) => tattoo.category === filterValue),
        );
      }

      renderTattoos(filteredData);
    });
  });

  // Arama

  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("keyup", (e) => {
    const text = e.target.value.toLowerCase();

    const filtered = tattoos.filter((t) => {
      const searchableText = [t.title, t.style, t.category, t.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(text);
    });

    renderTattoos(filtered);
  });

  // Lightbox

  window.openLightbox = function (id) {
    const item = tattoos.find((tattoo) => String(tattoo.id) === String(id));

    if (!item) {
      console.error("Dövme bulunamadı:", id);
      return;
    }

    document.getElementById("lightboxTitle").innerHTML = item.title;

    document.getElementById("lightboxStyle").innerHTML = item.style;

    document.getElementById("lightboxDescription").innerHTML =
      item.description || "";

    document.getElementById("lightboxCategory").innerHTML =
      `${item.style} · ${item.reference}`;

    const discountRate = Number(item.discount) || 0;
    const isCampaign = item.isDailyCampaign === true;
    const lightboxDiscountBadge = document.getElementById(
      "lightboxDiscountBadge",
    );

    if (isCampaign) {
      lightboxDiscountBadge.textContent = `🔥 %${item.campaignRate} KAMPANYA`;
      lightboxDiscountBadge.style.display = "block";
    } else if (discountRate > 0) {
      lightboxDiscountBadge.textContent = `%${discountRate} İNDİRİM`;
      lightboxDiscountBadge.style.display = "block";
    } else {
      lightboxDiscountBadge.style.display = "none";
    }
    const googleRate = item.rating;

    const newPrice = isCampaign
      ? Number(item.campaignPrice)
      : Number(item.basePrice);

    const oldPrice = isCampaign
      ? Number(item.campaignOriginalPrice)
      : Math.round(item.basePrice / (1 - discountRate / 100));

    const lightboxImgEl = document.getElementById("lightboxImg");
    lightboxImgEl.src = item.image;
    lightboxImgEl.alt = `${item.title} - ${item.style} dövme çalışması - Tattookan Art İzmit`;

    document.getElementById("lightboxTitle").innerHTML = item.title;

    document.getElementById("lightboxStyle").innerHTML = item.style;

    const lightboxOldPrice = document.getElementById("lightboxOldPrice");
    const lightboxPrice = document.getElementById("lightboxPrice");

    if (isCampaign || discountRate > 0) {
      lightboxOldPrice.textContent = oldPrice.toLocaleString("tr-TR") + "₺";

      lightboxOldPrice.style.display = "block";
    } else {
      lightboxOldPrice.textContent = "";
      lightboxOldPrice.style.display = "none";
    }

    lightboxPrice.textContent = newPrice.toLocaleString("tr-TR") + "₺";

    const itemReference = `${item.reference} · ${item.style}`;

    // item.title bazı kayıtlarda item.style ile birebir aynı oluyor
    // (örn. ikisi de "Fine Line"); bu durumda parantez içini tekrar etmiyoruz.
    const hasDistinctTitle =
      item.title &&
      item.title.trim().toLowerCase() !== item.style.trim().toLowerCase();

    const whatsappMessage = hasDistinctTitle
      ? `Merhaba "${itemReference}" (${item.title}) çalışması için bilgi almak istiyorum.`
      : `Merhaba "${itemReference}" çalışması için bilgi almak istiyorum.`;

    document.getElementById("lightboxWhatsapp").href =
      `https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    // AI Tasarım penceresi açıldığında hangi çalışmadan ilham alındığını
    // gösterebilmek için referansı burada saklıyoruz.
    currentAiDesignReference = hasDistinctTitle
      ? `${itemReference} - ${item.title}`
      : itemReference;

    const modal = new bootstrap.Modal(document.getElementById("lightboxModal"));

    modal.show();
  };

  // Yorumlar

  const reviews = [
    {
      name: "Ahmet Y.",
      stars: 5,
      text: "Okan Bey işinde gerçekten bir numara. Stüdyonun hijyeni ve tasarımların kalitesi harika.",
    },

    {
      name: "Ceren K.",
      stars: 5,
      text: "Fine line dövmemi tam istediğim gibi zarif ve kusursuz yaptı.",
    },

    {
      name: "Burak T.",
      stars: 5,
      text: "Dark Realism çalışması inanılmaz detaylıydı. Çok memnun kaldım.",
    },
  ];

  const reviewsContainer = document.getElementById("reviews-container");

  // "reviews" bölümü HTML'de şu an yorum satırına alınmış (bkz. index.html).
  // Element DOM'da yoksa bu bloğu atla, aksi halde script burada durur.
  if (reviewsContainer) {
    reviews.forEach((rev) => {
      let stars = "";

      for (let i = 0; i < rev.stars; i++) {
        stars += '<i class="fas fa-star text-gold"></i>';
      }

      reviewsContainer.innerHTML += `

        <div class="col-md-4 mb-4">

            <div class="review-card">


                <div class="mb-3">
                ${stars}
                </div>


                <p class="text-white">
                "${rev.text}"
                </p>


                <span class="text-muted fw-bold">
                ${rev.name}
                </span>


            </div>

        </div>

        `;
    });
  }

  // updateCampaignCountdowns bu closure içinde tanımlı olduğu için
  // setInterval çağrısı da burada olmalı, aksi halde fonksiyon
  // görünmez ve geri sayım hiç tetiklenmez (sabit kalır).
  setInterval(updateCampaignCountdowns, 1000);

  // === AI TASARIM TALEBİ ===

  const AI_DESIGN_WORKER_URL = "https://tattookan-ai-tasarim.tattookan-art.workers.dev";

  const aiDesignRequestBtn = document.getElementById("aiDesignRequest");
  const aiDesignSubmitBtn = document.getElementById("aiDesignSubmit");
  const aiDesignFormArea = document.getElementById("aiDesignFormArea");
  const aiDesignLoading = document.getElementById("aiDesignLoading");
  const aiDesignResult = document.getElementById("aiDesignResult");
  const aiDesignError = document.getElementById("aiDesignError");
  const aiDesignReference = document.getElementById("aiDesignReference");

  // Not: Fotoğraf yükleme özelliği, OpenAI'nin gerçek insan fotoğraflarını
  // düzenleme konusundaki katı güvenlik politikası nedeniyle güvenilir
  // çalışmadığı için devre dışı bırakıldı (bkz. index.html'deki pasif buton).

  function resetAiDesignModal() {
    if (aiDesignFormArea) aiDesignFormArea.style.display = "block";
    if (aiDesignLoading) aiDesignLoading.style.display = "none";
    if (aiDesignResult) aiDesignResult.style.display = "none";
    if (aiDesignError) aiDesignError.style.display = "none";
  }

  function openAiDesignModal(referenceText) {
    resetAiDesignModal();

    if (aiDesignReference) {
      aiDesignReference.textContent = referenceText
        ? `İlham alınan çalışma: ${referenceText}`
        : "";
    }

    const buyCodeBtn = document.getElementById("aiDesignBuyCodeBtn");

    if (buyCodeBtn) {
      const buyCodeMessage = encodeURIComponent(
        "Merhaba, AI Tasarım özelliği için 100₺ karşılığında 3 haklık bir kod almak istiyorum.",
      );

      buyCodeBtn.href = `https://wa.me/${siteSettings.whatsappNumber}?text=${buyCodeMessage}`;
    }

    // Lightbox açıksa kapatıp AI Tasarım penceresini açıyoruz.
    const lightboxEl = document.getElementById("lightboxModal");
    const lightboxInstance = bootstrap.Modal.getInstance(lightboxEl);

    if (lightboxInstance) {
      lightboxInstance.hide();
    }

    const aiModal = new bootstrap.Modal(document.getElementById("aiDesignModal"));

    aiModal.show();
  }

  if (aiDesignRequestBtn) {
    aiDesignRequestBtn.addEventListener("click", () => {
      openAiDesignModal(currentAiDesignReference);
    });
  }

  // Yüzen butonlar (AI Tasarım, Hediye) — WhatsApp butonu gibi ekranda
  // sabit (fixed) duruyor, ama basılı tutup sürükleyerek ekranın istenen
  // yerine taşınabiliyor. Ortak mantığı tek bir fonksiyonda topluyoruz.
  function makeFloatButtonDraggable(el, onTap) {
    if (!el) return;

    let isDragging = false;
    let wasDragged = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    function startDrag(clientX, clientY) {
      const rect = el.getBoundingClientRect();

      startLeft = rect.left;
      startTop = rect.top;
      startX = clientX;
      startY = clientY;
      isDragging = true;
      wasDragged = false;

      // Sabit bottom/right (ya da left) konumundan, serbest top/left
      // konumuna geçiyoruz ki sürüklerken ekranın her yerine taşınabilsin.
      el.style.left = `${startLeft}px`;
      el.style.top = `${startTop}px`;
      el.style.right = "auto";
      el.style.bottom = "auto";
    }

    function moveDrag(clientX, clientY) {
      if (!isDragging) return;

      const dx = clientX - startX;
      const dy = clientY - startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        wasDragged = true;
      }

      const maxLeft = window.innerWidth - el.offsetWidth;
      const maxTop = window.innerHeight - el.offsetHeight;

      const newLeft = Math.min(Math.max(0, startLeft + dx), maxLeft);
      const newTop = Math.min(Math.max(0, startTop + dy), maxTop);

      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
    }

    function endDrag() {
      isDragging = false;
    }

    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    });
    document.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
    document.addEventListener("mouseup", endDrag);

    el.addEventListener(
      "touchstart",
      (e) => {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
      },
      { passive: true },
    );
    document.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        moveDrag(touch.clientX, touch.clientY);
      },
      { passive: true },
    );
    document.addEventListener("touchend", endDrag);

    // Sürükleme bittiğinde tıklama (click) olayı da tetiklenebiliyor —
    // gerçekten sürüklendiyse açmıyoruz, sadece taşımayla kalıyoruz.
    el.addEventListener("click", () => {
      if (wasDragged) return;

      onTap();
    });
  }

  const aiDesignFloatBtn = document.getElementById("aiDesignFloatBtn");
  makeFloatButtonDraggable(aiDesignFloatBtn, () => openAiDesignModal(""));

  if (aiDesignSubmitBtn) {
    aiDesignSubmitBtn.addEventListener("click", () => {
      const code = document.getElementById("aiDesignCode").value.trim();
      const prompt = document.getElementById("aiDesignPrompt").value.trim();
      const contact = document.getElementById("aiDesignContact").value.trim();

      if (!code) {
        aiDesignError.textContent = "Lütfen tasarım kodunu gir.";
        aiDesignError.style.display = "block";
        return;
      }

      if (!prompt) {
        aiDesignError.textContent = "Lütfen ne istediğini kısaca yaz.";
        aiDesignError.style.display = "block";
        return;
      }

      // Türkiye cep telefonu formatı doğrulaması: 05XXXXXXXXX ya da +905XXXXXXXXX
      // gibi varyasyonları kabul ediyoruz; boşluk/tire gibi karakterleri temizleyip kontrol ediyoruz.
      const normalizedContact = contact.replace(/[\s()-]/g, "");
      const turkishPhoneRegex = /^(\+90|0090|90|0)?5\d{9}$/;

      if (!contact) {
        aiDesignError.textContent = "Telefon numaran zorunlu, seninle iletişime geçebilmemiz için gerekli.";
        aiDesignError.style.display = "block";
        return;
      }

      if (!turkishPhoneRegex.test(normalizedContact)) {
        aiDesignError.textContent = "Lütfen geçerli bir Türkiye cep telefonu numarası gir (örn. 05XX XXX XX XX).";
        aiDesignError.style.display = "block";
        return;
      }

      aiDesignFormArea.style.display = "none";
      aiDesignError.style.display = "none";
      aiDesignResult.style.display = "none";
      aiDesignLoading.style.display = "block";

      const aiDesignLoadingText = document.getElementById("aiDesignLoadingText");
      if (aiDesignLoadingText) {
        aiDesignLoadingText.textContent = "Tasarımın oluşturuluyor, bu birkaç saniye sürebilir...";
      }

      const fullPrompt = currentAiDesignReference
        ? `${currentAiDesignReference} çalışmasından ilham alınarak: ${prompt}`
        : prompt;

      fetch(AI_DESIGN_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, prompt: fullPrompt, contact }),
      })
        .then((res) =>
          res.json().then((data) => ({ ok: res.ok, data })),
        )
        .then(({ ok, data }) => {
          aiDesignLoading.style.display = "none";

          if (!ok) {
            aiDesignFormArea.style.display = "block";
            aiDesignError.textContent = data.error || "Bir şeyler ters gitti, lütfen tekrar dene.";
            aiDesignError.style.display = "block";
            return;
          }

          document.getElementById("aiDesignImage").src = data.image;
          document.getElementById("aiDesignDownload").href = data.image;

          const remainingUsesText = document.getElementById("aiDesignRemainingUses");

          if (remainingUsesText) {
            remainingUsesText.textContent =
              typeof data.remainingVoucherUses === "number"
                ? data.remainingVoucherUses > 0
                  ? `Bu koddan kalan hakkın: ${data.remainingVoucherUses}`
                  : "Bu kodun hakkı bitti, yeni bir kod almak için bize yazabilirsin."
                : "";
          }

          const whatsappText = encodeURIComponent(
            `Merhaba, AI ile oluşturduğum bir tasarımım var, bu tasarım hakkında konuşmak istiyorum. (İndirdiğim görseli bu sohbete ekliyorum.)`,
          );

          document.getElementById("aiDesignWhatsapp").href =
            `https://wa.me/${siteSettings.whatsappNumber}?text=${whatsappText}`;

          aiDesignResult.style.display = "block";
        })
        .catch(() => {
          aiDesignLoading.style.display = "none";
          aiDesignFormArea.style.display = "block";
          aiDesignError.textContent = "Bağlantı hatası oluştu, lütfen tekrar dene.";
          aiDesignError.style.display = "block";
        });
    });
  }

  // === HAFTALIK HEDİYE DÖVME ===

  const giftFloatBtn = document.getElementById("giftFloatBtn");
  const giftLoadingState = document.getElementById("giftLoadingState");
  const giftContentState = document.getElementById("giftContentState");
  const giftAvailableArea = document.getElementById("giftAvailableArea");
  const giftClaimedArea = document.getElementById("giftClaimedArea");
  const giftSuccessArea = document.getElementById("giftSuccessArea");
  const giftErrorArea = document.getElementById("giftErrorArea");
  const giftClaimBtn = document.getElementById("giftClaimBtn");

  let currentGiftData = null;

  function openGiftModal() {
    giftLoadingState.style.display = "block";
    giftContentState.style.display = "none";
    giftAvailableArea.style.display = "none";
    giftClaimedArea.style.display = "none";
    giftSuccessArea.style.display = "none";
    giftErrorArea.style.display = "none";

    const giftModal = new bootstrap.Modal(document.getElementById("giftModal"));

    giftModal.show();

    fetch("./data/haftalik-hediye.json")
      .then((r) => r.json())
      .then((giftData) => {
        currentGiftData = giftData;

        if (!giftData.image || !giftData.title) {
          giftLoadingState.style.display = "none";
          giftErrorArea.textContent = "Şu an aktif bir hediye kampanyası yok, yakında tekrar kontrol et!";
          giftErrorArea.style.display = "block";
          giftContentState.style.display = "block";
          return Promise.reject(new Error("no-active-gift"));
        }

        return fetch(
          `${AI_DESIGN_WORKER_URL}/gift-status?giftId=${encodeURIComponent(giftData.giftId)}`,
        ).then((r) => r.json());
      })
      .then((statusData) => {
        const giftData = currentGiftData;

        giftLoadingState.style.display = "none";

        document.getElementById("giftImage").src = giftData.image;
        document.getElementById("giftTitle").textContent = giftData.title;
        document.getElementById("giftOldPrice").textContent =
          Number(giftData.price).toLocaleString("tr-TR") + "₺";

        giftContentState.style.display = "block";

        if (statusData && statusData.claimed) {
          giftClaimedArea.style.display = "block";
        } else {
          giftAvailableArea.style.display = "block";
        }
      })
      .catch((error) => {
        if (error && error.message === "no-active-gift") return;

        giftLoadingState.style.display = "none";
        giftContentState.style.display = "block";
        giftErrorArea.textContent = "Hediye bilgisi yüklenemedi, lütfen tekrar dene.";
        giftErrorArea.style.display = "block";
      });
  }

  makeFloatButtonDraggable(giftFloatBtn, openGiftModal);

  // === PAYLAŞ BUTONU ===

  const shareFloatBtn = document.getElementById("shareFloatBtn");

  function shareCurrentPage() {
    const shareData = {
      title: document.title,
      text: "Tattookan Art — İzmit'in premium dövme stüdyosu",
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        // Kullanıcı paylaşım penceresini iptal ettiyse sessizce geç.
      });
      return;
    }

    // Web Share API desteklenmiyorsa (çoğunlukla masaüstü) linki kopyala.
    navigator.clipboard
      .writeText(shareData.url)
      .then(() => {
        shareFloatBtn.innerHTML = '<i class="fas fa-check"></i>';

        setTimeout(() => {
          shareFloatBtn.innerHTML = '<i class="fas fa-share-nodes"></i>';
        }, 1500);
      })
      .catch(() => {
        window.prompt("Linki kopyalamak için:", shareData.url);
      });
  }

  makeFloatButtonDraggable(shareFloatBtn, shareCurrentPage);

  if (giftClaimBtn) {
    giftClaimBtn.addEventListener("click", () => {
      const name = document.getElementById("giftName").value.trim();
      const phone = document.getElementById("giftPhone").value.trim();

      if (!name) {
        giftErrorArea.textContent = "Lütfen adını yaz.";
        giftErrorArea.style.display = "block";
        return;
      }

      const normalizedPhone = phone.replace(/[\s()-]/g, "");
      const turkishPhoneRegex = /^(\+90|0090|90|0)?5\d{9}$/;

      if (!phone || !turkishPhoneRegex.test(normalizedPhone)) {
        giftErrorArea.textContent = "Lütfen geçerli bir Türkiye cep telefonu numarası gir.";
        giftErrorArea.style.display = "block";
        return;
      }

      giftErrorArea.style.display = "none";
      giftClaimBtn.disabled = true;
      giftClaimBtn.textContent = "Gönderiliyor...";

      fetch(`${AI_DESIGN_WORKER_URL}/gift-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: currentGiftData ? currentGiftData.giftId : "",
          name,
          phone,
        }),
      })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          giftClaimBtn.disabled = false;
          giftClaimBtn.innerHTML = '<i class="fas fa-gift"></i> AL';

          if (!ok) {
            giftAvailableArea.style.display = "none";
            giftClaimedArea.style.display = "block";
            giftErrorArea.textContent = data.error || "";
            giftErrorArea.style.display = data.error ? "block" : "none";
            return;
          }

          giftAvailableArea.style.display = "none";
          giftSuccessArea.style.display = "block";
        })
        .catch(() => {
          giftClaimBtn.disabled = false;
          giftClaimBtn.innerHTML = '<i class="fas fa-gift"></i> AL';
          giftErrorArea.textContent = "Bağlantı hatası oluştu, lütfen tekrar dene.";
          giftErrorArea.style.display = "block";
        });
    });
  }

});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")

      .then(() => {
        console.log("✅ Service Worker aktif.");
      })

      .catch((error) => {
        console.log(error);
      });
  });
}

let deferredInstallPrompt = null;

const installAppBox = document.getElementById("installAppBox");

const installAppButton = document.getElementById("installAppButton");

const closeInstallApp = document.getElementById("closeInstallApp");

function isAppInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// iOS Safari, "beforeinstallprompt" olayını HİÇ desteklemiyor (Apple kısıtlaması) —
// yani Android'deki gibi otomatik bir "Ana Ekrana Ekle" penceresi tetiklenemiyor.
// Kullanıcının Paylaş menüsünden elle eklemesi gerekiyor, biz sadece
// nasıl yapılacağını gösteren bir talimat kutusu gösterebiliyoruz.
function isIOSDevice() {
  const isAppleTouch = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // iPadOS 13+ kendini "Mac" olarak tanıtıyor, dokunmatik ekran ile ayırt ediyoruz.
  const isIPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return isAppleTouch || isIPadOS;
}

function isSafariBrowser() {
  const ua = navigator.userAgent;

  // Safari kontrolü: "Safari" geçmeli ama Chrome/Firefox/Edge gibi
  // Safari motorunu kullanan diğer iOS tarayıcıları hariç tutulmalı
  // (iOS'ta Chrome de Safari motorunu kullanır ama web push'u desteklemez).
  return /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
}

if (isIOSDevice() && !isAppInstalled()) {
  const closedAt = Number(localStorage.getItem("installBoxClosedAt"));

  const oneDay = 24 * 60 * 60 * 1000;

  const canShowAgain = !closedAt || Date.now() - closedAt >= oneDay;

  const iosInstallBox = document.getElementById("installAppBox");
  const iosInstallSubtext = document.getElementById("installAppSubtext");
  const iosInstallButton = document.getElementById("installAppButton");

  if (iosInstallBox && canShowAgain) {
    if (iosInstallSubtext) {
      iosInstallSubtext.textContent = isSafariBrowser()
        ? "Paylaş simgesine (⬆️) dokun, sonra 'Ana Ekrana Ekle' seçeneğine bas."
        : "Bu özelliği kullanmak için siteyi Safari'de açman gerekiyor.";
    }

    if (iosInstallButton) {
      iosInstallButton.textContent = "Anladım";

      iosInstallButton.addEventListener("click", () => {
        iosInstallBox.classList.remove("show");

        localStorage.setItem("installBoxClosedAt", Date.now().toString());
      });
    }

    iosInstallBox.classList.add("show");
  }
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();

  deferredInstallPrompt = event;

  const closedAt = Number(localStorage.getItem("installBoxClosedAt"));

  const oneDay = 24 * 60 * 60 * 1000;

  const canShowAgain = !closedAt || Date.now() - closedAt >= oneDay;

  if (installAppBox && !isAppInstalled() && canShowAgain) {
    installAppBox.classList.add("show");
  }
});

if (installAppButton) {
  installAppButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    deferredInstallPrompt.prompt();

    const result = await deferredInstallPrompt.userChoice;

    console.log("PWA kurulum sonucu:", result.outcome);

    deferredInstallPrompt = null;
    installAppBox?.classList.remove("show");
  });
}

if (closeInstallApp) {
  closeInstallApp.addEventListener("click", () => {
    installAppBox?.classList.remove("show");

    localStorage.setItem("installBoxClosedAt", Date.now().toString());
  });
}

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installAppBox?.classList.remove("show");

  console.log("✅ Tattookan uygulaması kuruldu.");
});

// === MENÜ LİNKLERİNDE KAYDIRMA DÜZELTMESİ ===
// Sayfada 68 dövme kartı ve hero videosu olduğu için görseller yüklendikçe
// sayfa yüksekliği değişiyor. Bu yüzden "#contact" gibi bir bağlantıya
// tıklandığında hedef, ilk kaydırma anında henüz "yerinde" olmayabiliyor
// (görseller yüklendikçe aşağı kayıyor) — bu da "iki kere tıklamak gerekiyor"
// hissi veriyor. Aşağıdaki fonksiyon, kaydırmayı bir kaç kez tekrarlayarak
// düzeltiyor.

function scrollToHashTarget(hash) {
  const target = document.querySelector(hash);

  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToHashWithCorrection(hash) {
  scrollToHashTarget(hash);

  // İçerik yüklendikçe pozisyon kayabiliyor, bu yüzden birkaç kez
  // tekrar düzeltiyoruz (görseller/video tamamen yüklenene kadar).
  setTimeout(() => scrollToHashTarget(hash), 400);
  setTimeout(() => scrollToHashTarget(hash), 900);

  window.addEventListener("load", () => scrollToHashTarget(hash), {
    once: true,
  });
}

// Aynı sayfadaki (#...) menü linklerine tıklanınca düzeltmeli kaydırma uygula
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");

    if (!hash || hash === "#") {
      return;
    }

    const target = document.querySelector(hash);

    if (!target) {
      return;
    }

    event.preventDefault();

    if (history.pushState) {
      history.pushState(null, "", hash);
    }

    scrollToHashWithCorrection(hash);
  });
});

// Başka bir sayfadan "index.html#contact" gibi bir linkle gelindiyse,
// sayfa tam yüklendikten sonra doğru bölüme kaydır.
if (window.location.hash) {
  scrollToHashWithCorrection(window.location.hash);
}
