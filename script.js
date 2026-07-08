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

  const grid = document.getElementById("tattoo-grid");

  const categories = [
    { id: "all", name: "Tümü" },
    { id: "dark-realism", name: "Dark Realism" },
    { id: "fine-line", name: "Fine Line" },
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

  // Portfolyo JSON yükleme

  fetch("./data/tattoos.json")
    .then((response) => response.json())

    .then((data) => {
      tattoos = data;

      console.log("Yüklenen portfolyo:", tattoos);

      renderTattoos(tattoos);
    })

    .catch((error) => {
      console.error("JSON yüklenemedi:", error);
    });
  const styleDescriptions = {
    "Dark Realism": "Premium Black & Grey",

    "Fine Line": "Minimal Tattoo",

    Mandala: "Sacred Geometry",

    "Cover Up": "Tattoo Transformation",
  };

  // Kartları oluşturma

  function renderTattoos(data) {
    grid.innerHTML = "";

    if (data.length === 0) {
      grid.innerHTML = `
            <p class="text-center text-muted w-100">
            Bu kategoriye ait çalışma bulunamadı.
            </p>`;

      return;
    }

    data.forEach((item) => {
      const discountRate = 35;

      const newPrice = item.basePrice;

      const oldPrice = Math.round(newPrice / (1 - discountRate / 100));

      const formattedOldPrice = oldPrice.toLocaleString("tr-TR") + "₺";

      const formattedNewPrice = newPrice.toLocaleString("tr-TR") + "₺";

      // Google puanı

      const googleRates = ["4.7", "4.8", "4.9", "5.0"];

      const googleRate =
        googleRates[Math.floor(Math.random() * googleRates.length)];

      const card = `


<div class="col-6 col-md-6 col-lg-4 mb-3 px-2">


<div class="premium-card"
onclick="openLightbox('${item.id}')">


<div class="card-img-wrapper">


<img
    src="${item.image}"
    alt="${item.title} - Tattookan Art"
    loading="lazy"
    decoding="async">



<div class="card-overlay">


<button

class="overlay-btn detail-btn"

onclick="event.stopPropagation(); openLightbox('${item.id}')">

<i class="fas fa-search-plus"></i>

Detayları Gör

</button>



<a

href="https://wa.me/905388746412?text=Merhaba ${item.style} çalışması hakkında bilgi almak istiyorum."

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

${item.style}

</h5>



<p class="style-description">

${styleDescriptions[item.style] || ""}

</p>



<div class="google-rating">


<i class="fas fa-star"></i>
<i class="fas fa-star"></i>
<i class="fas fa-star"></i>
<i class="fas fa-star"></i>
<i class="fas fa-star"></i>


<span>

${googleRate} Google

</span>


</div>




<div class="price-container">


<span class="old-price">

${formattedOldPrice}

</span>


<span class="new-price">

${formattedNewPrice}

</span>


</div>




<div class="availability">

🟢 Bugün uygun randevu

</div>


</div>



</div>


</div>


`;

      grid.innerHTML += card;
    });
  }

  // Filtreleme

  const filterBtns = document.querySelectorAll(".btn-filter");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      filterBtns.forEach((b) => b.classList.remove("active"));

      e.target.classList.add("active");

      const filterValue = e.target.getAttribute("data-filter");

      const filteredData =
        filterValue === "all"
          ? tattoos
          : tattoos.filter((t) => t.category === filterValue);

      renderTattoos(filteredData);
    });
  });

  // Arama

  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("keyup", (e) => {
    const text = e.target.value.toLowerCase();

    const filtered = tattoos.filter((t) =>
      t.title.toLowerCase().includes(text),
    );

    renderTattoos(filtered);
  });

  // Lightbox

  window.openLightbox = function (id) {
    const item = tattoos.find((tattoo) => String(tattoo.id) === String(id));
    document.getElementById("lightboxTitle").innerHTML = item.title;

    document.getElementById("lightboxStyle").innerHTML = item.style;
    document.getElementById("lightboxDescription").innerHTML =
      item.description || "";

    document.getElementById("lightboxNeedles").innerHTML = item.needles || "";

    document.getElementById("lightboxTechnique").innerHTML =
      item.technique || "";

    document.getElementById("lightboxCategory").innerHTML = item.style;

    if (!item) return;

    const discountRate = 35;
    const ratings = ["4.7", "4.8", "4.9", "5.0"];

    const googleRate = ratings[Math.floor(Math.random() * ratings.length)];

    const oldPrice = Math.round(item.basePrice / (1 - discountRate / 100));

    document.getElementById("lightboxImg").src = item.image;

    document.getElementById("lightboxTitle").innerHTML = item.title;

    document.getElementById("lightboxStyle").innerHTML = item.style;

    document.getElementById("lightboxOldPrice").innerHTML =
      oldPrice.toLocaleString("tr-TR") + "₺";

    document.getElementById("lightboxPrice").innerHTML =
      item.basePrice.toLocaleString("tr-TR") + "₺";

    document.getElementById("lightboxWhatsapp").href =
      `https://wa.me/905388746412?text=Merhaba ${item.title} çalışması için bilgi almak istiyorum.`;
    const aiMessage = encodeURIComponent(
      `Merhaba Tattookan.art,

AI destekli özel dövme tasarımı hakkında bilgi almak istiyorum.

Referans tarz:
${item.style}

Çalışma:
${item.title}

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
});
