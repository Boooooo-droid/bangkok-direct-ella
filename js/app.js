(() => {
  const MESSENGER = 'https://m.me/61593915543815';
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const search = document.getElementById('search');
  const sheet = document.getElementById('sheet');
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  let products = [];

  function messengerUrl(productName) {
    const text = encodeURIComponent(`ဟယ်လို 👋 ${productName} အကြောင်း မေးချင်ပါတယ်`);
    return `${MESSENGER}?text=${text}`;
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function tagsHtml(tags) {
    return (tags || []).map(t =>
      `<span class="tag${t === 'လက်ကား' ? ' blue' : ''}">${esc(t)}</span>`
    ).join('');
  }

  function cardHtml(p, idx) {
    const img = (p.images && p.images[0]) || 'brand/logo.jpg';
    const snip = p.snippet || '';
    return `<article class="card" data-idx="${idx}">
      <div class="card-media" data-open="${idx}">
        <img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" decoding="async" />
        ${idx < 3 ? '<span class="card-badge">အသစ်</span>' : ''}
      </div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <div class="tags">${tagsHtml(p.tags)}</div>
        ${snip ? `<p class="card-snip">${esc(snip)}</p>` : ''}
        <button type="button" class="btn btn-primary" data-order="${idx}">မှာမယ် / Facebook မှာ မေးမယ်</button>
      </div>
    </article>`;
  }

  function render(list) {
    if (!list.length) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    grid.innerHTML = list.map((p, i) => cardHtml(p, products.indexOf(p))).join('');
  }

  function openSheet(p) {
    document.getElementById('sheet-title').textContent = p.name;
    document.getElementById('sheet-tags').innerHTML = tagsHtml(p.tags);
    const sizesEl = document.getElementById('sheet-sizes');
    const colorsEl = document.getElementById('sheet-colors');
    sizesEl.textContent = p.sizes || '';
    sizesEl.style.display = p.sizes ? '' : 'none';
    colorsEl.textContent = p.colors || '';
    colorsEl.style.display = p.colors ? '' : 'none';
    document.getElementById('sheet-caption').textContent = p.caption || '';
    const order = document.getElementById('sheet-order');
    order.href = messengerUrl(p.name);
    const gal = document.getElementById('sheet-gallery');
    const imgs = (p.images && p.images.length) ? p.images : ['brand/logo.jpg'];
    gal.innerHTML = imgs.map(src =>
      `<img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" data-full="${esc(src)}" />`
    ).join('');
    sheet.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    sheet.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function openLb(src) {
    lbImg.src = src;
    lb.classList.remove('hidden');
  }
  function closeLb() {
    lb.classList.add('hidden');
    lbImg.src = '';
  }

  grid.addEventListener('click', (e) => {
    const orderBtn = e.target.closest('[data-order]');
    if (orderBtn) {
      const p = products[+orderBtn.dataset.order];
      if (p) window.open(messengerUrl(p.name), '_blank', 'noopener');
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open) {
      const p = products[+open.dataset.open];
      if (p) openSheet(p);
    }
  });

  sheet.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]') || e.target.classList.contains('sheet-backdrop')) {
      closeSheet();
      return;
    }
    const img = e.target.closest('.sheet-gallery img');
    if (img) openLb(img.dataset.full || img.src);
  });

  lb.addEventListener('click', closeLb);
  document.querySelector('.lb-close').addEventListener('click', closeLb);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLb(); closeSheet(); }
  });

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    if (!q) return render(products);
    render(products.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.caption || '').toLowerCase().includes(q) ||
      (p.snippet || '').toLowerCase().includes(q)
    ));
  });

  fetch('products.json?v=' + Date.now())
    .then(r => r.json())
    .then(data => {
      // newest-first: prefer posted_order ascending (1 = newest), else keep array order
      products = (data.products || []).slice().sort((a, b) => {
        const ao = a.posted_order ?? 9999;
        const bo = b.posted_order ?? 9999;
        return ao - bo;
      });
      render(products);
      if (data.shop?.tagline) {
        const t = document.querySelector('.tagline');
        if (t) t.textContent = data.shop.tagline;
      }
    })
    .catch(() => {
      empty.textContent = 'ပစ္စည်းစာရင်း တင်မရသေးပါ။ ခဏနေမှ ပြန်ဖွင့်ကြည့်ပါ။';
      empty.classList.remove('hidden');
    });
})();
