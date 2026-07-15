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

  // Portfolyo JSON yükleme

  fetch("./data/tattoos.json")
    .then((response) => response.json())

    .then((data) => {
      // style ve reference artık JSON'da tutulmaz.
      // Kategori ve görsel dosya adından otomatik üretilir.
      const normalizedData = data.map(normalizeTattoo);

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

  function getCampaignRate(price, randomValue) {
    let minRate;
    let maxRate;

    if (price <= 3000) {
      minRate = 10;
      maxRate = 15;
    } else if (price <= 8000) {
      minRate = 15;
      maxRate = 20;
    } else if (price <= 20000) {
      minRate = 20;
      maxRate = 23;
    } else {
      minRate = 23;
      maxRate = 25;
    }

    return Math.floor(randomValue * (maxRate - minRate + 1)) + minRate;
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
      const campaignRate = getCampaignRate(Number(item.basePrice), random());

      const rawCampaignPrice =
        Number(item.basePrice) * (1 - campaignRate / 100);

      const campaignPrice = roundCampaignPrice(rawCampaignPrice);

      return {
        ...item,
        isDailyCampaign: true,
        campaignRate,
        campaignPrice,
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

      let oldPrice = Number(item.basePrice);

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
  alt="${item.title} - Tattookan Art"
  class="tattoo-image loading-blur"
  loading="${index < 6 ? "eager" : "lazy"}"
  fetchpriority="${index < 3 ? "high" : "auto"}"
  decoding="async"
  onload="this.classList.remove('loading-blur'); this.classList.add('image-loaded');">
${
  isCampaign
    ? `<span class="discount-badge campaign-badge">
         🔥 GÜNÜN KAMPANYASI
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

href="https://wa.me/905388746412?text=${encodeURIComponent(`Merhaba ${item.reference} kodlu ${item.style} çalışması hakkında bilgi almak istiyorum.`)}"

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
    const lightboxDiscountBadge = document.getElementById(
      "lightboxDiscountBadge",
    );

    if (discountRate > 0) {
      lightboxDiscountBadge.textContent = `%${discountRate} İNDİRİM`;
      lightboxDiscountBadge.style.display = "block";
    } else {
      lightboxDiscountBadge.style.display = "none";
    }
    const googleRate = item.rating;

    const oldPrice = Math.round(item.basePrice / (1 - discountRate / 100));

    document.getElementById("lightboxImg").src = item.image;

    document.getElementById("lightboxTitle").innerHTML = item.title;

    document.getElementById("lightboxStyle").innerHTML = item.style;

    const lightboxOldPrice = document.getElementById("lightboxOldPrice");
    const lightboxPrice = document.getElementById("lightboxPrice");

    if (discountRate > 0) {
      lightboxOldPrice.textContent = oldPrice.toLocaleString("tr-TR") + "₺";

      lightboxOldPrice.style.display = "block";
    } else {
      lightboxOldPrice.textContent = "";
      lightboxOldPrice.style.display = "none";
    }

    lightboxPrice.textContent = item.basePrice.toLocaleString("tr-TR") + "₺";

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
      `https://wa.me/905388746412?text=${encodeURIComponent(whatsappMessage)}`;
    const aiMessage = encodeURIComponent(
      `Merhaba Tattookan.art,

AI destekli özel dövme tasarımı hakkında bilgi almak istiyorum.

Referans çalışma:
${hasDistinctTitle ? `${itemReference} - ${item.title}` : itemReference}

Bu tarzdan ilham alarak bana özel bir tasarım oluşturabilir miyiz?

Teşekkür ederim.`,
    );

    document.getElementById("aiDesignRequest").href =
      `https://wa.me/905388746412?text=${aiMessage}`;

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
