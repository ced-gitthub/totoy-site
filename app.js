// ============================================================
//  MARKETPLACE CRM — Upgraded app.js (Simple Pass + Actions + PHP ₱)
// ============================================================

let db = null;
let useCloud = false;

let listings = [];
let leads = [];
let sellers = [];

let funnelChart = null;
let revenueChart = null;

// 🔒 CHOOSE YOUR PASSWORD HERE:
const APP_PASSWORD = 'TotoyMarketplace2026';

// ── Init ───────────────────────────────────────────────────
async function init() {
  // Check if they already unlocked it during this browser session
  if (sessionStorage.getItem('crm_unlocked') === 'true') {
    hideLoginScreen();
  } else {
    showLoginScreen();
  }

  if (typeof SUPABASE_URL === 'string' && SUPABASE_URL.length > 0) {
    try {
      db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      useCloud = true;
      setSyncStatus(true);
    } catch (e) {
      console.warn('Supabase init failed, falling back to local storage', e);
    }
  } else {
    document.getElementById('config-banner').classList.remove('hidden');
  }

  await loadAll();
  renderDashboard();
  renderListings();
  renderLeads();
  renderSellers();
  setDate();
  setupNavigation();
}

// ── Simple Password Security ────────────────────────────────
function showLoginScreen() {
  document.getElementById('login-overlay').style.display = 'flex';
}

function hideLoginScreen() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'none';
}

function handleSimpleLogin(e) {
  e.preventDefault();
  const inputPass = document.getElementById('crm-password').value;
  const errorMsg = document.getElementById('login-error');

  if (inputPass === APP_PASSWORD) {
    sessionStorage.setItem('crm_unlocked', 'true'); // Keeps them logged in until they close tab
    errorMsg.style.display = 'none';
    hideLoginScreen();
  } else {
    errorMsg.style.display = 'block';
    document.getElementById('crm-password').value = '';
  }
}

function setDate() {
  const el = document.getElementById('dashboard-date');
  if (el) el.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function setSyncStatus(synced) {
  const el = document.getElementById('sync-status');
  if (el) {
    if (synced) {
      el.innerHTML = '<i class="ti ti-cloud-check"></i> <span>Synced</span>';
      el.classList.add('synced');
    } else {
      el.innerHTML = '<i class="ti ti-cloud-off"></i> <span>Local only</span>';
      el.classList.remove('synced');
    }
  }
}

function dismissBanner() {
  document.getElementById('config-banner').classList.add('hidden');
}

// ── Navigation ─────────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');
      if (tab === 'dashboard') renderDashboard();
    });
  });
}

// ── Data loading ───────────────────────────────────────────
async function loadAll() {
  if (useCloud) {
    const [l, ld, s] = await Promise.all([
      db.from('listings').select('*').order('created_at', { ascending: false }),
      db.from('leads').select('*').order('created_at', { ascending: false }),
      db.from('sellers').select('*').order('created_at', { ascending: false }),
    ]);
    listings = l.data || [];
    leads = ld.data || [];
    sellers = s.data || [];
  } else {
    listings = JSON.parse(localStorage.getItem('mp_listings') || '[]');
    leads    = JSON.parse(localStorage.getItem('mp_leads')    || '[]');
    sellers  = JSON.parse(localStorage.getItem('mp_sellers')  || '[]');
  }
}

function saveLocal() {
  localStorage.setItem('mp_listings', JSON.stringify(listings));
  localStorage.setItem('mp_leads',    JSON.stringify(leads));
  localStorage.setItem('mp_sellers',  JSON.stringify(sellers));
}

// ── Modals ─────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// ── Listings + PHP ₱ Actions ───────────────────────────────
async function saveListing() {
  const name   = document.getElementById('l-name').value.trim();
  const buy    = parseFloat(document.getElementById('l-buy').value)  || 0;
  const ask    = parseFloat(document.getElementById('l-ask').value)  || 0;
  const status = document.getElementById('l-status').value;
  const source = document.getElementById('l-source').value.trim();
  const notes  = document.getElementById('l-notes').value.trim();
  if (!name) return alert('Please enter an item name.');

  const record = { name, buy_price: buy, ask_price: ask, status, source_seller: source, notes };

  if (useCloud) {
    const { data, error } = await db.from('listings').insert([record]).select();
    if (error) return alert('Error saving: ' + error.message);
    listings.unshift(data[0]);
  } else {
    record.id = Date.now();
    record.created_at = new Date().toISOString();
    listings.unshift(record);
    saveLocal();
  }

  closeModal('listing-modal');
  clearForm(['l-name','l-buy','l-ask','l-source','l-notes']);
  document.getElementById('l-status').value = 'active';
  renderListings();
  renderDashboard();
}

