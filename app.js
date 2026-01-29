// app.js
// Mih Pulseiras catálogo local + WhatsApp

const WHATS_NUMBER_E164 = "554591254344"; // 55 + DDD + número (sem + e sem espaços)
const WHATS_DEFAULT_GREETING = "Oi 💖 Tenho interesse nesta pulseira:";

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const sortSelect = document.getElementById("sort");

const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");
const modalImg = document.getElementById("modalImg");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalPrice = document.getElementById("modalPrice");
const modalDesc = document.getElementById("modalDesc");
const whatsBtn = document.getElementById("whatsBtn");
const copyBtn = document.getElementById("copyBtn");

const moneyBRL = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const getProducts = () => (window.PRODUCTS || []).slice();

function buildCategories(products){
  const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();
  categorySelect.innerHTML = `<option value="all">Todas</option>` + cats.map(c => (
    `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
  )).join("");
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function sortProducts(list, mode){
  const arr = list.slice();
  if(mode === "featured"){
    arr.sort((a,b) => (b.featured === true) - (a.featured === true));
    return arr;
  }
  if(mode === "price-asc") return arr.sort((a,b) => (a.price ?? 0) - (b.price ?? 0));
  if(mode === "price-desc") return arr.sort((a,b) => (b.price ?? 0) - (a.price ?? 0));
  if(mode === "name-asc") return arr.sort((a,b) => String(a.name).localeCompare(String(b.name), "pt-BR"));
  if(mode === "name-desc") return arr.sort((a,b) => String(b.name).localeCompare(String(a.name), "pt-BR"));
  return arr;
}

function applyFilters(){
  const q = searchInput.value.trim().toLowerCase();
  const cat = categorySelect.value;
  const sort = sortSelect.value;

  let list = getProducts();

  if(cat !== "all"){
    list = list.filter(p => (p.category || "").toLowerCase() === cat.toLowerCase());
  }

  if(q){
    list = list.filter(p => {
      const hay = `${p.name || ""} ${p.desc || ""} ${p.category || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  list = sortProducts(list, sort);
  render(list);
}

function render(list){
  grid.innerHTML = list.map(p => `
    <article class="card" data-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="Abrir ${escapeHtml(p.name)}">
      <img class="thumb" src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" loading="lazy" />
      <div class="card-body">
        <h3 class="title">${escapeHtml(p.name)}</h3>
        <div class="row">
          <span class="chip">${escapeHtml(p.category || "Geral")}</span>
          <span class="price">${moneyBRL(p.price ?? 0)}</span>
        </div>
      </div>
    </article>
  `).join("");

  empty.hidden = list.length !== 0;

  // clique e enter/space
  grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openProduct(card.dataset.id));
    card.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        openProduct(card.dataset.id);
      }
    });
  });
}

function openProduct(id){
  const p = getProducts().find(x => x.id === id);
  if(!p) return;

  modalImg.src = p.img;
  modalImg.alt = p.name;

  modalTitle.textContent = p.name;
  modalCategory.textContent = p.category || "Geral";
  modalPrice.textContent = moneyBRL(p.price ?? 0);
  modalDesc.textContent = p.desc || "";

  const msg =
    `${WHATS_DEFAULT_GREETING}\n` +
    `• ${p.name}\n` +
    `• ${moneyBRL(p.price ?? 0)}\n` +
    `• Categoria: ${p.category || "Geral"}\n` +
    `• Código: ${p.id}\n`;

  const url = `https://wa.me/${WHATS_NUMBER_E164}?text=${encodeURIComponent(msg)}`;
  whatsBtn.href = url;

  copyBtn.onclick = async () => {
    try{
      await navigator.clipboard.writeText(msg);
      copyBtn.textContent = "Copiado ✓";
      setTimeout(() => (copyBtn.textContent = "Copiar texto"), 1200);
    }catch{
      alert("Não consegui copiar :/ (permite clipboard no navegador)");
    }
  };

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(){
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

closeModalBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if(e.target && e.target.dataset && e.target.dataset.close) closeModal();
});
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
});

searchInput.addEventListener("input", applyFilters);
categorySelect.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

// init
const initial = getProducts();
buildCategories(initial);
applyFilters();