function renderListings() {
  const search = (document.getElementById('listing-search')?.value || '').toLowerCase();
  const filter = document.getElementById('listing-filter')?.value || 'all';
  const tbody = document.getElementById('listings-tbody');

  let filtered = listings.filter(l => {
    const matchSearch = !search || l.name?.toLowerCase().includes(search) || l.source_seller?.toLowerCase().includes(search);
    const matchFilter = filter === 'all' || l.status === filter;
    return matchSearch && matchFilter;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No listings yet — add one to get started.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(l => {
    const buy = l.buy_price || 0;
    const ask = l.ask_price || 0;
    const margin = buy > 0 ? ((ask - buy) / buy * 100).toFixed(1) : '—';
    const marginClass = parseFloat(margin) >= 0 ? 'margin-pos' : 'margin-neg';
    
    return `<tr>
      <td><div class="cell-name">${esc(l.name)}</div>${l.notes ? `<div class="cell-sub">${esc(l.notes)}</div>` : ''}</td>
      <td class="price-cell">₱${buy.toFixed(2)}</td>
      <td class="price-cell">₱${ask.toFixed(2)}</td>
      <td class="${marginClass}">${margin !== '—' ? margin + '%' : '—'}</td>
      <td style="color: var(--text-2)">${esc(l.source_seller || '—')}</td>
      <td>
        <select onchange="updateListingStatus('${l.id}', this.value)" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #f4f4f3; border: 1px solid #e5e5e0; cursor: pointer;">
          <option value="active" ${l.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="sold" ${l.status === 'sold' ? 'selected' : ''}>Sold</option>
          <option value="delisted" ${l.status === 'delisted' ? 'selected' : ''}>Delisted</option>
        </select>
      </td>
      <td>
        <button class="btn-icon" onclick="deleteListing('${l.id}')" aria-label="delete"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

async function updateListingStatus(id, newStatus) {
  if (useCloud) {
    await db.from('listings').update({ status: newStatus }).eq('id', id);
  }
  const index = listings.findIndex(l => String(l.id) === String(id));
  if (index !== -1) listings[index].status = newStatus;
  saveLocal();
  renderDashboard();
}

async function deleteListing(id) {
  if (!confirm('Delete this listing?')) return;
  if (useCloud) {
    await db.from('listings').delete().eq('id', id);
  }
  listings = listings.filter(l => String(l.id) !== String(id));
  saveLocal();
  renderListings();
  renderDashboard();
}

// ── Leads + PHP ₱ Actions ──────────────────────────────────
async function saveLead() {
  const name   = document.getElementById('ld-name').value.trim();
  const item   = document.getElementById('ld-item').value.trim();
  const status = document.getElementById('ld-status').value;
  const price  = parseFloat(document.getElementById('ld-price').value) || 0;
  const notes  = document.getElementById('ld-notes').value.trim();
  if (!name) return alert('Please enter a buyer name.');

  const record = { buyer_name: name, item_name: item, status, final_price: price, notes };

  if (useCloud) {
    const { data, error } = await db.from('leads').insert([record]).select();
    if (error) return alert('Error saving: ' + error.message);
    leads.unshift(data[0]);
  } else {
    record.id = Date.now();
    record.created_at = new Date().toISOString();
    leads.unshift(record);
    saveLocal();
  }

  closeModal('lead-modal');
  clearForm(['ld-name','ld-item','ld-price','ld-notes']);
  document.getElementById('ld-status').value = 'new';
  renderLeads();
  renderDashboard();
}

function renderLeads() {
  const search = (document.getElementById('lead-search')?.value || '').toLowerCase();
  const filter = document.getElementById('lead-filter')?.value || 'all';
  const tbody = document.getElementById('leads-tbody');

  let filtered = leads.filter(l => {
    const matchSearch = !search || l.buyer_name?.toLowerCase().includes(search) || l.item_name?.toLowerCase().includes(search);
    const matchFilter = filter === 'all' || l.status === filter;
    return matchSearch && matchFilter;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No leads yet — log one to start tracking.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(l => `<tr>
    <td class="cell-name">${esc(l.buyer_name)}</td>
    <td style="color: var(--text-2)">${esc(l.item_name || '—')}</td>
    <td>
      <select onchange="updateLeadStage('${l.id}', this.value)" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #f4f4f3; border: 1px solid #e5e5e0; cursor: pointer;">
        <option value="new" ${l.status === 'new' ? 'selected' : ''}>New</option>
        <option value="negotiating" ${l.status === 'negotiating' ? 'selected' : ''}>Negotiating</option>
        <option value="closed" ${l.status === 'closed' ? 'selected' : ''}>Closed</option>
        <option value="lost" ${l.status === 'lost' ? 'selected' : ''}>Lost</option>
      </select>
    </td>
    <td>
      <span style="font-size: 13px; color: var(--text-2); margin-right: 2px;">₱</span><input type="number" value="${l.final_price || ''}" placeholder="—" onchange="updateLeadPrice('${l.id}', this.value)" style="width: 80px; padding: 4px; border: 1px solid #e5e5e0; border-radius: 4px; text-align: right; font-size: 13px;">
    </td>
    <td style="color: var(--text-2); font-size: 12px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(l.notes || '—')}</td>
    <td><button class="btn-icon" onclick="deleteLead('${l.id}')" aria-label="delete"><i class="ti ti-trash"></i></button></td>
  </tr>`).join('');
}

async function updateLeadStage(id, newStatus) {
  if (useCloud) {
    await db.from('leads').update({ status: newStatus }).eq('id', id);
  }
  const index = leads.findIndex(l => String(l.id) === String(id));
  if (index !== -1) leads[index].status = newStatus;
  saveLocal();
  renderDashboard();
}

async function updateLeadPrice(id, newPrice) {
  const parsedPrice = parseFloat(newPrice) || 0;
  if (useCloud) {
    await db.from('leads').update({ final_price: parsedPrice }).eq('id', id);
  }
  const index = leads.findIndex(l => String(l.id) === String(id));
  if (index !== -1) leads[index].final_price = parsedPrice;
  saveLocal();
  renderDashboard();
}

async function deleteLead(id) {
  if (!confirm('Delete this lead?')) return;
  if (useCloud) await db.from('leads').delete().eq('id', id);
  leads = leads.filter(l => String(l.id) !== String(id));
  saveLocal();
  renderLeads();
  renderDashboard();
}

// ── Sellers ────────────────────────────────────────────────
async function saveSeller() {
  const name      = document.getElementById('s-name').value.trim();
  const rating    = parseInt(document.getElementById('s-rating').value);
  const specialty = document.getElementById('s-specialty').value.trim();
  const contact   = document.getElementById('s-contact').value.trim();
  const notes     = document.getElementById('s-notes').value.trim();
  if (!name) return alert('Please enter a seller name.');

  const record = { name, rating, specialty, contact, notes };

  if (useCloud) {
    const { data, error } = await db.from('sellers').insert([record]).select();
    if (error) return alert('Error saving: ' + error.message);
    sellers.unshift(data[0]);
  } else {
    record.id = Date.now();
    record.created_at = new Date().toISOString();
    sellers.unshift(record);
    saveLocal();
  }

  closeModal('seller-modal');
  clearForm(['s-name','s-specialty','s-contact','s-notes']);
  document.getElementById('s-rating').value = '5';
  renderSellers();
}

function renderSellers() {
  const grid = document.getElementById('sellers-grid');
  if (!sellers.length) {
    grid.innerHTML = '<div class="empty-sellers">No sellers tracked yet. Add your first source.</div>';
    return;
  }
  grid.innerHTML = sellers.map(s => {
    const initials = s.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    const stars = '★'.repeat(s.rating || 5) + '☆'.repeat(5 - (s.rating || 5));
    return `<div class="seller-card">
      <div class="seller-top">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="seller-avatar">${initials}</div>
          <div>
            <div class="seller-name">${esc(s.name)}</div>
            <div class="seller-specialty">${esc(s.specialty || 'General')}</div>
          </div>
        </div>
        <button class="btn-icon" onclick="deleteSeller('${s.id}')" aria-label="delete"><i class="ti ti-trash"></i></button>
      </div>
      <div class="seller-stars">${stars}</div>
      ${s.contact ? `<div class="seller-contact"><i class="ti ti-link" style="font-size:12px"></i> ${esc(s.contact)}</div>` : ''}
      ${s.notes ? `<div class="seller-notes">${esc(s.notes)}</div>` : ''}
    </div>`;
  }).join('');
}

async function deleteSeller(id) {
  if (!confirm('Delete this seller?')) return;
  if (useCloud) await db.from('sellers').delete().eq('id', id);
  sellers = sellers.filter(s => String(s.id) !== String(id));
  saveLocal();
  renderSellers();
}

// ── Dashboard + Metrics Realignment ────────────────────────
function renderDashboard() {
  const total   = leads.length;
  const closed  = leads.filter(l => l.status === 'closed').length;
  const negot   = leads.filter(l => l.status === 'negotiating').length;
  const lost    = leads.filter(l => l.status === 'lost').length;
  const rate    = total > 0 ? Math.round((closed / total) * 100) : 0;
  const revenue = leads.filter(l => l.status === 'closed').reduce((s, l) => s + (l.final_price || 0), 0);
  const profit  = listings.reduce((s, l) => s + ((l.ask_price || 0) - (l.buy_price || 0)), 0);
  const active  = listings.filter(l => l.status === 'active').length;

  const metricsGrid = document.getElementById('metrics-grid');
  if (metricsGrid) {
    metricsGrid.innerHTML = `
      <div class="metric"><div class="metric-label">Total leads</div><div class="metric-value">${total}</div><div class="metric-sub">all time</div></div>
      <div class="metric"><div class="metric-label">Closed deals</div><div class="metric-value">${closed}</div><div class="metric-sub">won</div></div>
      <div class="metric"><div class="metric-label">Close rate</div><div class="metric-value">${rate}%</div><div class="metric-sub">inquiries → sales</div></div>
      <div class="metric"><div class="metric-label">Revenue</div><div class="metric-value">₱${Math.round(revenue).toLocaleString()}</div><div class="metric-sub">from closed deals</div></div>
      <div class="metric"><div class="metric-label">Active listings</div><div class="metric-value">${active}</div><div class="metric-sub">live now</div></div>
      <div class="metric"><div class="metric-label">Potential profit</div><div class="metric-value">₱${Math.round(profit).toLocaleString()}</div><div class="metric-sub">ask − buy</div></div>
    `;
  }

  // Funnel chart
  const funnelEl = document.getElementById('funnelChart');
  if (funnelEl) {
    if (funnelChart) funnelChart.destroy();
    funnelChart = new Chart(funnelEl, {
      type: 'bar',
      data: {
        labels: ['All inquiries', 'Negotiating', 'Closed', 'Lost'],
        datasets: [{
          data: [total, negot, closed, lost],
          backgroundColor: ['#B5D4F4', '#FAC775', '#C0DD97', '#F7C1C1'],
          borderRadius: 5,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0, stepSize: 1 } }, x: { grid: { display: false } } }
      }
    });
  }

  // Revenue chart (PHP ₱ axis scaling)
  const revenueEl = document.getElementById('revenueChart');
  if (revenueEl) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const revByMonth = Array(6).fill(0);
    leads.filter(l => l.status === 'closed' && l.final_price > 0).forEach(l => {
      const d = new Date(l.created_at);
      const diff = (now.getFullYear() * 12 + now.getMonth()) - (d.getFullYear() * 12 + d.getMonth());
      if (diff >= 0 && diff < 6) revByMonth[5 - diff] += l.final_price;
    });
    const revLabels = Array.from({ length: 6 }, (_, i) => months[(now.getMonth() - 5 + i + 12) % 12]);

    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(revenueEl, {
      type: 'line',
      data: {
        labels: revLabels,
        datasets: [{
          label: 'Revenue',
          data: revByMonth.map(v => Math.round(v)),
          borderColor: '#1a1a18',
          backgroundColor: 'rgba(26,26,24,0.05)',
          fill: true, tension: 0.35,
          pointRadius: 4, pointBackgroundColor: '#1a1a18',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => '₱' + Math.round(v).toLocaleString() } }, x: { grid: { display: false } } }
      }
    });
  }

  // Recent leads
  const recent = leads.slice(0, 5);
  const statusLabel = { new: 'New', negotiating: 'Negotiating', closed: 'Closed', lost: 'Lost' };
  const recentEl = document.getElementById('recent-leads');
  if (recentEl) {
    if (!recent.length) {
      recentEl.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--text-3);font-size:13px;">No leads yet.</div>';
    } else {
      recentEl.innerHTML = recent.map(l => `
        <div class="recent-item">
          <div class="recent-name">${esc(l.buyer_name)}</div>
          <div class="recent-item-name" style="color:var(--text-2)">${esc(l.item_name || '—')}</div>
          <span class="badge badge-${l.status}">${statusLabel[l.status] || l.status}</span>
          <div class="price-cell" style="text-align:right">${l.final_price ? '₱' + Number(l.final_price).toFixed(2) : '—'}</div>
        </div>`).join('');
    }
  }
}

// ── Utilities ──────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function clearForm(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }

// ── Boot ───────────────────────────────────────────────────
init();
