// ============================================================
// LIGHTBOX — any <img class="zoomable"> opens full-size on click.
// Backdrop click or Escape closes. Caption from data-caption or alt.
// ============================================================
function openLightbox(src, caption) {
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.innerHTML =
      '<button class="lightbox-close" type="button" onclick="closeLightbox()">Close · Esc</button>' +
      '<img id="lightbox-img" class="lightbox-img" alt="">' +
      '<div id="lightbox-caption" class="lightbox-caption"></div>';
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    document.body.appendChild(lb);
  }
  document.getElementById('lightbox-img').src = src;
  const cap = document.getElementById('lightbox-caption');
  cap.textContent = caption || '';
  cap.style.display = caption ? 'block' : 'none';
  lb.classList.add('open');
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
document.addEventListener('click', (e) => {
  const img = e.target && e.target.closest && e.target.closest('img.zoomable');
  if (img && img.src) {
    e.preventDefault();
    e.stopPropagation();
    openLightbox(img.src, img.dataset.caption || img.alt || '');
  }
}, true);

// ============================================================
// API CLIENT — talks to the local Express server in server.js
// ============================================================
const api = {
  async json(method, path, body) {
    const opts = { method, headers: {} };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const r = await fetch(path, opts);
    if (!r.ok) {
      let detail; try { detail = await r.json(); } catch { detail = { error: r.statusText }; }
      const e = new Error(detail.error || ('HTTP ' + r.status));
      e.status = r.status;
      e.details = detail.details;
      throw e;
    }
    if (r.status === 204) return null;
    const ct = r.headers.get('content-type') || '';
    return ct.includes('application/json') ? r.json() : r.text();
  },
  async multipart(method, path, formData) {
    const r = await fetch(path, { method, body: formData });
    if (!r.ok) {
      let detail; try { detail = await r.json(); } catch { detail = { error: r.statusText }; }
      const e = new Error(detail.error || ('HTTP ' + r.status));
      e.status = r.status;
      e.details = detail.details;
      throw e;
    }
    return r.json();
  },
  archetypes: {
    list:        ()        => api.json('GET',   '/api/archetypes'),
    patch:       (code, p) => api.json('PATCH', '/api/archetypes/' + encodeURIComponent(code), p),
    reference:   (code, formData) => api.multipart('POST',
                                       '/api/archetypes/' + encodeURIComponent(code) + '/reference', formData),
  },
  globalRules: {
    list:   ()        => api.json('GET',    '/api/global-rules'),
    create: (rule)    => api.json('POST',   '/api/global-rules', { rule }),
    patch:  (id, r)   => api.json('PATCH',  '/api/global-rules/' + encodeURIComponent(id), { rule: r }),
    remove: (id)      => api.json('DELETE', '/api/global-rules/' + encodeURIComponent(id)),
  },
  components: {
    list:   ()           => api.json('GET',    '/api/components'),
    create: (formData)   => api.multipart('POST',  '/api/components', formData),
    patch:  (key, fd)    => api.multipart('PATCH', '/api/components/' + encodeURIComponent(key), fd),
    patchJSON: (key, p)  => api.json('PATCH', '/api/components/' + encodeURIComponent(key), p),
    remove: (key)        => api.json('DELETE', '/api/components/' + encodeURIComponent(key)),
  },
  clients: {
    list:    ()       => api.json('GET',    '/api/clients'),
    get:     (id)     => api.json('GET',    '/api/clients/' + encodeURIComponent(id)),
    create:  (data)   => api.json('POST',   '/api/clients', data),
    patch:   (id, p)  => api.json('PATCH',  '/api/clients/' + encodeURIComponent(id), p),
    remove:  (id)     => api.json('DELETE', '/api/clients/' + encodeURIComponent(id)),
    photo:   (id, type, formData) => api.multipart('POST',
                          '/api/clients/' + encodeURIComponent(id) + '/photo/' + encodeURIComponent(type), formData),
  },
  ads:    { list: () => api.json('GET', '/api/ads') },
  prices: { list: () => api.json('GET', '/api/prices') },
  golds:  {
    list:        ()             => api.json('GET', '/api/golds'),
    uploadImage: (code, fd)     => api.multipart('POST',   '/api/golds/' + encodeURIComponent(code) + '/output-image', fd),
    deleteImage: (code)         => api.json('DELETE', '/api/golds/' + encodeURIComponent(code) + '/output-image'),
  },
  masterPrompt: {
    get:  ()      => api.json('GET', '/api/master-prompt'),
    save: (text)  => fetch('/api/master-prompt', {
      method: 'PUT',
      headers: { 'Content-Type': 'text/markdown' },
      body: text,
    }).then(async (r) => {
      if (!r.ok) {
        let d; try { d = await r.json(); } catch { d = { error: r.statusText }; }
        const e = new Error(d.error || 'save failed'); e.status = r.status; throw e;
      }
      return r.json();
    }),
  },
};

// ============================================================
// IN-MEMORY MIRROR — populated by boot(), refreshed on every mutation.
// Keeping the same variable names so the existing render code is unchanged.
// ============================================================
let REF_THUMBS = {};        // ad-id -> URL on local server
let GOLDS = {};
let CLIENTS = [];
let ADS = [];
let MASTER_PROMPT = '';
const STATE = {
  archetypes: [],
  globalRules: [],
  components: [],
  prices: [],
};

// Map archetype code -> on-disk reference-ad slug. Mirrors the server's
// archetypeSlug.js. Hardcoded because the folders are stable and we don't
// want a round-trip to know how to construct an <img src>.
const ARCH_REF_SLUG = {
  A1: 'A1-energy-bill-hero',
  A2: 'A2-speed-guarantee',
  A3: 'A3-luxury-lifestyle',
  A4: 'A4-problem-solution',
  A5: 'A5-seasonal-pain',
  A6: 'A6-seasonal-sale',
  A7: 'A7-brand-sale',
  A8: 'A8-city-massive-sale',
  A9: 'A9-holiday-event',
  A10: 'A10-local-trust',
};
function refUrlForCode(code) {
  const slug = ARCH_REF_SLUG[code];
  return slug ? '/assets/reference-ads/' + slug + '/reference.png' : null;
}

function rebuildRefThumbs() {
  REF_THUMBS = {};
  for (const a of STATE.archetypes) {
    const url = refUrlForCode(a.code);
    if (url && a.exemplar) REF_THUMBS[a.exemplar] = url;
    if (url) REF_THUMBS[a.code] = url;
  }
}

function normaliseComponent(c) {
  if (typeof c.usedBy === 'string') {
    c.usedBy = c.usedBy.split(',').map(s => s.trim()).filter(s => s.length > 0);
  } else if (!Array.isArray(c.usedBy)) {
    c.usedBy = [];
  }
  // If the server gave us imagePath, surface it on the property the UI reads.
  if (c.imagePath && !c.uploadedImage) c.uploadedImage = c.imagePath;
  return c;
}

async function loadAll() {
  const [archetypes, globalRules, components, prices, clients, ads, golds, masterPrompt] =
    await Promise.all([
      api.archetypes.list(),
      api.globalRules.list(),
      api.components.list(),
      api.prices.list(),
      api.clients.list(),
      api.ads.list(),
      api.golds.list(),
      api.masterPrompt.get(),
    ]);
  STATE.archetypes = archetypes;
  STATE.globalRules = globalRules;
  STATE.components = components.map(normaliseComponent);
  STATE.prices = prices;
  CLIENTS = clients;
  ADS = ads;
  GOLDS = golds;
  MASTER_PROMPT = masterPrompt;
  rebuildRefThumbs();
}

async function refreshArchetypes() {
  STATE.archetypes = await api.archetypes.list();
  rebuildRefThumbs();
}
async function refreshComponents() {
  STATE.components = (await api.components.list()).map(normaliseComponent);
}
async function refreshGlobalRules() { STATE.globalRules = await api.globalRules.list(); }
async function refreshClients() { CLIENTS = await api.clients.list(); }

function reportError(err) {
  console.error(err);
  let msg = err.message || 'Something went wrong';
  if (err.details && err.details.fieldErrors) {
    const fields = Object.entries(err.details.fieldErrors)
      .map(([k, v]) => k + ': ' + v.join(', ')).join('; ');
    if (fields) msg += ' — ' + fields;
  }
  alert(msg);
}

// Track active section + sub-views
let currentSection = 'archetypes';
let currentArchIdx = null;
let currentClientId = null;
let currentClientTab = 'list';
let currentComponentCat = 'Brand logo';

function htmlEscape(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function ruleLabel(r) {
  // Handles both "HR01" string IDs (already prefixed) and numeric IDs (need prefix)
  const s = String(r.id);
  return s.startsWith('HR') ? s : 'HR' + s.padStart(2, '0');
}

// ------------------------------------------------------------
// MODAL HELPERS
// ------------------------------------------------------------
function showModal(html, opts={}) {
  const root = document.getElementById('modal-root');
  const sizeClass = opts.large ? ' modal-large' : '';
  root.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this)closeModal()">
      <div class="modal${sizeClass}">${html}</div>
    </div>
  `;
}
function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

function showEditModal({title, subtitle, value, multiline, onSave}) {
  showModal(`
    <div class="modal-header">
      <div>
        <h3 class="modal-title">${htmlEscape(title)}</h3>
        ${subtitle?`<div class="modal-subtitle">${htmlEscape(subtitle)}</div>`:''}
      </div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <label>Value</label>
        ${multiline ? `<textarea id="edit-val" autofocus>${htmlEscape(value)}</textarea>` : `<input id="edit-val" type="text" value="${htmlEscape(value).replace(/"/g,'&quot;')}" autofocus>`}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="edit-save">Save</button>
    </div>
  `);
  document.getElementById('edit-save').addEventListener('click', () => {
    const newVal = document.getElementById('edit-val').value;
    onSave(newVal);
    closeModal();
    render();
  });
}

function confirmDelete(label, onConfirm) {
  showModal(`
    <div class="modal-header">
      <div><h3 class="modal-title">Delete?</h3></div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <p>Delete <strong>${htmlEscape(label)}</strong>? This can't be undone in the mockup.</p>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" id="confirm-del">Delete</button>
    </div>
  `);
  document.getElementById('confirm-del').addEventListener('click', () => {
    onConfirm();
    closeModal();
    render();
  });
}

// ------------------------------------------------------------
// AD DETAIL MODAL — paired output + prompt + reference
// ------------------------------------------------------------
// Modal state for the ad-detail view. Modal stays in sync with this object —
// any state change calls renderAdDetailModal() to redraw.
const MODAL_AD = {
  clientId: null,
  archetype: null,
  selectedVersionId: null,   // which version pill is active (or 'generating-new' when in flight)
  generating: false,         // a regenerate is in flight; generates a virtual pill
  startedAt: 0,              // for elapsed-time display during generation
};

// Build the sorted version list for an (clientId, archetype). Returns:
//   { versions: [...sorted oldest-first], current: ad-with-max-promoted_at }
//
// Sort uses created date primary; ad.id as tie-breaker (legacy ads stored
// only YYYY-MM-DD so date.getTime() ties — id is `ad_<base36-timestamp>_xxxx`
// which sorts correctly lexicographically because base36 of milliseconds
// preserves chronological order).
function getVersions(clientId, archetype) {
  const all = ADS
    .filter((a) => a.client_id === clientId && a.archetype === archetype)
    .map((a) => ({
      ...a,
      _promoted: new Date(a.promoted_at || a.created || 0).getTime(),
      _created:  new Date(a.created || 0).getTime(),
    }));
  const versions = all.slice().sort((a, b) => {
    if (a._created !== b._created) return a._created - b._created;
    return (a.id || '').localeCompare(b.id || '');   // oldest id → newest id
  });
  const current = all.slice().sort((a, b) => {
    if (a._promoted !== b._promoted) return b._promoted - a._promoted;
    return (b.id || '').localeCompare(a.id || '');   // newest id → oldest id
  })[0];
  return { versions, current };
}

function openAdDetail(adId) {
  const ad = ADS.find((a) => a.id === adId);
  if (!ad) return;
  MODAL_AD.clientId = ad.client_id;
  MODAL_AD.archetype = ad.archetype;
  MODAL_AD.selectedVersionId = adId;
  MODAL_AD.generating = false;
  renderAdDetailModal();
}
window.openAdDetail = openAdDetail;

function renderAdDetailModal() {
  if (!MODAL_AD.clientId || !MODAL_AD.archetype) return;
  const arch = STATE.archetypes.find((a) => a.code === MODAL_AD.archetype) || {};
  const client = CLIENTS.find((c) => c.id === MODAL_AD.clientId);
  const { versions, current } = getVersions(MODAL_AD.clientId, MODAL_AD.archetype);

  // Selected version: explicit selection > current > first.
  const selectedAd = versions.find((v) => v.id === MODAL_AD.selectedVersionId)
                  || current
                  || versions[0]
                  || null;

  // Pills (oldest → newest, then a virtual ⏳ pill if regen in flight).
  // Click a pill → auto-promote AND select. Hover reveals × delete button.
  const totalNonGenerating = versions.length;
  const pills = versions.map((v, i) => {
    const isSelected = !MODAL_AD.generating && selectedAd && v.id === selectedAd.id;
    const isCurrent = current && v.id === current.id;
    const dt = new Date(v.created);
    const dtLabel = isNaN(dt) ? '' : `${dt.toLocaleDateString(undefined,{month:'short',day:'numeric'})} ${dt.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}`;
    return `<span class="version-pill-wrap" style="position:relative; display:inline-flex;">
      <button onclick="selectAdVersion('${v.id}')" style="background:${isSelected?'var(--accent)':'var(--surface)'}; color:${isSelected?'#fff':'var(--text-1)'}; border:1px solid ${isSelected?'var(--accent)':'var(--border-2)'}; border-radius:6px; padding:6px 26px 6px 12px; font-family:'JetBrains Mono',monospace; font-size:11px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
        <span style="font-weight:600;">v${i+1}</span>
        ${isCurrent ? '<span style="color:'+(isSelected?'#fff':'var(--accent)')+';">★</span>' : ''}
        <span style="opacity:0.75; font-weight:400;">${dtLabel}</span>
      </button>
      <button class="version-pill-x" onclick="event.stopPropagation(); deleteAdVersion('${v.id}', ${i+1})" title="Delete v${i+1}" style="position:absolute; top:50%; right:4px; transform:translateY(-50%); background:transparent; border:none; color:${isSelected?'#fff':'var(--text-3)'}; cursor:pointer; padding:2px 4px; font-size:14px; line-height:1; opacity:0; transition:opacity 0.15s;">×</button>
    </span>`;
  }).join('');

  // Virtual generating pill at the right end of the strip.
  const elapsed = MODAL_AD.generating ? Math.floor((Date.now() - MODAL_AD.startedAt) / 1000) : 0;
  const generatingPill = MODAL_AD.generating
    ? `<button style="background:var(--SP-bg); color:var(--SP); border:1px solid var(--SP); border-radius:6px; padding:6px 12px; font-family:'JetBrains Mono',monospace; font-size:11px; display:inline-flex; align-items:center; gap:6px; cursor:default;">
         <span style="font-weight:600;">v${totalNonGenerating + 1}</span>
         <span>⏳ generating…</span>
         <span style="opacity:0.7;">${elapsed}s</span>
       </button>`
    : '';

  // Body content depends on whether we're generating or showing a real version.
  let leftPane, rightTopPane, rightBottomPane, footer;

  if (MODAL_AD.generating) {
    leftPane = `
      <div class="paired-block-h">Generated ad output</div>
      <div class="paired-output" style="position:relative;">
        <div class="po-icon">⏳</div>
        <div class="po-arch">${MODAL_AD.archetype}</div>
        <div class="po-headline">composing → critiquing → rendering → picking → upscaling</div>
        <div class="po-note">~5–7 min · elapsed ${elapsed}s</div>
      </div>
    `;
    // For the reference + prompt during generation, show the LIVE reference
    // (which is what'll be snapshotted for this new version) and "composing…".
    const liveRef = REF_THUMBS[MODAL_AD.archetype] || REF_THUMBS[arch.exemplar];
    rightTopPane = `
      <div class="paired-block-h">Reference being snapshotted (current archetype reference)</div>
      ${liveRef ? `<img class="paired-ref-img zoomable" src="${liveRef}" alt="reference" data-caption="Reference snapshot">` : '<div class="ref-empty">Reference not found</div>'}
    `;
    rightBottomPane = `
      <div class="paired-block-h">ChatGPT prompt being composed</div>
      <div class="paired-prompt-block" style="font-style:italic; color:var(--text-3);">[ Claude composing — this fills in once the prompt is returned, then gpt-image-2 starts rendering ]</div>
    `;
    footer = `<button class="btn" onclick="closeModal()">Close (generation continues in background)</button>`;
  } else if (selectedAd) {
    const ad = selectedAd;
    const refUrl = ad.reference_url || REF_THUMBS[MODAL_AD.archetype] || REF_THUMBS[arch.exemplar];
    const promptText = ad.prompt_text || '';
    const isCurrent = current && ad.id === current.id;

    leftPane = `
      <div class="paired-block-h">Generated ad output</div>
      ${ad.image_url
        ? `<img class="paired-ref-img zoomable" src="${ad.image_url}?t=${Date.now()}" data-caption="${htmlEscape(MODAL_AD.archetype + ' generated ad')}" alt="generated ad" style="display:block; width:100%; height:auto; border-radius:8px;">`
        : `<div class="paired-output"><div class="po-icon">▢</div><div class="po-arch">${MODAL_AD.archetype}</div><div class="po-note">[ no image — generation may have failed ]</div></div>`}
      ${ad.image_url ? `
      <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; align-items:center;">
        <a class="btn btn-sm" href="${ad.image_url}" download>Download 1080</a>
        ${ad.hd_urls?.['2k'] ? `<a class="btn btn-sm" href="${ad.hd_urls['2k']}" download>2K HD</a>` : ''}
        ${ad.hd_urls?.['4k'] ? `<a class="btn btn-sm" href="${ad.hd_urls['4k']}" download>4K HD</a>` : ''}
        ${ad.total_cost_usd ? `<span style="margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-3);">cost $${Number(ad.total_cost_usd).toFixed(2)}</span>` : ''}
      </div>` : ''}
    `;
    rightTopPane = `
      <div class="paired-block-h">Reference ad used (attached as IMAGE 1)${ad.reference_url ? '' : ' <span style="color:var(--text-3); font-weight:400;">[live reference — pre-snapshot ad]</span>'}</div>
      ${refUrl ? `<img class="paired-ref-img zoomable" src="${refUrl}${refUrl.includes('?')?'':'?t='+Date.now()}" alt="reference" data-caption="Reference ad">` : '<div class="ref-empty">Reference not found</div>'}
    `;
    rightBottomPane = `
      <div class="paired-block-h">ChatGPT prompt that produced this</div>
      <div class="paired-prompt-block">${promptText ? htmlEscape(promptText) : '[ no prompt recorded ]'}</div>
    `;
    // Position of this version inside the chronological list (1-indexed) so
    // the footer can label "Delete v3 of 5" naturally.
    const idxInVersions = versions.findIndex((v) => v.id === ad.id) + 1;
    footer = `
      <button class="btn" onclick="closeModal()">Close</button>
      ${ad.image_url ? `<button class="btn btn-danger" onclick="deleteAdVersion('${ad.id}', ${idxInVersions})">Delete v${idxInVersions}</button>` : ''}
      ${ad.image_url ? `<button class="btn btn-primary" onclick="regenerateOneAdFromModal()">Regenerate (creates v${totalNonGenerating + 1})</button>` : ''}
    `;
  } else {
    leftPane = '<div class="empty-state">No versions yet for this slot.</div>';
    rightTopPane = '';
    rightBottomPane = '';
    footer = `<button class="btn" onclick="closeModal()">Close</button>`;
  }

  showModal(`
    <div class="modal-header">
      <div>
        <h3 class="modal-title">${MODAL_AD.archetype} · ${htmlEscape(arch.name||'')}</h3>
        <div class="modal-subtitle">${htmlEscape(client?.business_name||'')} · ${selectedAd ? htmlEscape(selectedAd.city||'') : ''}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    ${versions.length > 1 || MODAL_AD.generating ? `
      <div style="padding:10px 22px; background:var(--surface-2); border-bottom:1px solid var(--border); display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
        <span style="font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-right:6px;">VERSIONS:</span>
        ${pills}
        ${generatingPill}
        ${current && versions.length > 1 ? `<span style="margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-3);">★ = the version shown on the client page</span>` : ''}
      </div>` : ''}
    <div class="modal-body">
      <div class="paired-grid">
        <div>${leftPane}</div>
        <div class="paired-side">
          <div>${rightTopPane}</div>
          <div>${rightBottomPane}</div>
        </div>
      </div>
    </div>
    <div class="modal-footer">${footer}</div>
  `, { large: true });
}

// Click a pill = view that version AND promote it to current. Operator
// asked for this UX simplification: "whichever I clicked on last is the
// one I want shown on the slot card." The modal updates instantly from
// already-loaded ADS, then the promote API call runs in the background;
// when it returns, ADS is refreshed so the ★ visually moves.
async function selectAdVersion(adId) {
  MODAL_AD.selectedVersionId = adId;
  renderAdDetailModal();
  try {
    const r = await fetch('/api/ads/' + encodeURIComponent(adId) + '/promote', { method: 'POST' });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'HTTP ' + r.status); }
    ADS = await api.ads.list();
    renderAdDetailModal();   // ★ marker now points at the just-clicked version
    render();                // slot card on client page reflects the new current
  } catch (err) { console.warn('[selectAdVersion] promote failed:', err.message); }
}
window.selectAdVersion = selectAdVersion;

// Soft-delete a version. Confirms first since regenerations cost ~$2.50 each.
// Files stay on disk; only the ads.json record is removed. Handles three
// cases: deleted the selected version, deleted the current, deleted the
// last remaining version (modal closes).
async function deleteAdVersion(adId, versionIndex) {
  if (!confirm(`Delete v${versionIndex}? Files stay on disk but the version disappears from this list. This can't be undone from the UI.`)) return;
  try {
    const r = await fetch('/api/ads/' + encodeURIComponent(adId), { method: 'DELETE' });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'HTTP ' + r.status); }
    ADS = await api.ads.list();
    // Recompute versions for the same (client, archetype) — pick a sensible
    // selection: if the just-deleted ad was selected, fall back to current
    // (next-newest by promoted_at); if no versions remain, close the modal.
    const { versions: remaining, current: newCurrent } = getVersions(MODAL_AD.clientId, MODAL_AD.archetype);
    if (remaining.length === 0) {
      closeModal();
      MODAL_AD.clientId = null;
      MODAL_AD.archetype = null;
      MODAL_AD.selectedVersionId = null;
    } else if (MODAL_AD.selectedVersionId === adId) {
      MODAL_AD.selectedVersionId = (newCurrent && newCurrent.id) || remaining[remaining.length - 1].id;
      renderAdDetailModal();
    } else {
      renderAdDetailModal();
    }
    render();   // slot card on client page reflects new current (or PENDING)
  } catch (err) { alert('Delete failed: ' + err.message); }
}
window.deleteAdVersion = deleteAdVersion;

// Called from the modal's Regenerate button — keeps the modal open and shows
// the generation in place. Different code path from the slot-level Retry which
// is fired from outside the modal.
async function regenerateOneAdFromModal() {
  const clientId = MODAL_AD.clientId;
  const archetypeCode = MODAL_AD.archetype;
  if (!clientId || !archetypeCode) return;

  // Stamp modal state so renderAdDetailModal shows the generating view.
  MODAL_AD.generating = true;
  MODAL_AD.startedAt = Date.now();
  renderAdDetailModal();

  // Refresh elapsed-time display every second while generating.
  const ticker = setInterval(() => {
    if (MODAL_AD.generating) renderAdDetailModal();
    else clearInterval(ticker);
  }, 1000);

  // Also use the existing PACK_STATE so the underlying client page slot
  // card flips into GENERATING state — user can close modal and watch from
  // the slot if they want.
  if (!PACK_STATE[clientId]) PACK_STATE[clientId] = { running: false, current: null, done: new Set(), errors: {} };
  const ps = PACK_STATE[clientId];
  ps.running = true; ps.current = archetypeCode; delete ps.errors[archetypeCode];
  render();

  try {
    const r = await fetch('/api/packs', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, archetype_filter: [archetypeCode] }),
    });
    const manifest = await r.json();
    const entry = manifest.entries.find((e) => e.archetype === archetypeCode);
    if (!entry) throw new Error('manifest had no entry for ' + archetypeCode);

    const gr = await fetch('/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        archetype: entry.archetype, client_id: entry.client_id,
        picks: entry.picks, component_keys: entry.component_keys,
        attach_client_photos: entry.attach_client_photos || [],
        quality: entry.quality, n_candidates: entry.n_candidates,
      }),
    });
    if (!gr.ok) { const j = await gr.json().catch(() => ({})); throw new Error(j.error || 'HTTP ' + gr.status); }
    const result = await gr.json();
    ADS = await api.ads.list();
    MODAL_AD.selectedVersionId = result.ad_id;   // jump to the new version when it lands
  } catch (err) {
    alert('Regenerate failed: ' + err.message);
    if (PACK_STATE[clientId]) PACK_STATE[clientId].errors[archetypeCode] = err.message;
  } finally {
    clearInterval(ticker);
    MODAL_AD.generating = false;
    if (PACK_STATE[clientId]) { PACK_STATE[clientId].running = false; PACK_STATE[clientId].current = null; }
    renderAdDetailModal();
    render();
  }
}
window.regenerateOneAdFromModal = regenerateOneAdFromModal;

// ------------------------------------------------------------
// SECTION 1: ARCHETYPES
// ------------------------------------------------------------
function renderArchetypesList() {
  const items = STATE.archetypes.map((a, idx) => {
    const refId = a.exemplar;
    const thumb = REF_THUMBS[refId];
    const fires = a.code === 'A10' ?
      '<span class="pill pill-amber">Conditional · team photos required</span>' :
      '<span class="pill pill-green">Always generates</span>';
    const poolCount = a.variable_inputs ? Object.keys(a.variable_inputs).length : 0;
    return `
      <div class="arch-list-item" data-arch-idx="${idx}">
        ${thumb ? `<img class="arch-list-thumb zoomable" src="${thumb}" alt="" data-caption="${htmlEscape(a.code + ' — ' + a.name)}">` : '<div class="arch-list-thumb"></div>'}
        <div class="arch-list-code">${a.code}</div>
        <div>
          <div class="arch-list-name">${htmlEscape(a.name)}</div>
          <div class="arch-list-tag">${htmlEscape(a.tagline || '')}</div>
          <div class="arch-list-meta"><span>${htmlEscape(a.funnel_stage || '')}</span><span>·</span><span>${poolCount} input pools</span></div>
        </div>
        <div>${fires}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="page-header">
      <div class="page-eyebrow">Configuration · Archetypes</div>
      <h1 class="page-title">Archetypes</h1>
      <p class="page-intro">The 10 ad archetypes the system generates. Each has its own reference ad, locked rules, variable input pools, available components, funnel stage, and gold standard. Click any archetype to expand its full configuration.</p>
    </div>
    <div class="arch-list">${items}</div>
  `;
}

function buildPoolBlock(title, items, archCode, poolKey) {
  if (!items) items = [];
  return `
    <div class="pool">
      <div class="pool-h">
        <div>
          <div class="pool-h-title">${htmlEscape(title)}</div>
          <div class="pool-h-meta">${items.length} option${items.length===1?'':'s'}</div>
        </div>
        <div class="pool-h-actions">
          <button class="btn btn-sm" onclick="addToPool('${archCode}','${poolKey.replace(/'/g,"\\'")}')">+ Add</button>
        </div>
      </div>
      <ul class="pool-list">
        ${items.map((item, i) => `
          <li>
            <span class="pool-idx">[${i}]</span>
            <span>${htmlEscape(item)}</span>
            <button class="btn btn-sm" onclick="editPoolItem('${archCode}','${poolKey.replace(/'/g,"\\'")}',${i})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deletePoolItem('${archCode}','${poolKey.replace(/'/g,"\\'")}',${i})">Delete</button>
          </li>
        `).join('') || '<li><span class="pool-idx">—</span><span style="color:var(--text-3); font-style:italic">No options yet. Click + Add.</span></li>'}
      </ul>
    </div>
  `;
}

function renderArchetypeDetail(idx) {
  const arch = STATE.archetypes[idx];
  const refId = arch.exemplar;
  const thumb = REF_THUMBS[refId];
  const v = arch.variable_inputs || {};
  const headlineKeys = Object.keys(v).filter(k => k.toLowerCase().startsWith('headline'));

  // Component picker grouped by category
  const cats = [...new Set(STATE.components.map(c => c.category))];
  const componentPicker = cats.map(cat => {
    const inCat = STATE.components.filter(c => c.category === cat);
    return `
      <div class="component-cat-h">${htmlEscape(cat)}</div>
      <div class="component-pick-grid">
        ${inCat.map(c => {
          const selected = (c.usedBy || []).includes(arch.code);
          const thumbContent = c.uploadedImage ?
            `<img src="${c.uploadedImage}" style="width:100%; height:100%; object-fit:contain; padding:8px; border-radius:4px;">` :
            htmlEscape(c.imageId || c.key);
          return `
            <div class="component-pick-card ${selected?'selected':''}" onclick="toggleComponentForArch('${c.key}','${arch.code}')">
              <div class="check-mark">✓</div>
              <div class="component-pick-thumb">${thumbContent}</div>
              <div class="component-pick-name">${htmlEscape(c.key)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  // Gold standard
  const gold = GOLDS[arch.code];
  const goldOutputSlot = (() => {
    const url = gold && gold.output_image_url;
    if (url) {
      return `
        <div class="gold-output-placeholder" style="aspect-ratio:1; padding:0; overflow:hidden; position:relative;">
          <img class="zoomable" src="${url}?v=${Date.now()}" data-caption="${htmlEscape(arch.code + ' gold standard output')}" alt="${htmlEscape(arch.code)} gold standard output" style="width:100%; height:100%; object-fit:cover; display:block;">
        </div>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <button class="btn btn-sm" onclick="document.getElementById('gold-img-input-${arch.code}').click()">Replace image</button>
          <button class="btn btn-sm btn-danger" onclick="deleteGoldOutputImage('${arch.code}')">Remove</button>
          <input id="gold-img-input-${arch.code}" type="file" accept="image/*" style="display:none" onchange="uploadGoldOutputImage('${arch.code}', this)">
        </div>
      `;
    }
    return `
      <div class="gold-output-placeholder">
        <div class="ph-title">${arch.code} · ${htmlEscape(arch.name)}</div>
        <div class="ph-sub">[ No output image uploaded yet ]</div>
      </div>
      <div style="margin-top:8px;">
        <button class="btn btn-sm" onclick="document.getElementById('gold-img-input-${arch.code}').click()">+ Upload generated ad image</button>
        <input id="gold-img-input-${arch.code}" type="file" accept="image/*" style="display:none" onchange="uploadGoldOutputImage('${arch.code}', this)">
      </div>
    `;
  })();
  const goldBlock = gold ? `
    <div class="gold-block">
      <div>
        <h4>Generated ad output</h4>
        ${goldOutputSlot}
      </div>
      <div>
        <h4>Composition lessons</h4>
        <p style="margin:0 0 10px; font-size:13px"><strong>Variant:</strong> ${htmlEscape(gold.variant || '—')}</p>
        <p style="margin:0 0 10px; font-size:13px"><strong>Funnel:</strong> ${htmlEscape(gold.funnel_stage || '—')}</p>
        <p style="margin:0 0 10px; font-size:13px"><strong>Outcome:</strong> ${htmlEscape(gold.tested_outcome || '')}</p>
        <h4 style="margin-top:14px; font-size:13px">What worked</h4>
        <ul style="margin:0; padding-left:18px; font-size:12.5px;">
          ${(gold.composition_choices_that_worked || []).slice(0,4).map(c => `<li style="margin-bottom:3px">${htmlEscape(c)}</li>`).join('')}
        </ul>
      </div>
      <div>
        <h4>The actual ChatGPT prompt</h4>
        <div class="gold-prompt-display">${htmlEscape(gold.full_prompt_used || '(not captured)')}</div>
      </div>
    </div>
  ` : `<div class="empty-state">No gold standard captured yet for ${arch.code}.</div>`;

  return `
    <div class="back-link" onclick="goBack()">← Back to all archetypes</div>
    <div class="page-header">
      <div class="page-eyebrow">Archetype</div>
      <h1 class="page-title">${arch.code} — ${htmlEscape(arch.name)}</h1>
      <p class="page-intro">${htmlEscape(arch.tagline || '')}</p>
      <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap">
        ${arch.code === 'A10' ?
          '<span class="pill pill-amber">Conditional · only generates if team photos uploaded</span>' :
          '<span class="pill pill-green">Always generates for every client</span>'}
        <span class="pill">Funnel: ${htmlEscape(arch.funnel_stage || '?')}</span>
      </div>
    </div>

    <div class="section">
      <h2 class="section-h">Reference ad</h2>
      <div class="section-flow">→ feeds prompt §1 IMAGE INSTRUCTIONS · attached as IMAGE 1 every generation</div>
      <p class="section-intro">The reference ad is the visual template that gives every ${arch.code} ad its DNA. ChatGPT is told to match the style and density — but never copy specifics. Uploadable when you find a better-performing reference (changing the reference may also require revisiting the archetype's rules and variable inputs).</p>
      <div class="ref-block">
        <div>${thumb ? `<img class="ref-img zoomable" src="${thumb}" alt="" data-caption="${htmlEscape(arch.code + ' reference ad')}">` : `<div class="ref-empty">No reference uploaded</div>`}</div>
        <div>
          <h4 style="font-family:Fraunces,serif; font-size:18px; margin:0 0 8px">Current reference image</h4>
          <p style="color:var(--text-2); font-size:13.5px; margin:0 0 16px">Uploaded once per archetype. Attached to ChatGPT as IMAGE 1 every time this archetype generates.</p>
          <button class="btn" onclick="replaceReferenceImage('${arch.code}')">Replace reference image</button>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-h">Archetype-specific rules</h2>
      <div class="section-flow">→ feeds prompt §5 MOOD &amp; STYLE and §7 HARD RULES</div>
      <p class="section-intro">These rules are locked for ${arch.code} and never change between generations. Global rules are not duplicated — they live in the Global Rules section and apply automatically.</p>
      <div class="rules-list" id="arch-rules-list">
        ${(arch.rules||[]).map((r, i) => `
          <div class="rule-item">
            <div class="rule-num">${i+1}</div>
            <div class="rule-text">${htmlEscape(r)}</div>
            <button class="btn btn-sm" onclick="editArchRule('${arch.code}',${i})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteArchRule('${arch.code}',${i})">Delete</button>
          </div>
        `).join('') || '<div style="padding:18px; color:var(--text-3); font-style:italic; text-align:center">No archetype-specific rules yet. Click + Add rule.</div>'}
      </div>
      <div style="margin-top:10px;"><button class="btn" onclick="addArchRule('${arch.code}')">+ Add rule</button></div>
    </div>

    <div class="section">
      <h2 class="section-h">Variable input pools</h2>
      <div class="section-flow">→ feeds prompt §6 LAYOUT subsections · master AI picks one from each per generation</div>
      <p class="section-intro">For every ${arch.code} ad, Master AI picks one item from each pool when composing the prompt. Add or remove options here to expand or constrain the creative space. Edits flow into the live prompt simulator below.</p>
      ${headlineKeys.map(k => buildPoolBlock(k, v[k], arch.code, k)).join('')}
      ${buildPoolBlock('Sub-headlines', v['Sub-headlines'], arch.code, 'Sub-headlines')}
      ${buildPoolBlock('Value stacks', v['Value stacks'], arch.code, 'Value stacks')}
      ${buildPoolBlock('CTAs', v.CTAs, arch.code, 'CTAs')}
      ${buildPoolBlock('Badges', v.Badges, arch.code, 'Badges')}
      ${buildPoolBlock('Visual hero options', v['Visual hero options'], arch.code, 'Visual hero options')}
    </div>

    <div class="section">
      <h2 class="section-h">Components available to this archetype</h2>
      <div class="section-flow">→ Layer 1 attaches selected components as IMAGE 2/3/... · pulled from global Components library</div>
      <p class="section-intro">Click components to select/deselect them for ${arch.code}. Component details (image, description) live globally in the Components section — here you simply pick which ones this archetype can use. Master AI attaches them as locked images, never letting ChatGPT regenerate (HR02).</p>
      <div class="component-picker">${componentPicker}</div>
    </div>

    <div class="section">
      <h2 class="section-h">Live prompt preview</h2>
      <div class="section-flow">→ shows §1–§7 of the composed prompt with every input traced to source</div>
      <p class="section-intro">Change the dropdowns to see the prompt rebuild in real time. Dropdowns reflect your edits to the pools above — add a new headline and it appears here.</p>
      <div class="legend">
        <div><span class="legend-dot" style="background:#93c5fd"></span>Locked archetype DNA</div>
        <div><span class="legend-dot" style="background:#fbbf24"></span>Picked from variable pool</div>
        <div><span class="legend-dot" style="background:#86efac"></span>Client onboarding data</div>
        <div><span class="legend-dot" style="background:#f9a8d4"></span>Global hard rule</div>
      </div>
      <div class="preview-controls" id="pp-controls">${buildPreviewControls(arch)}</div>
      <div class="preview-output" id="pp-output"></div>
    </div>

    <div class="section">
      <h2 class="section-h">Gold standard</h2>
      <div class="section-flow">→ proven prompt + ad output from live ChatGPT testing</div>
      <p class="section-intro">The benchmark for ${arch.code}. Master AI is tuned to produce prompts that match this quality bar.</p>
      ${goldBlock}
    </div>
  `;
}

function buildPreviewControls(arch) {
  const v = arch.variable_inputs || {};
  const cities = STATE.prices.map(p => p.city);
  const headlineKey = Object.keys(v).find(k => k.toLowerCase().startsWith('headline')) || 'Headlines';
  const headlines = v[headlineKey] || [];
  const valueStacks = v['Value stacks'] || [];
  const ctas = v.CTAs || [];
  const badges = v.Badges || [];
  return `
    <div>
      <label>City (client onboarding data)</label>
      <select id="pp-city">${cities.map(c => `<option value="${c}"${c==='Brisbane'?' selected':''}>${c}</option>`).join('')}</select>
    </div>
    <div>
      <label>Headline pick (from pool)</label>
      <select id="pp-headline" data-key="${headlineKey}">${headlines.map((h, i) => `<option value="${i}">${htmlEscape(h)}</option>`).join('') || '<option>— no headlines —</option>'}</select>
    </div>
    <div>
      <label>Value stack pick (from pool)</label>
      <select id="pp-value">${valueStacks.map((vs, i) => `<option value="${i}">${htmlEscape(vs.length>80?vs.substring(0,80)+'...':vs)}</option>`).join('') || '<option>— no value stacks —</option>'}</select>
    </div>
    <div>
      <label>CTA pick (from pool)</label>
      <select id="pp-cta">${ctas.map((c, i) => `<option value="${i}">${htmlEscape(c)}</option>`).join('') || '<option>— no CTAs —</option>'}</select>
    </div>
    ${badges.length ? `<div>
      <label>Badge pick (from pool)</label>
      <select id="pp-badge">${badges.map((b, i) => `<option value="${i}">${htmlEscape(b)}</option>`).join('')}</select>
    </div>` : ''}
  `;
}

function rebuildPrompt() {
  const arch = STATE.archetypes[currentArchIdx];
  if (!arch) return;
  const v = arch.variable_inputs || {};
  const cityEl = document.getElementById('pp-city');
  const hEl = document.getElementById('pp-headline');
  const vEl = document.getElementById('pp-value');
  const cEl = document.getElementById('pp-cta');
  const bEl = document.getElementById('pp-badge');
  if (!cityEl || !hEl) return;

  const headlineKey = hEl.dataset.key;
  const city = cityEl.value;
  const headline = (v[headlineKey]||[])[parseInt(hEl.value)] || '';
  const valueStack = (v['Value stacks']||[])[parseInt(vEl.value)] || '';
  const cta = (v.CTAs||[])[parseInt(cEl.value)] || '';
  const badge = bEl ? (v.Badges||[])[parseInt(bEl.value)] : '';
  const priceRow = STATE.prices.find(p => p.city === city);
  const perWeek = priceRow ? priceRow.perWeek : '$55';
  const headlineFinal = headline.replace(/\{\{city\}\}/g, city);
  const ref = arch.exemplar;

  let out = '';
  out += `<span class="src-LOCKED">[§1 · IMAGE INSTRUCTIONS]</span> <span class="source-tag">LOCKED · archetype.exemplar</span>\n`;
  out += `Use the attached reference image as a strong style and layout reference. Match its visual energy, density, and feel — but DO NOT copy its headline, hero visual, or specific colours.\n\n`;
  out += `<span class="src-CLIENT">[§2 · PRODUCT/LOCATION FRAMING]</span> <span class="source-tag">CLIENT · client.city</span>\n`;
  out += `Create a square 1080×1080 social media ad for a residential ducted air conditioning installer in <span class="src-CLIENT">${htmlEscape(city)}</span>, Australia.\n\n`;
  out += `<span class="src-LOCKED">[§3 · FUNNEL CONTEXT]</span> <span class="source-tag">LOCKED · archetype.funnel_stage</span>\n`;
  out += `This ad is for a <span class="src-LOCKED">${htmlEscape(arch.funnel_stage||'cold/warm')}</span> audience. ${htmlEscape(arch.tagline||'')}\n\n`;
  out += `<span class="src-RULE">[§4 · CRITICAL CLARITY RULE]</span> <span class="source-tag">GLOBAL RULE · HR13</span>\n`;
  out += `A scroller must understand within ONE SECOND that this ad is for DUCTED AIR CONDITIONING.\n\n`;
  out += `<span class="src-LOCKED">[§5 · MOOD & STYLE]</span> <span class="source-tag">LOCKED · archetype.rules</span>\n`;
  out += `${(arch.rules||[]).filter(r => r.toLowerCase().includes('mood') || r.toLowerCase().includes('palette') || r.toLowerCase().includes('font') || r.toLowerCase().includes('colour')).map(r => htmlEscape(r)).join(' ') || 'Per archetype-specific rules.'}\n\n`;
  out += `<span class="src-LOCKED">[§6 · LAYOUT — top to bottom]</span>\n\n`;
  out += `<span class="src-PICKED">[§6.1 HEADLINE]</span> <span class="source-tag">PICKED · ${headlineKey}[${hEl.value}]</span>\n`;
  out += `Oversized bold uppercase: "<span class="src-PICKED">${htmlEscape(headlineFinal)}</span>"\n\n`;
  out += `<span class="src-CLIENT">[§6.2 PRICE PILL]</span> <span class="source-tag">CLIENT · price library</span>\n`;
  out += `"DUCTED A/C INSTALLED FOR" / "<span class="src-CLIENT">${htmlEscape(perWeek)}</span>" / "PER WEEK"\n\n`;
  if (valueStack) {
    out += `<span class="src-PICKED">[§6.3 VALUE STACK]</span> <span class="source-tag">PICKED · Value stacks[${vEl.value}]</span>\n`;
    out += valueStack.split('|').map(x => '✓ <span class="src-PICKED">' + htmlEscape(x.trim()) + '</span>').join('\n') + '\n\n';
  }
  if (cta) {
    out += `<span class="src-PICKED">[§6.4 CTA BUTTON]</span> <span class="source-tag">PICKED · CTAs[${cEl.value}]</span>\n`;
    out += `Pill button: "<span class="src-PICKED">${htmlEscape(cta)}</span>"\n\n`;
  }
  if (badge) {
    out += `<span class="src-PICKED">[§6.5 BADGE]</span> <span class="source-tag">PICKED · Badges[${bEl.value}]</span>\n`;
    out += `Badge: "<span class="src-PICKED">${htmlEscape(badge)}</span>"\n\n`;
  }
  out += `<span class="src-RULE">[§7 · GLOBAL HARD RULES]</span> <span class="source-tag">GLOBAL · all 17 rules</span>\n`;
  STATE.globalRules.slice(0, 5).forEach(r => {
    out += `- (${ruleLabel(r)}) ${htmlEscape(r.rule)}\n`;
  });
  out += `- ...plus 12 more (see Global Rules section)\n`;

  document.getElementById('pp-output').innerHTML = out;
}

// Edit handlers — archetype rules
function addArchRule(code) {
  showEditModal({
    title: 'Add archetype rule',
    subtitle: code + ' · new rule',
    value: '',
    multiline: true,
    onSave: (val) => {
      if (!val.trim()) return;
      const arch = STATE.archetypes.find(a => a.code === code);
      arch.rules = arch.rules || [];
      arch.rules.push(val.trim());
    }
  });
}
function editArchRule(code, i) {
  const arch = STATE.archetypes.find(a => a.code === code);
  showEditModal({
    title: 'Edit rule', subtitle: code + ' · rule [' + i + ']',
    value: arch.rules[i], multiline: true,
    onSave: (val) => { arch.rules[i] = val.trim(); }
  });
}
function deleteArchRule(code, i) {
  const arch = STATE.archetypes.find(a => a.code === code);
  confirmDelete(arch.rules[i].substring(0, 80) + '...', () => {
    arch.rules.splice(i, 1);
  });
}

// Edit handlers — variable input pools
function addToPool(code, poolKey) {
  showEditModal({
    title: 'Add to ' + poolKey, subtitle: code + ' · new option',
    value: '', multiline: poolKey.toLowerCase().includes('value') || poolKey.toLowerCase().includes('hero'),
    onSave: (val) => {
      if (!val.trim()) return;
      const arch = STATE.archetypes.find(a => a.code === code);
      arch.variable_inputs = arch.variable_inputs || {};
      arch.variable_inputs[poolKey] = arch.variable_inputs[poolKey] || [];
      arch.variable_inputs[poolKey].push(val.trim());
    }
  });
}
function editPoolItem(code, poolKey, i) {
  const arch = STATE.archetypes.find(a => a.code === code);
  showEditModal({
    title: 'Edit ' + poolKey + ' [' + i + ']', subtitle: code,
    value: arch.variable_inputs[poolKey][i],
    multiline: poolKey.toLowerCase().includes('value') || poolKey.toLowerCase().includes('hero'),
    onSave: (val) => { arch.variable_inputs[poolKey][i] = val.trim(); }
  });
}
function deletePoolItem(code, poolKey, i) {
  const arch = STATE.archetypes.find(a => a.code === code);
  confirmDelete(arch.variable_inputs[poolKey][i].substring(0, 80) + '...', () => {
    arch.variable_inputs[poolKey].splice(i, 1);
  });
}

function toggleComponentForArch(componentKey, archCode) {
  const c = STATE.components.find(x => x.key === componentKey);
  if (!c) return;
  c.usedBy = c.usedBy || [];
  const i = c.usedBy.indexOf(archCode);
  if (i >= 0) c.usedBy.splice(i, 1);
  else c.usedBy.push(archCode);
  render();
}

function replaceReferenceImage(archCode) {
  const arch = STATE.archetypes.find(a => a.code === archCode);
  if (!arch) return;
  showModal(`
    <div class="modal-header">
      <div>
        <h3 class="modal-title">Replace reference image</h3>
        <div class="modal-subtitle">${archCode} · ${htmlEscape(arch.name)}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div style="background:var(--warn-bg); border:1px solid var(--warn-border); border-radius:6px; padding:12px 14px; margin-bottom:16px; color:var(--warn-text); font-size:13px;">
        <strong>Heads up:</strong> Changing the reference ad changes the visual DNA of every ${archCode} ad you generate from now on. You may also want to revisit this archetype's rules and variable inputs to make sure they still match the new look.
      </div>
      <div class="form-row">
        <label>Currently uploaded</label>
        <div style="background:var(--surface-2); padding:10px 14px; border-radius:4px; font-family:'JetBrains Mono', monospace; font-size:12px; color:var(--text-2);">Reference image (the one shown above)</div>
      </div>
      <div class="form-row">
        <label>Upload new reference image</label>
        <div class="upload-slot" style="padding:32px;">+ Click to choose new reference image (PNG/JPG · square 1080×1080 recommended)</div>
        <div class="help-text">In production this opens a file picker. Mockup doesn't actually upload.</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="closeModal()">Replace reference</button>
    </div>
  `);
}

// ------------------------------------------------------------
// SECTION 2: GLOBAL RULES
// ------------------------------------------------------------
function renderGlobalRules() {
  return `
    <div class="page-header">
      <div class="page-eyebrow">Configuration · Global Rules</div>
      <h1 class="page-title">Global Rules</h1>
      <p class="page-intro">17 hard rules that apply to every archetype, every generation, every client. Master AI inlines these into every composed prompt automatically. Edit once here, applies everywhere — never duplicated inside individual archetypes.</p>
    </div>
    <div style="margin-bottom:18px"><button class="btn btn-primary" onclick="addGlobalRule()">+ Add new rule</button></div>
    ${STATE.globalRules.map((r, i) => `
      <div class="grule-card">
        <div class="grule-num">${ruleLabel(r)}</div>
        <div class="grule-text">${htmlEscape(r.rule)}</div>
        <button class="btn btn-sm" onclick="editGlobalRule(${i})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteGlobalRule(${i})">Delete</button>
      </div>
    `).join('')}
  `;
}
function addGlobalRule() {
  // Find the highest numeric portion of any existing ID (handles both "HR01" and 1)
  const existingNums = STATE.globalRules.map(r => {
    const s = String(r.id);
    const num = parseInt(s.replace(/^HR/, ''), 10);
    return isNaN(num) ? 0 : num;
  });
  const nextNum = Math.max(0, ...existingNums) + 1;
  const newId = 'HR' + String(nextNum).padStart(2, '0');
  showEditModal({
    title: 'Add global rule', subtitle: newId,
    value: '', multiline: true,
    onSave: (val) => {
      if (!val.trim()) return;
      STATE.globalRules.push({id: newId, rule: val.trim()});
    }
  });
}
function editGlobalRule(i) {
  showEditModal({
    title: 'Edit global rule', subtitle: ruleLabel(STATE.globalRules[i]),
    value: STATE.globalRules[i].rule, multiline: true,
    onSave: (val) => { STATE.globalRules[i].rule = val.trim(); }
  });
}
function deleteGlobalRule(i) {
  confirmDelete(ruleLabel(STATE.globalRules[i]) + ' — ' + STATE.globalRules[i].rule.substring(0,80), () => {
    STATE.globalRules.splice(i, 1);
  });
}

// ------------------------------------------------------------
// SECTION 3: COMPONENTS
// ------------------------------------------------------------
function renderComponents() {
  const cats = [...new Set(STATE.components.map(c => c.category))].sort();
  if (!cats.includes(currentComponentCat)) currentComponentCat = cats[0] || '';
  const inCat = STATE.components.filter(c => c.category === currentComponentCat);
  return `
    <div class="page-header">
      <div class="page-eyebrow">Configuration · Components Library</div>
      <h1 class="page-title">Components</h1>
      <p class="page-intro">Global library of all visual components. Archetypes select which components from this library they have access to. Component details live here once — never duplicated. HR02 enforces all technical components (condensers, outlets, ducting, diagrams) come from this library, never AI-generated.</p>
    </div>
    <div class="note-block" style="background:#eff6ff; border-color:#93c5fd; color:#1e40af;">
      <div class="note-block-title">
        <svg class="note-block-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Component images are stored once and used everywhere
      </div>
      <div>Upload an image once here and it appears wherever the component is referenced — in the picker on each archetype's page, in the prompt-attachment bundle when generating ads, and in any past-ad records that used this component. Click <strong>+ Upload new component</strong> to add one, or click <strong>Upload image</strong> on any existing card to attach an image to it. (Mockup stores images in browser memory only; production stores them in S3/R2.)</div>
    </div>
    <div style="margin-bottom:18px; display:flex; gap:10px;">
      <button class="btn btn-primary" onclick="addComponent()">+ Upload new component</button>
      <button class="btn">+ New category</button>
    </div>
    <div class="components-grid">
      <div class="components-cats">
        ${cats.map(cat => {
          const count = STATE.components.filter(c => c.category === cat).length;
          return `<div class="components-cat-item ${cat===currentComponentCat?'active':''}" onclick="setComponentCat('${cat.replace(/'/g,"\\'")}')"><span>${htmlEscape(cat)}</span><span class="components-cat-count">${count}</span></div>`;
        }).join('')}
      </div>
      <div>
        <div class="components-list-grid">
          ${inCat.map((c, i) => {
            const realIdx = STATE.components.indexOf(c);
            const thumbContent = c.uploadedImage ?
              `<img class="zoomable" src="${c.uploadedImage}" data-caption="${htmlEscape(c.key)}" alt="${htmlEscape(c.key)}" style="width:100%; height:100%; object-fit:contain; padding:8px; border-radius:4px;">` :
              htmlEscape(c.imageId || c.key);
            return `
              <div class="component-card">
                <div class="component-card-thumb">${thumbContent}</div>
                <div class="component-card-name">${htmlEscape(c.key)}</div>
                <div class="component-card-desc">${htmlEscape(c.description || '')}</div>
                <div class="component-card-uses">Used by: ${(c.usedBy || []).join(', ') || '— none —'}</div>
                <div class="component-card-actions">
                  <button class="btn btn-sm" onclick="editComponent(${realIdx})">${c.uploadedImage ? 'Edit' : 'Upload image'}</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteComponent(${realIdx})">Delete</button>
                </div>
              </div>
            `;
          }).join('') || '<div class="empty-state">No components in this category yet.</div>'}
        </div>
      </div>
    </div>
  `;
}
function setComponentCat(cat) { currentComponentCat = cat; render(); }
function addComponent() {
  const cats = [...new Set(STATE.components.map(c => c.category))].sort();
  showModal(`
    <div class="modal-header">
      <div><h3 class="modal-title">Upload new component</h3><div class="modal-subtitle">Add to global library</div></div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-row"><label>Category</label><select id="cmp-cat">${cats.map(c=>`<option ${c===currentComponentCat?'selected':''}>${htmlEscape(c)}</option>`).join('')}<option value="__new__">+ New category</option></select></div>
      <div class="form-row"><label>Component key (id)</label><input id="cmp-key" type="text" placeholder="e.g. cond_panasonic"></div>
      <div class="form-row"><label>Description</label><textarea id="cmp-desc" placeholder="Brief description"></textarea></div>
      <div class="form-row">
        <label>Image upload</label>
        <input id="cmp-img-file" type="file" accept="image/*" style="padding:8px; border:1px dashed var(--border-2); background:var(--surface-2); cursor:pointer;">
        <div id="cmp-img-preview" style="margin-top:10px;"></div>
        <div class="help-text">Image is stored in memory for this session. In production it persists to S3/R2 and is reused everywhere this component is referenced.</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="cmp-save">Save component</button>
    </div>
  `);
  // Wire up file preview
  const fileInput = document.getElementById('cmp-img-file');
  let dataUri = null;
  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      dataUri = ev.target.result;
      document.getElementById('cmp-img-preview').innerHTML = `<img src="${dataUri}" style="max-width:140px; max-height:140px; border:1px solid var(--border); border-radius:4px;">`;
    };
    reader.readAsDataURL(f);
  });
  document.getElementById('cmp-save').addEventListener('click', () => {
    const cat = document.getElementById('cmp-cat').value;
    const key = document.getElementById('cmp-key').value.trim();
    const desc = document.getElementById('cmp-desc').value.trim();
    if (!key) return;
    STATE.components.push({category: cat, key, description: desc, type: 'image', usedBy: [], imageId: key, uploadedImage: dataUri});
    closeModal();
    render();
  });
}
function editComponent(i) {
  const c = STATE.components[i];
  showModal(`
    <div class="modal-header">
      <div><h3 class="modal-title">Edit component</h3><div class="modal-subtitle">${htmlEscape(c.key)}</div></div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-row"><label>Component key</label><input id="cmp-key" type="text" value="${htmlEscape(c.key).replace(/"/g,'&quot;')}"></div>
      <div class="form-row"><label>Description</label><textarea id="cmp-desc">${htmlEscape(c.description || '')}</textarea></div>
      <div class="form-row">
        <label>Image</label>
        ${c.uploadedImage ? `<div style="margin-bottom:10px;"><img class="zoomable" src="${c.uploadedImage}" data-caption="${htmlEscape(c.key)}" alt="${htmlEscape(c.key)}" style="max-width:140px; max-height:140px; border:1px solid var(--border); border-radius:4px;"></div>` : '<div style="color:var(--text-3); font-size:12px; margin-bottom:8px; font-style:italic;">No image uploaded yet — placeholder shown in mockup.</div>'}
        <input id="cmp-img-file" type="file" accept="image/*" style="padding:8px; border:1px dashed var(--border-2); background:var(--surface-2); cursor:pointer;">
      </div>
      <div class="form-row"><label>Used by archetypes</label><input type="text" value="${(c.usedBy||[]).join(', ')}" disabled style="color:var(--text-3)"><div class="help-text">Set from each archetype's component picker</div></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="cmp-save">Save changes</button>
    </div>
  `);
  let newDataUri = c.uploadedImage || null;
  const fileInput = document.getElementById('cmp-img-file');
  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => { newDataUri = ev.target.result; };
    reader.readAsDataURL(f);
  });
  document.getElementById('cmp-save').addEventListener('click', () => {
    c.key = document.getElementById('cmp-key').value.trim();
    c.description = document.getElementById('cmp-desc').value.trim();
    c.uploadedImage = newDataUri;
    closeModal();
    render();
  });
}
function deleteComponent(i) {
  confirmDelete(STATE.components[i].key, () => { STATE.components.splice(i, 1); });
}

// ------------------------------------------------------------
// SECTION 4: CLIENTS
// ------------------------------------------------------------
function renderClients() {
  if (currentClientId) return renderClientDetail(currentClientId);
  if (currentClientTab === 'new') return renderClientNew();
  return renderClientList();
}

function renderClientList() {
  return `
    <div class="page-header">
      <div class="page-eyebrow">Operations · Clients</div>
      <h1 class="page-title">Clients</h1>
      <p class="page-intro">Internal client management. Clients don't access this system — admins fill out the onboarding form on each client's behalf. Each client file shows the full journey from onboarding through to generated ads.</p>
    </div>
    <div class="client-tabs">
      <div class="client-tab ${currentClientTab==='list'?'active':''}" onclick="setClientTab('list')">All clients</div>
      <div class="client-tab ${currentClientTab==='new'?'active':''}" onclick="setClientTab('new')">+ New client (onboarding form)</div>
    </div>
    <table class="clients-table">
      <thead><tr><th>Business</th><th>Location</th><th>Brands</th><th>Reviews</th><th>Photos</th><th>Ads generated</th><th>Onboarded</th></tr></thead>
      <tbody>
        ${CLIENTS.map(c => {
          const photos = [c.team_photos_uploaded?'team':null, c.owner_photos_uploaded?'owner':null, c.van_photos_uploaded?'van':null].filter(x=>x).join(', ') || '—';
          return `
            <tr onclick="openClient('${c.id}')">
              <td><strong>${htmlEscape(c.business_name)}</strong></td>
              <td>${htmlEscape(c.city)}, ${htmlEscape(c.state)} · ${htmlEscape(c.postcode)}</td>
              <td>${c.brands_sold.length} (${c.brands_sold.slice(0,2).join(', ')}${c.brands_sold.length>2?'...':''})</td>
              <td>${c.google_review_count}</td>
              <td>${photos}</td>
              <td>${c.ads_generated}</td>
              <td>${htmlEscape(c.onboarded_date)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderClientNew() {
  const allBrands = ['ActronAir', 'Braemar', 'Carrier', 'Daikin', 'Fujitsu', 'Gree', 'Haier', 'Hisense', 'Hitachi', 'LG', 'Midea', 'Mitsubishi Electric', 'Mitsubishi Heavy Industries', 'Panasonic', 'Rinnai', 'Samsung', 'Toshiba'];
  const cities = STATE.prices.map(p => p.city);
  return `
    <div class="page-header">
      <div class="page-eyebrow">Operations · Clients</div>
      <h1 class="page-title">New client onboarding</h1>
      <p class="page-intro">Fill out this form on behalf of the client. Submitting creates a new client file and triggers Master AI to generate the full ad pack.</p>
    </div>
    <div class="client-tabs">
      <div class="client-tab" onclick="setClientTab('list')">All clients</div>
      <div class="client-tab active">+ New client (onboarding form)</div>
    </div>
    <div class="form-grid">
      <div class="form-section-h">Business details</div>
      <div class="form-group"><label>Business name</label><input type="text" placeholder="e.g. Sharp Air Conditioning"></div>
      <div class="form-group"><label>Years in business</label><input type="number" placeholder="e.g. 11"></div>
      <div class="form-group"><label>City (primary service area)</label><select><option value="">Select city...</option>${cities.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label>Postcode</label><input type="text" placeholder="e.g. 2250"><div class="help-text">Critical for diversity scope — clients in non-overlapping postcodes can share ads.</div></div>
      <div class="form-group"><label>State</label><select><option>NSW</option><option>VIC</option><option>QLD</option><option>WA</option><option>SA</option><option>ACT</option><option>TAS</option><option>NT</option></select></div>
      <div class="form-group"><label>Service region (free text)</label><input type="text" placeholder="e.g. Central Coast · Newcastle · Hunter Valley"></div>
      <div class="form-section-h">Brands sold</div>
      <div class="form-group" style="grid-column:1 / -1">
        <label>Multi-select (will appear in brand strip across ads)</label>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; padding:10px; background:var(--bg); border:1px solid var(--border-2); border-radius:4px;">
          ${allBrands.map(b => `<label style="display:flex; align-items:center; gap:8px; font-size:13px; font-family:inherit; text-transform:none; letter-spacing:normal; color:var(--text-1); font-weight:400; margin:0; cursor:pointer;"><input type="checkbox" style="width:auto;"> ${b}</label>`).join('')}
        </div>
      </div>
      <div class="form-section-h">Trust &amp; pricing</div>
      <div class="form-group"><label>Google review count</label><input type="number" placeholder="e.g. 168"><div class="help-text">If &lt; 30, review badges are omitted (HR08).</div></div>
      <div class="form-group"><label>Install guarantee (days)</label><input type="number" placeholder="e.g. 7"></div>
      <div class="form-group"><label>Default per-week price (override library)</label><input type="text" placeholder="e.g. $55"><div class="help-text">Leave blank to use Healthy Price Library default for the city.</div></div>
      <div class="form-group"><label>Current promo % (if any)</label><input type="number" placeholder="e.g. 30"></div>
      <div class="form-section-h">Photos uploaded</div>
      <div class="form-group"><label>Team photos</label><div class="upload-slot">+ Upload team photo(s)</div><div class="help-text">Local Trust (A10) ad fires if ANY of team / owner / van photos are uploaded.</div></div>
      <div class="form-group"><label>Owner photos</label><div class="upload-slot">+ Upload owner photo(s)</div></div>
      <div class="form-group"><label>Van / vehicle photos</label><div class="upload-slot">+ Upload van photo(s)</div></div>
      <div class="form-section-h">Submit</div>
      <div class="form-group" style="grid-column:1 / -1; display:flex; gap:10px; justify-content:flex-end;">
        <button class="btn">Save as draft</button>
        <button class="btn btn-primary">Create client &amp; generate ads</button>
      </div>
    </div>
  `;
}

// Pack generation state — keyed by client id. Tracks the sequential per-client
// loop firing /api/generate one archetype at a time. Survives page navigation
// since it lives in module scope.
const PACK_STATE = {};   // { [clientId]: { running, current, done:Set, errors:{} } }

function clientPackState(clientId) {
  return PACK_STATE[clientId] || { running: false, current: null, done: new Set(), errors: {} };
}

function renderClientDetail(clientId) {
  const c = CLIENTS.find(x => x.id === clientId);
  if (!c) return '<div class="empty-state">Client not found.</div>';
  const clientAds = ADS.filter(a => a.client_id === clientId);
  const hasPhoto = !!(c.team_photos_uploaded || c.owner_photos_uploaded || c.van_photos_uploaded);
  const ps = clientPackState(clientId);

  // Each archetype in canonical order — A10 only when at least one trust
  // photo is uploaded (matches Layer 1 gating per HR17 / PRODUCT_DIRECTION.md).
  // For each slot, the "current" version is the one with max promoted_at —
  // operator can promote an older version via the modal's Promote button.
  const slots = STATE.archetypes
    .slice()
    .sort((a, b) => (parseInt(String(a.code).replace(/\D/g,''),10)||0) - (parseInt(String(b.code).replace(/\D/g,''),10)||0))
    .filter((arch) => arch.code !== 'A10' || hasPhoto)
    .map((arch) => {
      // Sort by promoted_at desc with id tie-breaker (newest id wins).
      const versions = clientAds
        .filter((a) => a.archetype === arch.code)
        .sort((a, b) => {
          const ta = new Date(a.promoted_at || a.created || 0).getTime();
          const tb = new Date(b.promoted_at || b.created || 0).getTime();
          if (ta !== tb) return tb - ta;
          return (b.id || '').localeCompare(a.id || '');
        });
      const ad = versions[0] || null;
      const versionCount = versions.length;
      const generating = ps.running && ps.current === arch.code;
      const error = ps.errors[arch.code];
      return { arch, ad, versionCount, generating, error };
    });

  const totalSlots = slots.length;
  const completedSlots = slots.filter((s) => s.ad).length;

  // "Generate full pack" button shows when there are missing slots and no run is in flight.
  const missing = slots.filter((s) => !s.ad).map((s) => s.arch.code);
  const canFire = !ps.running && missing.length > 0;

  return `
    <div class="back-link" onclick="goToClientList()">← Back to all clients</div>
    <div class="page-header">
      <div class="page-eyebrow">Operations · Client file</div>
      <h1 class="page-title">${htmlEscape(c.business_name)}</h1>
      <p class="page-intro">${htmlEscape(c.region || c.city || '')} · onboarded ${htmlEscape(c.onboarded_date || '')} · ${completedSlots}/${totalSlots} ads in pack ${ps.running ? '· <strong style="color:var(--accent)">generating ' + ps.current + '…</strong>' : ''}</p>
    </div>
    <div class="client-detail-grid">
      <div class="client-summary">
        <h3>Client details</h3>
        <p style="font-size:12px; color:var(--text-3); margin:0 0 12px">From onboarding form</p>
        <div class="meta-row"><span class="meta-label">State</span><span>${htmlEscape(c.state || '')}</span></div>
        <div style="padding:8px 0; border-bottom:1px solid var(--surface-2);">
          <div class="meta-label" style="margin-bottom:6px">Service areas</div>
          ${(Array.isArray(c.service_areas) && c.service_areas.length ? c.service_areas : [{name: c.city, postcode: c.postcode, primary: true, notes: ''}]).map(a =>
            `<div style="font-size:12.5px; padding:3px 0; display:flex; gap:6px; align-items:baseline;">` +
              (a.primary ? `<span style="background:var(--accent-bg); color:var(--accent); font-family:'JetBrains Mono',monospace; font-size:9px; padding:1px 6px; border-radius:3px; text-transform:uppercase; letter-spacing:0.04em;">primary</span>` : `<span style="width:50px;"></span>`) +
              `<strong>${htmlEscape(a.name || '—')}</strong>` +
              (a.postcode ? `<span style="color:var(--text-3); font-family:'JetBrains Mono',monospace; font-size:11px;">${htmlEscape(a.postcode)}</span>` : '') +
              (a.notes ? `<span style="color:var(--text-3); font-size:11px; font-style:italic;"> · ${htmlEscape(a.notes)}</span>` : '') +
            `</div>`
          ).join('')}
        </div>
        <div class="meta-row"><span class="meta-label">Years</span><span>${c.years_in_business || 0}</span></div>
        <div class="meta-row"><span class="meta-label">Reviews</span><span>${c.google_review_count || 0}</span></div>
        <div class="meta-row"><span class="meta-label">Per-week</span><span>$${c.default_per_week_price || ''}</span></div>
        <div class="meta-row"><span class="meta-label">Install gtee</span><span>${c.install_guarantee_days || 0} days</span></div>
        <div class="meta-row"><span class="meta-label">Promo</span><span>${c.current_promo_pct || 0}%</span></div>
        <div class="meta-row"><span class="meta-label">Brands</span><span style="text-align:right; font-size:12px">${(c.brands_sold||[]).join(', ')}</span></div>
        <div class="meta-row"><span class="meta-label">Team photos</span><span>${c.team_photos_uploaded ? '✓' : '—'}</span></div>
        <div class="meta-row"><span class="meta-label">Owner photos</span><span>${c.owner_photos_uploaded ? '✓' : '—'}</span></div>
        <div class="meta-row"><span class="meta-label">Van photos</span><span>${c.van_photos_uploaded ? '✓' : '—'}</span></div>
        <div class="meta-row"><span class="meta-label">Family owned</span><span>${c.family_owned ? '✓' : '—'}</span></div>
        <div class="meta-row"><span class="meta-label">Aus owned</span><span>${c.australian_owned ? '✓' : '—'}</span></div>
        <div style="margin-top:14px; display:flex; gap:8px;"><button class="btn btn-sm" onclick="openEditClient('${c.id}')">Edit details</button><button class="btn btn-sm btn-danger" onclick="deleteClient('${c.id}')">Delete</button></div>
      </div>
      <div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
          <h2 style="font-family:Fraunces,serif; font-size:22px; margin:0;">Generated ads (${completedSlots}/${totalSlots})</h2>
          ${canFire ? `<button class="btn btn-primary" onclick="startPackGeneration('${c.id}')">Generate ${missing.length} missing ad${missing.length>1?'s':''}</button>` : ''}
          ${ps.running ? `<span style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent);">… ${ps.current} in flight (~5–7 min)</span>` : ''}
        </div>
        <p style="color:var(--text-2); margin:0 0 16px; font-size:14px">Click any card to see its generated ad, the reference used, and the ChatGPT prompt that produced it. ${!hasPhoto ? '<span style="color:var(--warn-text)">A10 Local Trust skipped — needs team/owner/van photo.</span>' : ''}</p>
        <div class="ad-grid">
          ${slots.map((s) => renderArchetypeSlot(s, c)).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderArchetypeSlot({ arch, ad, versionCount, generating, error }, client) {
  const cardClick = ad ? `onclick="openAdDetail('${ad.id}')"` : '';
  const cursor = ad ? 'cursor:pointer;' : 'cursor:default;';
  // Done state — shows the actual generated PNG.
  if (ad && ad.image_url) {
    return `
      <div class="ad-card" ${cardClick} style="${cursor}">
        <div class="ad-thumb-output" style="background-image:url('${ad.image_url}?t=${Date.now()}'); background-size:cover; background-position:center; aspect-ratio:1; padding:0;">
          <span style="position:absolute; top:6px; left:6px; background:rgba(0,0,0,0.65); color:#fff; font-family:JetBrains Mono,monospace; font-size:10px; padding:3px 7px; border-radius:3px;">${arch.code}</span>
          ${versionCount > 1 ? `<span style="position:absolute; top:6px; right:6px; background:var(--accent); color:#fff; font-family:JetBrains Mono,monospace; font-size:10px; padding:3px 7px; border-radius:3px; font-weight:600;" title="${versionCount} versions on file — click to flip between them">${versionCount} versions</span>` : ''}
        </div>
        <div class="ad-card-body">
          <div style="font-weight:600; font-size:13px; margin-bottom:3px">${htmlEscape(arch.name || '')}</div>
          <div class="ad-card-meta">${htmlEscape((ad.created || '').slice(0, 10))}${versionCount > 1 ? ' · current is v' + versionCount : ''}</div>
        </div>
      </div>
    `;
  }
  // Generating state — pulsing loader.
  if (generating) {
    return `
      <div class="ad-card" style="cursor:default; opacity:0.85;">
        <div class="ad-thumb-output" style="background:linear-gradient(135deg, var(--SP-bg), #e9d5ff); aspect-ratio:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;">
          <div style="font-family:JetBrains Mono,monospace; font-size:11px; color:var(--SP); animation:pulse 1.5s ease-in-out infinite;">… GENERATING</div>
          <div style="font-family:Fraunces,serif; font-size:18px; font-weight:600; color:var(--SP);">${arch.code}</div>
          <div style="font-size:10px; color:var(--SP); opacity:0.7;">~5–7 min</div>
        </div>
        <div class="ad-card-body">
          <div style="font-weight:600; font-size:13px; margin-bottom:3px">${htmlEscape(arch.name || '')}</div>
          <div class="ad-card-meta" style="color:var(--accent);">composing → rendering → upscaling…</div>
        </div>
      </div>
    `;
  }
  // Error state — shows the failure with retry option.
  if (error) {
    return `
      <div class="ad-card" style="cursor:default; border-color:#fecaca;">
        <div class="ad-thumb-output" style="background:#fee2e2; color:#b91c1c; aspect-ratio:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:14px;">
          <div style="font-family:JetBrains Mono,monospace; font-size:11px;">✗ FAILED</div>
          <div style="font-family:Fraunces,serif; font-size:18px; font-weight:600;">${arch.code}</div>
          <div style="font-size:10px; opacity:0.85; text-align:center; line-height:1.3;">${htmlEscape((error || '').slice(0, 60))}</div>
        </div>
        <div class="ad-card-body">
          <div style="font-weight:600; font-size:13px; margin-bottom:3px">${htmlEscape(arch.name || '')}</div>
          <button class="btn btn-sm" onclick="regenerateOneAd('${client.id}','${arch.code}')">Retry</button>
        </div>
      </div>
    `;
  }
  // Pending — not started yet.
  return `
    <div class="ad-card" style="cursor:default; opacity:0.65; border-style:dashed;">
      <div class="ad-thumb-output" style="background:var(--surface-2); aspect-ratio:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;">
        <div style="font-family:JetBrains Mono,monospace; font-size:10px; color:var(--text-3);">PENDING</div>
        <div style="font-family:Fraunces,serif; font-size:18px; font-weight:600; color:var(--text-3);">${arch.code}</div>
      </div>
      <div class="ad-card-body">
        <div style="font-weight:600; font-size:13px; margin-bottom:3px">${htmlEscape(arch.name || '')}</div>
        <div class="ad-card-meta">queued</div>
      </div>
    </div>
  `;
}

function setClientTab(tab) { currentClientTab = tab; currentClientId = null; render(); window.scrollTo(0,0); }
function openClient(id) { currentClientId = id; render(); window.scrollTo(0,0); }
function goToClientList() { currentClientId = null; currentClientTab = 'list'; render(); window.scrollTo(0,0); }

// ── Pack generation orchestrator (Layer 1 → Layer 2 → Layer 3) ─────────────
// Builds the manifest server-side, then fires /api/generate one ad at a time.
// State lives in PACK_STATE so navigation away/back doesn't lose progress.
async function startPackGeneration(clientId) {
  if (!PACK_STATE[clientId]) PACK_STATE[clientId] = { running: false, current: null, done: new Set(), errors: {} };
  const ps = PACK_STATE[clientId];
  if (ps.running) return;
  ps.running = true; ps.current = null; ps.errors = {};
  render();

  try {
    // Layer 1 — build the manifest. /api/packs decides which archetypes fire
    // (skips A10 if no team/owner/van photo, skips A6 if no promo, etc.) and
    // pre-picks variable inputs deterministically.
    const r = await fetch('/api/packs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || ('manifest HTTP ' + r.status));
    }
    const manifest = await r.json();

    // Skip entries that already have a saved ad for this client (idempotent —
    // safe to call multiple times; only generates what's missing).
    const existingAds = ADS.filter((a) => a.client_id === clientId);
    const existingArchetypes = new Set(existingAds.map((a) => a.archetype));
    const todo = manifest.entries.filter((e) => !existingArchetypes.has(e.archetype));

    for (const entry of todo) {
      ps.current = entry.archetype;
      render();
      try {
        const gr = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            archetype: entry.archetype,
            client_id: entry.client_id,
            picks: entry.picks,
            component_keys: entry.component_keys,
            attach_client_photos: entry.attach_client_photos || [],
            quality: entry.quality,
            n_candidates: entry.n_candidates,
          }),
        });
        if (!gr.ok) {
          const j = await gr.json().catch(() => ({}));
          throw new Error(j.error || ('generate HTTP ' + gr.status));
        }
        await gr.json();
        ps.done.add(entry.archetype);
        // Refresh ads list so the new card shows up.
        ADS = await api.ads.list();
      } catch (err) {
        ps.errors[entry.archetype] = err.message || 'generation failed';
        console.error('[pack]', entry.archetype, 'failed:', err);
      }
      render();
    }
  } catch (err) {
    alert('Pack generation failed to start: ' + err.message);
  } finally {
    ps.running = false;
    ps.current = null;
    render();
  }
}
window.startPackGeneration = startPackGeneration;

// Regenerate just one archetype for a given client (used by the modal's
// Regenerate button + the per-card Retry on errors).
async function regenerateOneAd(clientId, archetypeCode) {
  if (!PACK_STATE[clientId]) PACK_STATE[clientId] = { running: false, current: null, done: new Set(), errors: {} };
  const ps = PACK_STATE[clientId];
  if (ps.running) { alert('Pack is already generating — wait for it to finish.'); return; }

  // Build the manifest again to get the right picks/components for this archetype.
  ps.running = true; ps.current = archetypeCode; delete ps.errors[archetypeCode];
  render();
  try {
    const r = await fetch('/api/packs', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, archetype_filter: [archetypeCode] }),
    });
    const manifest = await r.json();
    const entry = manifest.entries.find((e) => e.archetype === archetypeCode);
    if (!entry) throw new Error('manifest had no entry for ' + archetypeCode);

    const gr = await fetch('/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        archetype: entry.archetype, client_id: entry.client_id,
        picks: entry.picks, component_keys: entry.component_keys,
        attach_client_photos: entry.attach_client_photos || [],
        quality: entry.quality, n_candidates: entry.n_candidates,
      }),
    });
    if (!gr.ok) { const j = await gr.json().catch(() => ({})); throw new Error(j.error || 'HTTP ' + gr.status); }
    await gr.json();
    ADS = await api.ads.list();
  } catch (err) {
    ps.errors[archetypeCode] = err.message;
  } finally {
    ps.running = false; ps.current = null; render();
  }
}
window.regenerateOneAd = regenerateOneAd;

// ------------------------------------------------------------
// SECTION 5: AD DATABASE
// ------------------------------------------------------------
let adFilters = {client: '', archetype: '', city: ''};

function renderAdDatabase() {
  let filtered = ADS;
  if (adFilters.client) filtered = filtered.filter(a => a.client_id === adFilters.client);
  if (adFilters.archetype) filtered = filtered.filter(a => a.archetype === adFilters.archetype);
  if (adFilters.city) filtered = filtered.filter(a => a.city === adFilters.city);

  return `
    <div class="page-header">
      <div class="page-eyebrow">Operations · Ad Database</div>
      <h1 class="page-title">Ad Database</h1>
      <p class="page-intro">Every ad ever generated. Same paired-card layout as client files — output + prompt + reference together. The source of truth Master AI uses for diversity checks when generating new ads.</p>
    </div>
    <div class="note-block">
      <div class="note-block-title">
        <svg class="note-block-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Diversity logic — geographic scope (note for later implementation)
      </div>
      <div>Diversity is scoped by geography, not per-client. Clients only operate within ~100km of their address, so identical ads can run for clients in non-overlapping service areas (e.g. same energy-bill ad for Brisbane + Perth + Sydney + Melbourne clients). When generating a new ad, Master AI should check past ads at this client's postcode + adjacent postcodes only, NOT globally. Reusing strong-performing ads across non-overlapping geographies is a feature, not a duplicate. Implementation deferred — for now Master AI just rotates variable inputs to keep variety high.</div>
    </div>
    <div class="ad-filters">
      <span class="ad-filter-label">Filter:</span>
      <select onchange="setAdFilter('client', this.value)">
        <option value="">All clients</option>
        ${CLIENTS.map(c => `<option value="${c.id}" ${adFilters.client===c.id?'selected':''}>${htmlEscape(c.business_name)}</option>`).join('')}
      </select>
      <select onchange="setAdFilter('archetype', this.value)">
        <option value="">All archetypes</option>
        ${STATE.archetypes.map(a => `<option value="${a.code}" ${adFilters.archetype===a.code?'selected':''}>${a.code} — ${htmlEscape(a.name)}</option>`).join('')}
      </select>
      <select onchange="setAdFilter('city', this.value)">
        <option value="">All cities</option>
        ${[...new Set(ADS.map(a => a.city))].map(c => `<option value="${c}" ${adFilters.city===c?'selected':''}>${c}</option>`).join('')}
      </select>
      <button class="btn btn-sm" onclick="clearAdFilters()">Clear filters</button>
      <span style="margin-left:auto; font-size:13px; color:var(--text-3);">${filtered.length} of ${ADS.length} ads</span>
    </div>
    <div class="ad-grid">
      ${filtered.map(a => {
        const client = CLIENTS.find(c => c.id === a.client_id);
        const arch = STATE.archetypes.find(x => x.code === a.archetype) || {};
        return `
          <div class="ad-card" onclick="openAdDetail('${a.id}')">
            <div class="ad-thumb-output">
              <div class="ph-icon">▢</div>
              <div class="ph-arch">${a.archetype}</div>
              <div class="ph-headline">${htmlEscape(a.headline.length > 56 ? a.headline.substring(0,56)+'...' : a.headline)}</div>
            </div>
            <div class="ad-card-body">
              <div style="font-weight:600; font-size:13px; margin-bottom:3px">${htmlEscape(arch.name||'')}</div>
              <div class="ad-card-meta">${client?htmlEscape(client.business_name):'?'} · ${htmlEscape(a.city)} · ${htmlEscape(a.created)}</div>
              <div class="ad-card-actions">
                <button class="btn btn-sm" onclick="event.stopPropagation(); openAdDetail('${a.id}')">View output, prompt &amp; reference</button>
              </div>
            </div>
          </div>
        `;
      }).join('') || '<div class="empty-state">No ads match these filters.</div>'}
    </div>
  `;
}
function setAdFilter(key, val) { adFilters[key] = val; render(); }
function clearAdFilters() { adFilters = {client: '', archetype: '', city: ''}; render(); }

// ------------------------------------------------------------
// SECTION 6: MASTER AI PROMPT
// ------------------------------------------------------------
function renderMasterPrompt() {
  return `
    <div class="page-header">
      <div class="page-eyebrow">AI Engine · Master AI Prompt</div>
      <h1 class="page-title">Master AI Prompt</h1>
      <p class="page-intro">The system prompt that directs Master AI (Claude) how to generate ChatGPT prompts. Read on every generation along with onboarding data, archetype config, global rules, and components. Edit this to change generation behaviour across all archetypes.</p>
    </div>

    <div class="section">
      <h2 class="section-h">Spend dashboard</h2>
      <div class="section-flow">→ live cost telemetry from <code>data/_cache/spend.jsonl</code> (FS) or <code>spend_log</code> table (Postgres)</div>
      <div id="spend-widget" style="background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:18px;">
        <span style="font-family:JetBrains Mono,monospace; font-size:11px; color:var(--text-3);">Loading…</span>
      </div>
    </div>

    <div class="section">
      <h2 class="section-h">How the system works</h2>
      <p class="section-intro">Visual reference for what plugs into the Master AI Prompt and what comes out the other end. Inputs converge into Master AI, which composes a ChatGPT prompt, which produces the final ad PNG, which is stored to the client file and the global ad database.</p>
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:24px; margin-bottom:24px;">
        ${buildWorkflowSVG()}
      </div>
    </div>

    <div class="section">
      <h2 class="section-h">Pipeline · what happens step-by-step when an ad pack is generated</h2>
      <p class="section-intro">Plain-English walkthrough of the runtime flow. The local admin tool stops at step 1 today — steps 2–6 are the tech-guy phase (Claude API + ChatGPT Image 2 wired in).</p>
      ${buildPipelineExplainer()}
    </div>

    <div class="section">
      <h2 class="section-h">Dependency map · what affects what (for testing)</h2>
      <p class="section-intro">Use this when you tweak something during testing and want to know what it'll touch. The "What you edit" column lists every place you can change something in this admin tool. The "Affects" column tells you what part of generation that change ripples into.</p>
      ${buildDependencyMap()}
    </div>

    <div class="note-block">
      <div class="note-block-title">
        <svg class="note-block-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Diversity instruction (geographic scope)
      </div>
      <div>The Master AI Prompt should instruct Claude to check the Ad Database for past prompts in this client's postcode and adjacent postcodes only — not globally. Clients in non-overlapping ~100km service areas can reuse the same strong-performing ad. Master AI rotates variable inputs to maintain variety within a single client's pack.</div>
    </div>
    <div style="display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="saveMasterPrompt()">Save changes</button>
      <button class="btn" onclick="revertMasterPrompt()">Revert to last saved</button>
      <button class="btn" onclick="syncArchetypePatterns()" title="Regenerate the ARCHETYPE PATTERNS section from the latest archetypes data. Loads into the editor for review — you still need to click Save to commit.">Sync archetype patterns ↻</button>
      <span id="mp-msg" style="font-size:12px; color:var(--text-3); align-self:center;"></span>
      <span style="margin-left:auto; font-size:12px; color:var(--text-3); align-self:center;">${MASTER_PROMPT.length.toLocaleString()} characters</span>
    </div>
    <div class="master-editor">
      <div class="master-editor-toolbar"><span>Master AI system prompt · editable</span><span>${(MASTER_PROMPT.length/1024).toFixed(1)} KB</span></div>
      <textarea class="master-editor-textarea" spellcheck="false">${htmlEscape(MASTER_PROMPT)}</textarea>
    </div>
  `;
}

// Plain-English pipeline explainer — sits BELOW the existing workflow SVG.
// Walks through the runtime flow when a real generation runs (mostly tech-guy phase).
function buildPipelineExplainer() {
  const steps = [
    {
      n: 1,
      title: 'Onboarding',
      where: 'Admin tool · Clients section',
      built: true,
      body: `Admin fills out the onboarding form for a new client. Submitting saves a client.json record under <code>data/clients/&lt;id&gt;.json</code> with all their data — service areas, brands installed, photos, family/Aus owned flags, install guarantee, current promo, Google review count.`,
    },
    {
      n: 2,
      title: 'Pack manifest (Layer 1)',
      where: 'Tech-guy phase · gating engine',
      built: false,
      body: `The system reads <code>archetypes.json</code> and decides which of the 10 archetypes will fire for this client. Per <strong>HR17</strong>: all archetypes always generate <em>except</em> A10 (which needs at least one of team/owner/van photo). A6 only fires if <code>current_promo_pct > 0</code>. Result: a list of typically 8–10 ads to generate for the pack.`,
    },
    {
      n: 3,
      title: 'Per-ad prompt composition (Layer 2 · Claude)',
      where: 'Tech-guy phase · Anthropic API',
      built: false,
      body: `For each ad in the manifest, one Claude API call is made. Each call sends:
      <ul style="margin:6px 0 0 18px; padding:0;">
        <li><strong>System prompt</strong> = this Master AI Prompt (cached across the pack — saves ~70% tokens after the first call)</li>
        <li><strong>User message</strong> = pack manifest + target ad's archetype/funnel + client context (incl. service areas, brands, family/aus owned, photos uploaded) + picked variables (headline / value stack / CTA / badge — randomly drawn from this archetype's variable_inputs pools) + price library data for the client's primary city + pack-context hints (what other ads are doing, so this one fills a gap)</li>
        <li><strong>Attached images</strong> = the archetype's reference ad + the locked components Claude is briefed to use for this generation + client photos (A10 only)</li>
      </ul>
      Claude reads everything visually (per JOB 1) and writes ONE complete ChatGPT-ready prompt. Returns it as plain text. Typical: 1–3 seconds per call.`,
    },
    {
      n: 4,
      title: 'Image generation (Layer 3 · ChatGPT Image 2)',
      where: 'Tech-guy phase · OpenAI API',
      built: false,
      body: `For each composed prompt from step 3, one ChatGPT Image 2 call is made with the same attached assets. Returns a 1080×1080 PNG (per HR10). Typical: 5–10 seconds per image. With 8–10 ads in a pack, the image step is the slow part — total pack time is usually 60–90 seconds.`,
    },
    {
      n: 5,
      title: 'Storage',
      where: 'Tech-guy phase · S3/R2 + DB',
      built: false,
      body: `Each final image + the prompt that produced it + the components attached + reference ad used + composition metadata are saved <strong>twice</strong> — once under the client's file (so you can see all this client's ads in one place) and once in the global Ad Database (so you can filter ads across all clients by archetype/city/date).`,
    },
    {
      n: 6,
      title: 'Review queue',
      where: 'Tech-guy phase · admin UI extension',
      built: false,
      body: `Generated ads land in a review queue, not auto-delivered. Admin opens each, reviews the output against the prompt + reference, approves or rejects. Approved ads release to the client. Rejected ads can be regenerated with a tweaked prompt or different picked variables.`,
    },
  ];
  const liveBadge = `<span style="display:inline-block; padding:2px 8px; border-radius:10px; background:var(--L3-bg); color:var(--L3); font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">LIVE</span>`;
  const futureBadge = `<span style="display:inline-block; padding:2px 8px; border-radius:10px; background:var(--L2-bg); color:var(--L2); font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">TECH-GUY PHASE</span>`;

  const stepCards = steps.map((s) => `
    <div style="display:grid; grid-template-columns:48px 1fr; gap:14px; padding:18px 20px; background:var(--surface); border:1px solid var(--border); border-radius:8px; margin-bottom:10px;">
      <div style="display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:50%; background:${s.built ? 'var(--L3-bg)' : 'var(--surface-2)'}; color:${s.built ? 'var(--L3)' : 'var(--text-3)'}; font-family:'Fraunces',serif; font-size:18px; font-weight:600;">${s.n}</div>
      <div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:4px;">
          <span style="font-family:'Fraunces',serif; font-size:17px; font-weight:600;">${htmlEscape(s.title)}</span>
          ${s.built ? liveBadge : futureBadge}
          <span style="font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-3);">· ${htmlEscape(s.where)}</span>
        </div>
        <div style="color:var(--text-2); font-size:13.5px; line-height:1.55;">${s.body}</div>
      </div>
    </div>
  `).join('');

  const loadingNote = `
    <div style="background:var(--accent-bg); border:1px solid var(--accent); border-radius:8px; padding:14px 18px; margin-top:10px; font-size:13px; line-height:1.55;">
      <strong style="color:var(--accent); font-family:'JetBrains Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.06em;">UI loading state (when Layer 2/3 are wired):</strong><br>
      You'll see all the ads in the pack listed with status pills — "Composing prompt" → "Rendering image" → "Done" — updating in real time as each call returns. Layer 2 (Claude) calls run in parallel for all ads in the pack. Layer 3 (ChatGPT Image 2) calls usually run serially or with low concurrency due to API rate limits, so the slow visual is the image-rendering stage.
    </div>
  `;

  return stepCards + loadingNote;
}

// Dependency map — table showing what-affects-what.
function buildDependencyMap() {
  const rows = [
    {
      what: 'Master AI Prompt',
      where: 'AI Engine · Master AI Prompt',
      affects: 'ALL future generations of ALL archetypes for ALL clients. Highest blast radius — change with care.',
    },
    {
      what: 'Archetype rule (in any of A1–A10)',
      where: 'Archetypes · click an archetype · rules section',
      affects: 'Only THAT archetype\'s ads. Promoted into the master prompt\'s ARCHETYPE PATTERNS section via the Sync button.',
    },
    {
      what: 'Archetype variable_input pool (Headlines / CTAs / Badges / etc.)',
      where: 'Archetypes · click an archetype · variable inputs',
      affects: 'Only THAT archetype\'s ads. Increases or decreases copy variety. Master AI picks fresh from the pool per generation.',
    },
    {
      what: 'Archetype reference ad image',
      where: 'Archetypes · click an archetype · reference ad section',
      affects: 'Only THAT archetype\'s ads. The reference is attached as IMAGE 1 to every generation as the style template.',
    },
    {
      what: 'Archetype gold standard (prompt or output image)',
      where: 'Archetypes · click an archetype · gold standard section',
      affects: 'Master AI calibration for THAT archetype. Few-shot example in the system prompt — sets the quality bar Claude tries to match.',
    },
    {
      what: 'Component description (text)',
      where: 'Components · click any component card · Edit',
      affects: 'EVERY archetype that has this component in its <code>usedBy[]</code> array. Description is what Master AI reads to decide whether to attach this component.',
    },
    {
      what: 'Component image (replace)',
      where: 'Components · click any component card · Edit · upload',
      affects: 'EVERY archetype that uses this component. The new image is what gets composited into the final ad.',
    },
    {
      what: 'Component <code>usedBy[]</code> (which archetypes can access)',
      where: 'Archetypes · click an archetype · component picker',
      affects: 'Adds/removes this component from THAT archetype\'s accessible pool. Bigger pool = more diversity for that archetype.',
    },
    {
      what: 'Global rule (HR1–HR19)',
      where: 'Global Rules · edit any rule',
      affects: 'EVERY generation system-wide. Master AI inlines these into every composed prompt.',
    },
    {
      what: 'Price library entry (per-city)',
      where: 'Prices · edit a city',
      affects: 'A4/A8 fixed-price ads + A1/A5/A7 per-week ads for clients whose primary service area matches that city.',
    },
    {
      what: 'Onboarding form structure',
      where: 'Clients · + New client (form layout)',
      affects: 'What client data is captured for ALL future clients. Adding a field = new piece of context Master AI sees in CLIENT CONTEXT.',
    },
    {
      what: 'Client onboarding data (per-client)',
      where: 'Clients · click client · Edit details',
      affects: 'ALL ads in THAT client\'s pack. Changing primary city changes price-library lookup and {{city}} substitution everywhere.',
    },
    {
      what: 'Client photo upload (team / owner / van)',
      where: 'Clients · onboarding form · photo fields',
      affects: 'Whether A10 Local Trust ad fires for THAT client. A10 needs at least one of team/owner/van photo per current gating logic.',
    },
    {
      what: 'Client family_owned / australian_owned',
      where: 'Clients · onboarding form · trust signals · Edit details',
      affects: 'Whether the conditional family/Australian Owned trust badges appear on THAT client\'s ads (per HR19). Both AI-generated at render time using the badges as style references.',
    },
  ];

  const tableHTML = `
    <table style="width:100%; background:var(--surface); border:1px solid var(--border); border-radius:8px; border-collapse:separate; border-spacing:0; overflow:hidden; font-size:13.5px; line-height:1.55;">
      <thead>
        <tr>
          <th style="text-align:left; padding:12px 16px; background:var(--surface-2); font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-3); border-bottom:1px solid var(--border); font-weight:600; width:30%;">What you edit</th>
          <th style="text-align:left; padding:12px 16px; background:var(--surface-2); font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-3); border-bottom:1px solid var(--border); font-weight:600; width:25%;">Where</th>
          <th style="text-align:left; padding:12px 16px; background:var(--surface-2); font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-3); border-bottom:1px solid var(--border); font-weight:600; width:45%;">Affects</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r, i) => `
          <tr>
            <td style="padding:14px 16px; border-bottom:${i === rows.length-1 ? 'none' : '1px solid var(--surface-2)'}; vertical-align:top;"><strong>${r.what}</strong></td>
            <td style="padding:14px 16px; border-bottom:${i === rows.length-1 ? 'none' : '1px solid var(--surface-2)'}; vertical-align:top; color:var(--text-3); font-family:'JetBrains Mono',monospace; font-size:11.5px;">${r.where}</td>
            <td style="padding:14px 16px; border-bottom:${i === rows.length-1 ? 'none' : '1px solid var(--surface-2)'}; vertical-align:top; color:var(--text-2);">${r.affects}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // Dependency tree (input composition view) — shows how data assembles per generation
  const treeHTML = `
    <div style="margin-top:24px; background:var(--code-bg); color:var(--code-fg); border-radius:8px; padding:24px; font-family:'JetBrains Mono',monospace; font-size:12.5px; line-height:1.7; overflow-x:auto;">
      <div style="color:#fbbf24; margin-bottom:14px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em;">// Tree view — how a single ad's brief is composed at generation time</div>
<pre style="margin:0; color:#d8d8d2; white-space:pre; font-family:inherit;">PER-AD BRIEF (one Claude call, one ChatGPT call)
├── <span style="color:#86efac">system prompt</span>            <span style="color:#8a857c">// cached across all ads in pack</span>
│   ├── master AI prompt        <span style="color:#8a857c">(data/master-prompt.md)</span>
│   ├── archetype patterns      <span style="color:#8a857c">(synced from data/archetypes.json)</span>
│   └── 19 global rules         <span style="color:#8a857c">(data/global-rules.json)</span>
│
├── <span style="color:#93c5fd">user message</span>             <span style="color:#8a857c">// fresh per ad</span>
│   ├── pack manifest           <span style="color:#8a857c">(other ads firing this round, for diversity)</span>
│   ├── target archetype        <span style="color:#8a857c">(A1/A2/.../A10)</span>
│   ├── target funnel-stage     <span style="color:#8a857c">(Cold/Warm | Warm/Hot | Hot)</span>
│   ├── client context
│   │   ├── business name       <span style="color:#8a857c">(client.json)</span>
│   │   ├── primary service area  <span style="color:#8a857c">(→ {{city}}, {{postcode}})</span>
│   │   ├── additional service areas
│   │   ├── brands installed    <span style="color:#8a857c">(filters which logo_* + cond_* are eligible)</span>
│   │   ├── google_review_count <span style="color:#8a857c">(gates Google badge per HR08)</span>
│   │   ├── family_owned / australian_owned <span style="color:#8a857c">(gates trust badges per HR19)</span>
│   │   ├── install_guarantee_days
│   │   ├── current_promo_pct   <span style="color:#8a857c">(gates A6 + discount badges per HR09)</span>
│   │   └── photos uploaded     <span style="color:#8a857c">(team / owner / van — gates A10 firing)</span>
│   ├── picked variables        <span style="color:#8a857c">(randomly drawn from archetype's variable_inputs pools)</span>
│   │   ├── headline
│   │   ├── value stack
│   │   ├── CTA
│   │   └── badge
│   └── price library data      <span style="color:#8a857c">(data/prices.json — looked up by primary city)</span>
│       ├── per-week
│       ├── fixed
│       ├── anchor
│       └── rebate
│
└── <span style="color:#fbbf24">attached images</span>          <span style="color:#8a857c">// multipart on each call</span>
    ├── reference ad            <span style="color:#8a857c">(assets/reference-ads/&lt;archetype&gt;/reference.png)</span>
    ├── locked components       <span style="color:#8a857c">(picked from archetype's accessible pool)</span>
    │   └── 1–4 component images
    ├── client photos           <span style="color:#8a857c">(A10 only, from assets/client-uploads/&lt;client_id&gt;/)</span>
    └── gold standard output    <span style="color:#8a857c">(optional, if uploaded — for Master AI calibration)</span></pre>
    </div>
  `;

  return tableHTML + treeHTML;
}

function buildWorkflowSVG() {
  // Three clearly-labeled bands: [1] STORED IN ADMIN TOOL, [2] CLAUDE composes, [3] CHATGPT IMAGE 2 renders
  return `
<svg viewBox="0 0 920 970" xmlns="http://www.w3.org/2000/svg" style="width:100%; max-width:920px; display:block; margin:0 auto;">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#8a857c"/>
    </marker>
    <marker id="arr-strong" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#b8420a"/>
    </marker>
  </defs>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- BAND 1 — STORED IN THIS ADMIN TOOL                                      -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <rect x="0" y="0" width="920" height="240" fill="#f9f7f2" stroke="none"/>

  <text x="20" y="28" font-family="JetBrains Mono, monospace" font-size="11" fill="#4a4640" font-weight="700" letter-spacing="0.1em">[ 1 ]  STORED IN THIS ADMIN TOOL</text>
  <text x="20" y="48" font-family="Fraunces, serif" font-size="15" fill="#1a1814" font-weight="600">Configuration data — all inputs are stored and editable here</text>
  <text x="20" y="66" font-family="IBM Plex Sans, sans-serif" font-size="12" fill="#4a4640" font-style="italic">Live in the Archetypes / Global Rules / Components / Clients / Ad Database sections of this admin tool</text>

  <!-- 5 input boxes: x=20, 200, 380, 560, 740 · all w=160, gap=20 · centers at 100, 280, 460, 640, 820 -->
  <g>
    <rect x="20" y="90" width="160" height="92" rx="6" fill="#ecfdf5" stroke="#059669" stroke-width="1.5"/>
    <text x="100" y="110" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#059669" font-weight="700" letter-spacing="0.06em">CLIENT FILE</text>
    <text x="100" y="134" text-anchor="middle" font-family="Fraunces, serif" font-size="14" font-weight="600" fill="#1a1814">Onboarding data</text>
    <text x="100" y="152" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#4a4640">city · postcode · brands</text>
    <text x="100" y="166" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#4a4640">photos · pricing · reviews</text>
  </g>

  <g>
    <rect x="200" y="90" width="160" height="92" rx="6" fill="#fdf2f8" stroke="#db2777" stroke-width="1.5"/>
    <text x="280" y="110" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#db2777" font-weight="700" letter-spacing="0.06em">GLOBAL RULES</text>
    <text x="280" y="134" text-anchor="middle" font-family="Fraunces, serif" font-size="14" font-weight="600" fill="#1a1814">17 hard rules</text>
    <text x="280" y="152" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#4a4640">no 0% interest · safe zone</text>
    <text x="280" y="166" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#4a4640">brand caps · clarity rule</text>
  </g>

  <g>
    <rect x="380" y="90" width="160" height="92" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text x="460" y="110" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#d97706" font-weight="700" letter-spacing="0.06em">ARCHETYPE CONFIG</text>
    <text x="460" y="134" text-anchor="middle" font-family="Fraunces, serif" font-size="14" font-weight="600" fill="#1a1814">Per-archetype DNA</text>
    <text x="460" y="152" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#4a4640">reference · rules · pools</text>
    <text x="460" y="166" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#4a4640">funnel · gold standard</text>
  </g>

  <g>
    <rect x="560" y="90" width="160" height="92" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text x="640" y="110" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#d97706" font-weight="700" letter-spacing="0.06em">COMPONENTS</text>
    <text x="640" y="134" text-anchor="middle" font-family="Fraunces, serif" font-size="14" font-weight="600" fill="#1a1814">Image library</text>
    <text x="640" y="152" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#4a4640">condensers · diagrams</text>
    <text x="640" y="166" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#4a4640">brand logos · stock photos</text>
  </g>

  <g>
    <rect x="740" y="90" width="160" height="92" rx="6" fill="#f3e8ff" stroke="#7c3aed" stroke-width="1.5"/>
    <text x="820" y="110" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#7c3aed" font-weight="700" letter-spacing="0.06em">AD DATABASE</text>
    <text x="820" y="134" text-anchor="middle" font-family="Fraunces, serif" font-size="14" font-weight="600" fill="#1a1814">Past ads (diversity)</text>
    <text x="820" y="152" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#4a4640">checks past prompts at</text>
    <text x="820" y="166" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#4a4640">postcode + adjacent</text>
  </g>

  <!-- Convergence arrows from new input centers -->
  <path d="M 100 182 L 100 210 L 460 210 L 460 240" stroke="#8a857c" stroke-width="1.5" fill="none"/>
  <path d="M 280 182 L 280 218 L 460 218 L 460 240" stroke="#8a857c" stroke-width="1.5" fill="none"/>
  <path d="M 460 182 L 460 240" stroke="#8a857c" stroke-width="1.5" fill="none"/>
  <path d="M 640 182 L 640 218 L 460 218 L 460 240" stroke="#8a857c" stroke-width="1.5" fill="none"/>
  <path d="M 820 182 L 820 210 L 460 210 L 460 240" stroke="#8a857c" stroke-width="1.5" fill="none"/>

  <!-- Down arrow into band 2 -->
  <path d="M 460 240 L 460 280" stroke="#8a857c" stroke-width="2" fill="none" marker-end="url(#arr)"/>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- BAND 2 — CLAUDE composes the ChatGPT prompt                             -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <rect x="0" y="290" width="920" height="295" fill="#fef9f3" stroke="none"/>

  <text x="20" y="318" font-family="JetBrains Mono, monospace" font-size="11" fill="#b8420a" font-weight="700" letter-spacing="0.1em">[ 2 ]  CLAUDE (MASTER AI) — composes the ChatGPT prompt</text>
  <text x="20" y="338" font-family="Fraunces, serif" font-size="15" fill="#1a1814" font-weight="600">This is where Claude does the work. Reads everything above, picks from variable input pools, composes one prompt per archetype.</text>
  <text x="20" y="356" font-family="IBM Plex Sans, sans-serif" font-size="12" fill="#4a4640" font-style="italic">Behaviour controlled by the editable Master AI Prompt below this diagram.</text>

  <!-- Claude main box — wider, balanced columns -->
  <g>
    <rect x="20" y="380" width="880" height="185" rx="8" fill="#fdf3ec" stroke="#b8420a" stroke-width="2.5"/>

    <!-- Claude header -->
    <text x="40" y="408" font-family="JetBrains Mono, monospace" font-size="10" fill="#b8420a" font-weight="700" letter-spacing="0.08em">★  CLAUDE</text>
    <text x="40" y="430" font-family="Fraunces, serif" font-size="17" font-weight="600" fill="#1a1814">Composes the ChatGPT prompt for each archetype that fires</text>

    <!-- Horizontal divider inside Claude -->
    <line x1="40" y1="445" x2="880" y2="445" stroke="#e6e2da" stroke-width="1"/>

    <!-- Vertical divider — at true center x=460 -->
    <line x1="460" y1="455" x2="460" y2="555" stroke="#e6e2da" stroke-width="1"/>

    <!-- LEFT COLUMN: A1-A9 standard path -->
    <g>
      <text x="40" y="465" font-family="JetBrains Mono, monospace" font-size="10" fill="#4a4640" font-weight="700" letter-spacing="0.06em">FOR 9 OF 10 ARCHETYPES (A1–A9)</text>
      <text x="40" y="487" font-family="IBM Plex Sans, sans-serif" font-size="13" fill="#1a1814">Reads inputs · picks from pools · applies rules</text>
      <text x="40" y="507" font-family="IBM Plex Sans, sans-serif" font-size="13" fill="#4a4640" font-style="italic">→ Composes the prompt deterministically</text>
      <text x="40" y="528" font-family="JetBrains Mono, monospace" font-size="10" fill="#8a857c">Reference image attached as IMAGE 1,</text>
      <text x="40" y="544" font-family="JetBrains Mono, monospace" font-size="10" fill="#8a857c">components attached as IMAGE 2/3...</text>
    </g>

    <!-- RIGHT COLUMN: A10 vision path -->
    <g>
      <text x="480" y="465" font-family="JetBrains Mono, monospace" font-size="10" fill="#7c3aed" font-weight="700" letter-spacing="0.06em">FOR A10 (LOCAL TRUST) — uses VISION</text>
      <text x="480" y="487" font-family="IBM Plex Sans, sans-serif" font-size="13" fill="#1a1814">Same as left, PLUS Claude uses vision</text>
      <text x="480" y="507" font-family="IBM Plex Sans, sans-serif" font-size="13" fill="#1a1814">to look at the uploaded team/trust photos</text>
      <text x="480" y="528" font-family="JetBrains Mono, monospace" font-size="10" fill="#7c3aed">→ Derives palette + composition</text>
      <text x="480" y="544" font-family="JetBrains Mono, monospace" font-size="10" fill="#7c3aed">from the photo before composing</text>
    </g>
  </g>

  <!-- Arrow from Claude band down into the chatgpt band -->
  <path d="M 460 565 L 460 625" stroke="#b8420a" stroke-width="2.5" fill="none" marker-end="url(#arr-strong)"/>
  <text x="475" y="600" font-family="JetBrains Mono, monospace" font-size="10" fill="#b8420a" font-weight="600">EMITS: prompt + reference ad + components + client photos</text>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- BAND 3 — CHATGPT IMAGE 2 renders the ad                                 -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <rect x="0" y="635" width="920" height="335" fill="#f5fbf8" stroke="none"/>

  <text x="20" y="663" font-family="JetBrains Mono, monospace" font-size="11" fill="#059669" font-weight="700" letter-spacing="0.1em">[ 3 ]  CHATGPT IMAGE 2 — renders the ad</text>
  <text x="20" y="683" font-family="Fraunces, serif" font-size="15" fill="#1a1814" font-weight="600">Receives the bundle from Claude and generates the final 1080×1080 PNG.</text>
  <text x="20" y="701" font-family="IBM Plex Sans, sans-serif" font-size="12" fill="#4a4640" font-style="italic">No further AI reasoning happens here — pure image generation from prompt + attached images.</text>

  <!-- ChatGPT Image 2 box -->
  <g>
    <rect x="280" y="725" width="360" height="76" rx="6" fill="#ecfdf5" stroke="#059669" stroke-width="2"/>
    <text x="460" y="747" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#059669" font-weight="700" letter-spacing="0.08em">CHATGPT IMAGE 2</text>
    <text x="460" y="771" text-anchor="middle" font-family="Fraunces, serif" font-size="16" font-weight="600" fill="#1a1814">Generates the ad image</text>
    <text x="460" y="791" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#4a4640">renders 1080×1080 PNG from prompt + attached images</text>
  </g>

  <!-- Arrow ChatGPT -> Final PNG -->
  <path d="M 460 801 L 460 833" stroke="#8a857c" stroke-width="1.5" fill="none" marker-end="url(#arr)"/>

  <!-- Final PNG -->
  <g>
    <rect x="370" y="837" width="180" height="58" rx="6" fill="#1a1814" stroke="#1a1814" stroke-width="1.5"/>
    <text x="460" y="861" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#fbbf24" font-weight="700" letter-spacing="0.06em">OUTPUT</text>
    <text x="460" y="883" text-anchor="middle" font-family="Fraunces, serif" font-size="15" font-weight="600" fill="white">Final ad PNG</text>
  </g>

  <!-- Storage split arrows -->
  <path d="M 410 895 L 280 925" stroke="#8a857c" stroke-width="1.5" fill="none" marker-end="url(#arr)"/>
  <path d="M 510 895 L 640 925" stroke="#8a857c" stroke-width="1.5" fill="none" marker-end="url(#arr)"/>

  <!-- Storage destinations -->
  <g>
    <rect x="160" y="921" width="240" height="32" rx="6" fill="#ecfdf5" stroke="#059669" stroke-width="1.5"/>
    <text x="280" y="942" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#059669" font-weight="600">→ saved to CLIENT FILE</text>
  </g>

  <g>
    <rect x="520" y="921" width="240" height="32" rx="6" fill="#f3e8ff" stroke="#7c3aed" stroke-width="1.5"/>
    <text x="640" y="942" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#7c3aed" font-weight="600">→ saved to AD DATABASE</text>
  </g>
</svg>
  `;
}

// ------------------------------------------------------------
// MAIN RENDER + NAV
// ------------------------------------------------------------
function setActiveNav(section) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.section === section));
}
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => {
    currentSection = el.dataset.section;
    currentArchIdx = null;
    currentClientId = null;
    setActiveNav(currentSection);
    render();
    window.scrollTo(0, 0);
  });
});

function goBack() {
  if (currentSection === 'archetypes' && currentArchIdx !== null) { currentArchIdx = null; render(); window.scrollTo(0,0); }
  else if (currentSection === 'clients' && currentClientId !== null) { currentClientId = null; render(); window.scrollTo(0,0); }
}

function render() {
  const main = document.getElementById('main-content');
  if (currentSection === 'archetypes') {
    if (currentArchIdx === null) {
      main.innerHTML = renderArchetypesList();
      document.querySelectorAll('.arch-list-item').forEach(el => {
        el.addEventListener('click', () => { currentArchIdx = parseInt(el.dataset.archIdx); render(); window.scrollTo(0,0); });
      });
    } else {
      main.innerHTML = renderArchetypeDetail(currentArchIdx);
      ['pp-city','pp-headline','pp-value','pp-cta','pp-badge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', rebuildPrompt);
      });
      rebuildPrompt();
    }
  } else if (currentSection === 'globalrules') main.innerHTML = renderGlobalRules();
  else if (currentSection === 'components') main.innerHTML = renderComponents();
  else if (currentSection === 'clients') main.innerHTML = renderClients();
  else if (currentSection === 'masterprompt') { main.innerHTML = renderMasterPrompt(); loadSpendWidget(); }
}

async function loadSpendWidget() {
  const el = document.getElementById('spend-widget');
  if (!el) return;
  try {
    const r = await fetch('/api/spend');
    const s = await r.json();
    el.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:14px;">
        ${[['Last 24h', s.last_24h], ['Last 7d', s.last_7d], ['Last 30d', s.last_30d]].map(([label, d]) => `
          <div>
            <div style="font-family:JetBrains Mono,monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:4px;">${label}</div>
            <div style="font-family:Fraunces,serif; font-size:24px; font-weight:600;">$${(d.usd||0).toFixed(2)}</div>
            <div style="font-family:JetBrains Mono,monospace; font-size:11px; color:var(--text-3);">${d.calls||0} API calls</div>
          </div>
        `).join('')}
        <div>
          <div style="font-family:JetBrains Mono,monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:4px;">Total ads</div>
          <div style="font-family:Fraunces,serif; font-size:24px; font-weight:600;">${s.total_ads || 0}</div>
          <div style="font-family:JetBrains Mono,monospace; font-size:11px; color:var(--text-3);">${s.total_calls_logged || 0} log entries</div>
        </div>
      </div>
      ${Object.keys(s.by_archetype_7d||{}).length ? `
      <div style="margin-top:14px; padding-top:14px; border-top:1px solid var(--surface-2);">
        <div style="font-family:JetBrains Mono,monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:6px;">7-day spend by archetype</div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap:8px; font-size:12px;">
          ${Object.entries(s.by_archetype_7d).sort((a,b)=>b[1]-a[1]).map(([a,v]) => `
            <div style="background:var(--surface-2); padding:6px 10px; border-radius:4px;"><strong>${a}</strong> · $${v.toFixed(2)}</div>
          `).join('')}
        </div>
      </div>` : ''}
    `;
  } catch (e) {
    el.innerHTML = '<span style="color:var(--text-3); font-style:italic;">Couldn\'t load spend.</span>';
  }
}

// Expose globals for inline handlers
window.closeModal = closeModal;
window.goBack = goBack;
window.openClient = openClient;
window.goToClientList = goToClientList;
window.setClientTab = setClientTab;
window.setComponentCat = setComponentCat;
window.setAdFilter = setAdFilter;
window.clearAdFilters = clearAdFilters;
window.openAdDetail = openAdDetail;
window.addArchRule = addArchRule;
window.editArchRule = editArchRule;
window.deleteArchRule = deleteArchRule;
window.addToPool = addToPool;
window.editPoolItem = editPoolItem;
window.deletePoolItem = deletePoolItem;
window.toggleComponentForArch = toggleComponentForArch;
window.replaceReferenceImage = replaceReferenceImage;
window.addGlobalRule = addGlobalRule;
window.editGlobalRule = editGlobalRule;
window.deleteGlobalRule = deleteGlobalRule;
window.addComponent = addComponent;
window.editComponent = editComponent;
window.deleteComponent = deleteComponent;


// ============================================================
// MUTATION OVERRIDES — these replace the earlier in-memory-only versions
// (later function declarations win in non-strict mode).
// ============================================================

// ---- Archetypes: rules + variable_inputs pools + reference image + components

async function patchArchetype(code, patch) {
  await api.archetypes.patch(code, patch);
  await refreshArchetypes();
  render();
}

function addArchRule(code) {
  showEditModal({
    title: 'Add archetype rule', subtitle: code, value: '', multiline: true,
    onSave: (val) => {
      const v = val.trim(); if (!v) return;
      const arch = STATE.archetypes.find(a => a.code === code);
      const rules = [...(arch.rules || []), v];
      patchArchetype(code, { rules }).catch(reportError);
    },
  });
}
function editArchRule(code, i) {
  const arch = STATE.archetypes.find(a => a.code === code);
  showEditModal({
    title: 'Edit archetype rule', subtitle: code + ' — rule ' + (i + 1),
    value: arch.rules[i], multiline: true,
    onSave: (val) => {
      const rules = [...arch.rules]; rules[i] = val.trim();
      patchArchetype(code, { rules }).catch(reportError);
    },
  });
}
function deleteArchRule(code, i) {
  const arch = STATE.archetypes.find(a => a.code === code);
  confirmDelete(arch.rules[i].substring(0, 80), () => {
    const rules = arch.rules.filter((_, j) => j !== i);
    patchArchetype(code, { rules }).catch(reportError);
  });
}

function addToPool(code, poolKey) {
  showEditModal({
    title: 'Add to ' + poolKey, subtitle: code, value: '', multiline: true,
    onSave: (val) => {
      const v = val.trim(); if (!v) return;
      const arch = STATE.archetypes.find(a => a.code === code);
      const pool = [...((arch.variable_inputs || {})[poolKey] || []), v];
      const variable_inputs = { ...(arch.variable_inputs || {}), [poolKey]: pool };
      patchArchetype(code, { variable_inputs }).catch(reportError);
    },
  });
}
function editPoolItem(code, poolKey, i) {
  const arch = STATE.archetypes.find(a => a.code === code);
  showEditModal({
    title: 'Edit ' + poolKey + ' item', subtitle: code + ' — item ' + (i + 1),
    value: arch.variable_inputs[poolKey][i], multiline: true,
    onSave: (val) => {
      const pool = [...arch.variable_inputs[poolKey]]; pool[i] = val.trim();
      const variable_inputs = { ...arch.variable_inputs, [poolKey]: pool };
      patchArchetype(code, { variable_inputs }).catch(reportError);
    },
  });
}
function deletePoolItem(code, poolKey, i) {
  const arch = STATE.archetypes.find(a => a.code === code);
  confirmDelete(arch.variable_inputs[poolKey][i].substring(0, 80), () => {
    const pool = arch.variable_inputs[poolKey].filter((_, j) => j !== i);
    const variable_inputs = { ...arch.variable_inputs, [poolKey]: pool };
    patchArchetype(code, { variable_inputs }).catch(reportError);
  });
}

function toggleComponentForArch(componentKey, archCode) {
  const c = STATE.components.find(x => x.key === componentKey);
  if (!c) return;
  const usedBy = (c.usedBy || []).slice();
  const idx = usedBy.indexOf(archCode);
  if (idx >= 0) usedBy.splice(idx, 1); else usedBy.push(archCode);
  // Optimistic local update so the UI feels snappy.
  c.usedBy = usedBy; render();
  api.components.patchJSON(componentKey, { usedBy })
    .then(refreshComponents).then(render).catch(reportError);
}

function replaceReferenceImage(archCode) {
  const arch = STATE.archetypes.find(a => a.code === archCode);
  showModal(`
    <div class="modal-header">
      <div>
        <h3 class="modal-title">Replace reference image</h3>
        <div class="modal-subtitle">${htmlEscape(arch.code + ' · ' + arch.name)}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <p style="margin:0 0 14px;">Upload a new reference image. Saves to <code>assets/reference-ads/${ARCH_REF_SLUG[arch.code]}/reference.png</code> on disk.</p>
      <input id="ref-file" type="file" accept="image/*" style="padding:8px; border:1px dashed var(--border-2); background:var(--surface-2); cursor:pointer; width:100%;">
      <div id="ref-preview" style="margin-top:12px;"></div>
      <div id="ref-msg" style="margin-top:10px; color:var(--text-3); font-size:12px;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="ref-save">Upload reference</button>
    </div>
  `);
  const input = document.getElementById('ref-file');
  input.addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      document.getElementById('ref-preview').innerHTML =
        '<img src="' + ev.target.result + '" style="max-width:200px; border:1px solid var(--border); border-radius:4px;">';
    };
    r.readAsDataURL(f);
  });
  document.getElementById('ref-save').addEventListener('click', async () => {
    const f = input.files[0];
    if (!f) { document.getElementById('ref-msg').textContent = 'Pick an image first.'; return; }
    document.getElementById('ref-msg').textContent = 'Uploading…';
    const fd = new FormData(); fd.append('image', f);
    try {
      await api.archetypes.reference(arch.code, fd);
      closeModal();
      // Force <img> reloads by busting the cache key.
      rebuildRefThumbs();
      const url = refUrlForCode(arch.code);
      if (url) REF_THUMBS[arch.exemplar] = url + '?t=' + Date.now();
      render();
    } catch (err) { reportError(err); }
  });
}

// ---- Global rules

function addGlobalRule() {
  showEditModal({
    title: 'Add new global rule', subtitle: 'Applies to all archetypes',
    value: '', multiline: true,
    onSave: (val) => {
      const v = val.trim(); if (!v) return;
      api.globalRules.create(v).then(refreshGlobalRules).then(render).catch(reportError);
    },
  });
}
function editGlobalRule(i) {
  const r = STATE.globalRules[i];
  showEditModal({
    title: 'Edit global rule', subtitle: ruleLabel(r),
    value: r.rule, multiline: true,
    onSave: (val) => {
      api.globalRules.patch(r.id, val.trim()).then(refreshGlobalRules).then(render).catch(reportError);
    },
  });
}
function deleteGlobalRule(i) {
  const r = STATE.globalRules[i];
  confirmDelete(ruleLabel(r) + ' — ' + r.rule.substring(0, 80), () => {
    api.globalRules.remove(r.id).then(refreshGlobalRules).then(render).catch(reportError);
  });
}

// ---- Components

function addComponent() {
  const cats = [...new Set(STATE.components.map(c => c.category))].sort();
  showModal(`
    <div class="modal-header">
      <div><h3 class="modal-title">Upload new component</h3><div class="modal-subtitle">Add to global library</div></div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-row"><label>Category</label><select id="cmp-cat">${cats.map(c=>`<option ${c===currentComponentCat?'selected':''}>${htmlEscape(c)}</option>`).join('')}</select></div>
      <div class="form-row"><label>Component key (id)</label><input id="cmp-key" type="text" placeholder="e.g. cond_panasonic"></div>
      <div class="form-row"><label>Description</label><textarea id="cmp-desc" placeholder="Brief description"></textarea></div>
      <div class="form-row">
        <label>Image upload</label>
        <input id="cmp-img-file" type="file" accept="image/*" style="padding:8px; border:1px dashed var(--border-2); background:var(--surface-2); cursor:pointer; width:100%;">
        <div id="cmp-img-preview" style="margin-top:10px;"></div>
        <div class="help-text">Saved to assets/components/&lt;category&gt;/&lt;key&gt;.&lt;ext&gt;.</div>
      </div>
      <div id="cmp-msg" style="margin-top:8px; color:var(--text-3); font-size:12px;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="cmp-save">Save component</button>
    </div>
  `);
  const fileInput = document.getElementById('cmp-img-file');
  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      document.getElementById('cmp-img-preview').innerHTML =
        '<img src="' + ev.target.result + '" style="max-width:140px; max-height:140px; border:1px solid var(--border); border-radius:4px;">';
    };
    r.readAsDataURL(f);
  });
  document.getElementById('cmp-save').addEventListener('click', async () => {
    const cat = document.getElementById('cmp-cat').value;
    const key = document.getElementById('cmp-key').value.trim();
    const desc = document.getElementById('cmp-desc').value.trim();
    if (!key) { document.getElementById('cmp-msg').textContent = 'Key required.'; return; }
    const fd = new FormData();
    fd.append('category', cat); fd.append('key', key);
    fd.append('description', desc); fd.append('type', 'image');
    fd.append('usedBy', '[]');
    if (fileInput.files[0]) fd.append('image', fileInput.files[0]);
    try {
      await api.components.create(fd);
      await refreshComponents();
      closeModal(); render();
    } catch (err) { reportError(err); }
  });
}

function editComponent(i) {
  const c = STATE.components[i];
  showModal(`
    <div class="modal-header">
      <div><h3 class="modal-title">Edit component</h3><div class="modal-subtitle">${htmlEscape(c.key)}</div></div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-row"><label>Component key</label><input id="cmp-key" type="text" value="${htmlEscape(c.key).replace(/"/g,'&quot;')}"></div>
      <div class="form-row"><label>Description</label><textarea id="cmp-desc">${htmlEscape(c.description || '')}</textarea></div>
      <div class="form-row">
        <label>Image</label>
        ${c.uploadedImage ? '<div style="margin-bottom:10px;"><img class="zoomable" src="'+c.uploadedImage+'" data-caption="'+htmlEscape(c.key)+'" alt="'+htmlEscape(c.key)+'" style="max-width:140px; max-height:140px; border:1px solid var(--border); border-radius:4px;"></div>' : '<div style="color:var(--text-3); font-size:12px; margin-bottom:8px; font-style:italic;">No image uploaded yet.</div>'}
        <input id="cmp-img-file" type="file" accept="image/*" style="padding:8px; border:1px dashed var(--border-2); background:var(--surface-2); cursor:pointer; width:100%;">
        <div class="help-text">Leave blank to keep the existing image.</div>
      </div>
      <div class="form-row"><label>Used by archetypes</label><input type="text" value="${(c.usedBy||[]).join(', ')}" disabled style="color:var(--text-3)"><div class="help-text">Set from each archetype's component picker</div></div>
      <div id="cmp-msg" style="margin-top:8px; color:var(--text-3); font-size:12px;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="cmp-save">Save changes</button>
    </div>
  `);
  document.getElementById('cmp-save').addEventListener('click', async () => {
    const newKey = document.getElementById('cmp-key').value.trim();
    const newDesc = document.getElementById('cmp-desc').value.trim();
    const file = document.getElementById('cmp-img-file').files[0];
    const fd = new FormData();
    fd.append('key', newKey); fd.append('description', newDesc);
    if (file) fd.append('image', file);
    try {
      await api.components.patch(c.key, fd);
      await refreshComponents();
      closeModal(); render();
    } catch (err) { reportError(err); }
  });
}

function deleteComponent(i) {
  const c = STATE.components[i];
  confirmDelete(c.key, () => {
    api.components.remove(c.key).then(refreshComponents).then(render).catch(reportError);
  });
}

// ---- Clients

// Service-area rows: dynamically added/removed inside a container with id `${prefix}-service-areas`.
// Row classes: .sa-name, .sa-postcode, .sa-notes; primary radio uses name=`${prefix}-primary`.
function serviceAreaRowHTML(prefix, initial = {}) {
  const isPrimary = !!initial.primary;
  return `<div class="service-area-row" style="display:grid; grid-template-columns: 88px 2.2fr 1fr 3fr auto; gap:10px; align-items:center; padding:10px; background:var(--bg); border:1px solid var(--border-2); border-radius:4px; margin-bottom:8px;">` +
    `<label style="display:flex; align-items:center; gap:6px; font-family:inherit; font-size:13px; font-weight:500; text-transform:none; letter-spacing:normal; color:var(--text-2); margin:0; cursor:pointer;">` +
      `<input type="radio" name="${prefix}-primary" ${isPrimary ? 'checked' : ''} style="width:auto;"> Primary` +
    `</label>` +
    `<input class="sa-name" type="text" placeholder="e.g. Melbourne" value="${htmlEscape(initial.name || '')}">` +
    `<input class="sa-postcode" type="text" placeholder="3000" value="${htmlEscape(initial.postcode || '')}">` +
    `<input class="sa-notes" type="text" placeholder="optional notes (service days, range, special handling)" value="${htmlEscape(initial.notes || '')}">` +
    `<button type="button" class="btn btn-sm btn-danger" onclick="removeServiceAreaRow(this, '${prefix}')" title="Remove">×</button>` +
  `</div>`;
}
function addServiceAreaRow(prefix, initial = {}) {
  const host = document.getElementById(prefix + '-service-areas');
  if (!host) return;
  host.insertAdjacentHTML('beforeend', serviceAreaRowHTML(prefix, initial));
}
function removeServiceAreaRow(btn, prefix) {
  const row = btn.closest('.service-area-row');
  const host = document.getElementById(prefix + '-service-areas');
  if (!host || !row) return;
  if (host.querySelectorAll('.service-area-row').length <= 1) return; // keep at least one
  const wasPrimary = row.querySelector('input[type=radio]').checked;
  row.remove();
  // If the removed row was the primary, mark the first remaining as primary.
  if (wasPrimary) {
    const first = host.querySelector('.service-area-row input[type=radio]');
    if (first) first.checked = true;
  }
}
function collectServiceAreas(prefix) {
  const host = document.getElementById(prefix + '-service-areas');
  if (!host) return [];
  const rows = Array.from(host.querySelectorAll('.service-area-row'));
  const out = [];
  let anyPrimary = false;
  for (const r of rows) {
    const name = r.querySelector('.sa-name').value.trim();
    if (!name) continue;
    const primary = r.querySelector('input[type=radio]').checked;
    if (primary) anyPrimary = true;
    out.push({
      name,
      postcode: r.querySelector('.sa-postcode').value.trim(),
      primary,
      notes: r.querySelector('.sa-notes').value.trim(),
    });
  }
  // Guarantee one primary even if user forgot to select.
  if (out.length > 0 && !anyPrimary) out[0].primary = true;
  return out;
}
window.addServiceAreaRow = addServiceAreaRow;
window.removeServiceAreaRow = removeServiceAreaRow;

async function createClientFromForm() {
  const get = (id) => document.getElementById(id);
  const checkedBrands = Array.from(document.querySelectorAll('#cn-brands input:checked'))
    .map((el) => el.value);
  const service_areas = collectServiceAreas('cn');
  const primary = service_areas.find((a) => a.primary) || service_areas[0] || { name: '', postcode: '' };
  const data = {
    business_name: get('cn-business').value.trim(),
    years_in_business: parseInt(get('cn-years').value, 10) || 0,
    state: get('cn-state').value,
    service_areas,
    // Mirror primary into city/postcode for back-compat; the server also does this on save.
    city: primary.name,
    postcode: primary.postcode,
    brands_sold: checkedBrands,
    google_review_count: parseInt(get('cn-reviews').value, 10) || 0,
    install_guarantee_days: parseInt(get('cn-guarantee').value, 10) || 0,
    default_per_week_price: get('cn-price').value.trim(),
    current_promo_pct: parseInt(get('cn-promo').value, 10) || 0,
    family_owned: !!(get('cn-family-owned') && get('cn-family-owned').checked),
    australian_owned: !!(get('cn-aus-owned') && get('cn-aus-owned').checked),
  };
  if (!data.business_name) {
    document.getElementById('cn-msg').textContent = 'Business name required.';
    return;
  }
  try {
    const created = await api.clients.create(data);
    // Upload any photos that were attached. Done before generation kicks off
    // so A10 fires correctly when the user uploaded team/owner/van.
    const photoSlots = ['team', 'owner', 'van'];
    for (const t of photoSlots) {
      const input = document.getElementById('cn-photo-' + t);
      const files = input ? Array.from(input.files || []) : [];
      for (const f of files) {
        const fd = new FormData(); fd.append('image', f);
        await api.clients.photo(created.id, t, fd);
      }
    }
    await refreshClients();
    currentClientTab = 'list';
    currentClientId = created.id;
    render(); window.scrollTo(0, 0);
    // Auto-fire the pack — generation runs in the background; the client
    // detail page polls PACK_STATE + the ads list and re-renders cards as
    // each generation lands.
    startPackGeneration(created.id);
  } catch (err) { reportError(err); }
}

function openEditClient(clientId) {
  const c = CLIENTS.find((x) => x.id === clientId);
  if (!c) return;
  const allBrands = ['ActronAir', 'Braemar', 'Carrier', 'Daikin', 'Fujitsu', 'Gree', 'Haier', 'Hisense', 'Hitachi', 'LG', 'Midea', 'Mitsubishi Electric', 'Mitsubishi Heavy Industries', 'Panasonic', 'Rinnai', 'Samsung', 'Toshiba'];
  const states = ['NSW','VIC','QLD','WA','SA','ACT','TAS','NT'];
  const areas = (Array.isArray(c.service_areas) && c.service_areas.length)
    ? c.service_areas
    : [{ name: c.city || '', postcode: c.postcode || '', primary: true, notes: '' }];
  const brandsSet = new Set(c.brands_sold || []);
  showModal(`
    <div class="modal-header">
      <div><h3 class="modal-title">Edit ${htmlEscape(c.business_name)}</h3><div class="modal-subtitle">Client · ${htmlEscape(c.id)}</div></div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body" style="max-height:75vh">
      <div class="form-row"><label>Business name</label><input id="ec-business" type="text" value="${htmlEscape(c.business_name || '')}"></div>
      <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
        <div><label>Years in business</label><input id="ec-years" type="number" value="${c.years_in_business || 0}"></div>
        <div><label>State</label><select id="ec-state">${states.map(s => `<option ${s===c.state?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <label>Service areas</label>
        <div id="ec-service-areas" data-prefix="ec">${areas.map(a => serviceAreaRowHTML('ec', a)).join('')}</div>
        <button type="button" class="btn btn-sm" style="margin-top:6px" onclick="addServiceAreaRow('ec')">+ Add service area</button>
      </div>
      <div class="form-row">
        <label>Brands sold</label>
        <div id="ec-brands" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; padding:10px; background:var(--bg); border:1px solid var(--border-2); border-radius:4px;">
          ${allBrands.map(b => `<label style="display:flex; align-items:center; gap:8px; font-size:13px; font-family:inherit; text-transform:none; letter-spacing:normal; color:var(--text-1); font-weight:400; margin:0; cursor:pointer;"><input type="checkbox" value="${htmlEscape(b)}" ${brandsSet.has(b)?'checked':''} style="width:auto;"> ${b}</label>`).join('')}
        </div>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
        <div><label>Google review count</label><input id="ec-reviews" type="number" value="${c.google_review_count || 0}"></div>
        <div><label>Install guarantee (days)</label><input id="ec-guarantee" type="number" value="${c.install_guarantee_days || 0}"></div>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
        <div><label>Default per-week price</label><input id="ec-price" type="text" value="${htmlEscape(String(c.default_per_week_price || ''))}"></div>
        <div><label>Current promo %</label><input id="ec-promo" type="number" value="${c.current_promo_pct || 0}"></div>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
        <div><label>Family owned &amp; operated</label><label style="display:flex; align-items:center; gap:8px; font-family:inherit; font-size:14px; color:var(--text-1); font-weight:400; text-transform:none; letter-spacing:normal; cursor:pointer; padding:9px 11px; background:var(--bg); border:1px solid var(--border-2); border-radius:4px;"><input id="ec-family-owned" type="checkbox" ${c.family_owned?'checked':''} style="width:auto;"> Yes</label></div>
        <div><label>Australian owned</label><label style="display:flex; align-items:center; gap:8px; font-family:inherit; font-size:14px; color:var(--text-1); font-weight:400; text-transform:none; letter-spacing:normal; cursor:pointer; padding:9px 11px; background:var(--bg); border:1px solid var(--border-2); border-radius:4px;"><input id="ec-aus-owned" type="checkbox" ${c.australian_owned?'checked':''} style="width:auto;"> Yes</label></div>
      </div>
      <div class="form-row"><span id="ec-msg" style="font-size:12px; color:#b91c1c;"></span></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditedClient('${c.id}')">Save changes</button>
    </div>
  `, { large: true });
}
async function saveEditedClient(clientId) {
  const get = (id) => document.getElementById(id);
  const checkedBrands = Array.from(document.querySelectorAll('#ec-brands input:checked')).map(el => el.value);
  const service_areas = collectServiceAreas('ec');
  if (service_areas.length === 0) {
    document.getElementById('ec-msg').textContent = 'At least one service area is required.';
    return;
  }
  const primary = service_areas.find(a => a.primary) || service_areas[0];
  const patch = {
    business_name: get('ec-business').value.trim(),
    years_in_business: parseInt(get('ec-years').value, 10) || 0,
    state: get('ec-state').value,
    service_areas,
    city: primary.name,
    postcode: primary.postcode,
    brands_sold: checkedBrands,
    google_review_count: parseInt(get('ec-reviews').value, 10) || 0,
    install_guarantee_days: parseInt(get('ec-guarantee').value, 10) || 0,
    default_per_week_price: get('ec-price').value.trim(),
    current_promo_pct: parseInt(get('ec-promo').value, 10) || 0,
    family_owned: get('ec-family-owned').checked,
    australian_owned: get('ec-aus-owned').checked,
  };
  try {
    await api.clients.patch(clientId, patch);
    closeModal();
    await refreshClients();
    render();
  } catch (err) {
    const msg = document.getElementById('ec-msg');
    if (msg) msg.textContent = 'Save failed: ' + err.message;
  }
}
window.openEditClient = openEditClient;
window.saveEditedClient = saveEditedClient;

async function uploadGoldOutputImage(code, inputEl) {
  const file = inputEl && inputEl.files && inputEl.files[0];
  if (!file) return;
  try {
    const fd = new FormData();
    fd.append('image', file);
    await api.golds.uploadImage(code, fd);
    GOLDS = await api.golds.list();
    render();
  } catch (err) { reportError(err); }
}
async function deleteGoldOutputImage(code) {
  if (!confirm(`Remove the uploaded gold-standard output image for ${code}?`)) return;
  try {
    await api.golds.deleteImage(code);
    GOLDS = await api.golds.list();
    render();
  } catch (err) { reportError(err); }
}
window.uploadGoldOutputImage = uploadGoldOutputImage;
window.deleteGoldOutputImage = deleteGoldOutputImage;

async function deleteClient(id) {
  const c = CLIENTS.find(x => x.id === id); if (!c) return;
  confirmDelete(c.business_name, async () => {
    try {
      await api.clients.remove(id);
      await refreshClients();
      currentClientId = null; currentClientTab = 'list'; render();
    } catch (err) { reportError(err); }
  });
}

window.createClientFromForm = createClientFromForm;
window.deleteClient = deleteClient;

// ---- Master prompt

async function saveMasterPrompt() {
  const ta = document.querySelector('.master-editor-textarea');
  if (!ta) return;
  const txt = ta.value;
  try {
    await api.masterPrompt.save(txt);
    MASTER_PROMPT = txt;
    const msg = document.getElementById('mp-msg');
    if (msg) { msg.textContent = 'Saved.'; setTimeout(() => { msg.textContent = ''; }, 2000); }
  } catch (err) { reportError(err); }
}
async function revertMasterPrompt() {
  MASTER_PROMPT = await api.masterPrompt.get();
  render();
}
async function syncArchetypePatterns() {
  const msg = document.getElementById('mp-msg');
  try {
    if (msg) msg.textContent = 'Regenerating from archetypes…';
    const r = await fetch('/api/master-prompt/preview-archetype-sync', { method: 'POST' });
    if (!r.ok) {
      let err; try { err = await r.json(); } catch { err = { error: r.statusText }; }
      throw new Error(err.error || ('HTTP ' + r.status));
    }
    const { content } = await r.json();
    const ta = document.querySelector('.master-editor-textarea');
    if (ta) ta.value = content;
    MASTER_PROMPT = content;
    if (msg) {
      msg.textContent = 'Loaded regenerated prompt — review the ARCHETYPE PATTERNS section, then click Save to commit.';
      msg.style.color = 'var(--accent)';
      setTimeout(() => { msg.textContent = ''; msg.style.color = 'var(--text-3)'; }, 8000);
    }
  } catch (err) {
    if (msg) {
      msg.textContent = 'Sync failed: ' + err.message;
      msg.style.color = '#b91c1c';
    } else {
      reportError(err);
    }
  }
}
window.saveMasterPrompt = saveMasterPrompt;
window.revertMasterPrompt = revertMasterPrompt;
window.syncArchetypePatterns = syncArchetypePatterns;

// ============================================================
// BOOT
// ============================================================
function showBootError(html) {
  const main = document.getElementById('main-content');
  if (main) main.innerHTML = '<div class="empty-state" style="color:#b91c1c; max-width:640px; margin:60px auto; text-align:left;">' + html + '</div>';
}

window.addEventListener('DOMContentLoaded', () => {
  if (location.protocol === 'file:') {
    showBootError(
      '<strong>This page needs the Node server.</strong><br><br>' +
      'It is being opened directly from disk (<code>file://</code>), so the API calls and asset URLs do not resolve.<br><br>' +
      'In a terminal, run:<br><br><code>cd tradie-force-admin &amp;&amp; npm start</code><br><br>' +
      'Then open <a href="http://localhost:3000">http://localhost:3000</a>.'
    );
    return;
  }
  loadAll().then(render).catch((err) => {
    showBootError(
      '<strong>Could not load data from the server.</strong><br><br>' +
      htmlEscape(err.message) + '<br><br>' +
      'Make sure <code>npm start</code> is running in the <code>tradie-force-admin</code> directory.'
    );
    console.error(err);
  });
});

function renderClientNew() {
  const allBrands = ['ActronAir', 'Braemar', 'Carrier', 'Daikin', 'Fujitsu', 'Gree', 'Haier', 'Hisense', 'Hitachi', 'LG', 'Midea', 'Mitsubishi Electric', 'Mitsubishi Heavy Industries', 'Panasonic', 'Rinnai', 'Samsung', 'Toshiba'];
  const cities = STATE.prices.map(p => p.city);
  return `
    <div class="page-header">
      <div class="page-eyebrow">Operations · Clients</div>
      <h1 class="page-title">New client onboarding</h1>
      <p class="page-intro">Fill out this form on behalf of the client. Submitting creates a new client file on disk under <code>data/clients/</code>.</p>
    </div>
    <div class="client-tabs">
      <div class="client-tab" onclick="setClientTab('list')">All clients</div>
      <div class="client-tab active">+ New client (onboarding form)</div>
    </div>
    <div class="form-grid">
      <div class="form-section-h">Business details</div>
      <div class="form-group"><label>Business name</label><input id="cn-business" type="text" placeholder="e.g. Sharp Air Conditioning"></div>
      <div class="form-group"><label>Years in business</label><input id="cn-years" type="number" placeholder="e.g. 11"></div>
      <div class="form-group"><label>State</label><select id="cn-state"><option>NSW</option><option>VIC</option><option>QLD</option><option>WA</option><option>SA</option><option>ACT</option><option>TAS</option><option>NT</option></select></div>
      <div class="form-group" style="grid-column:1 / -1">
        <label>Service areas <span style="font-weight:400; color:var(--text-3); text-transform:none; letter-spacing:normal;">— at least one, marked primary; add more for clients who service multiple regions</span></label>
        <div id="cn-service-areas" data-prefix="cn">${serviceAreaRowHTML('cn', { primary: true })}</div>
        <button type="button" class="btn btn-sm" style="margin-top:8px" onclick="addServiceAreaRow('cn')">+ Add service area</button>
        <div class="help-text">The primary area drives the price-library lookup and the default <code>{{city}}</code> reference in ads. Additional areas show up in pack context so Master AI can mention them where relevant (e.g. A10 Local Trust headers).</div>
      </div>
      <div class="form-section-h">Brands sold</div>
      <div class="form-group" style="grid-column:1 / -1">
        <label>Multi-select (will appear in brand strip across ads)</label>
        <div id="cn-brands" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; padding:10px; background:var(--bg); border:1px solid var(--border-2); border-radius:4px;">
          ${allBrands.map(b => `<label style="display:flex; align-items:center; gap:8px; font-size:13px; font-family:inherit; text-transform:none; letter-spacing:normal; color:var(--text-1); font-weight:400; margin:0; cursor:pointer;"><input type="checkbox" value="${htmlEscape(b)}" style="width:auto;"> ${b}</label>`).join('')}
        </div>
      </div>
      <div class="form-section-h">Trust &amp; pricing</div>
      <div class="form-group"><label>Google review count</label><input id="cn-reviews" type="number" placeholder="e.g. 168"><div class="help-text">If &lt; 30, review badges are omitted (HR08).</div></div>
      <div class="form-group"><label>Install guarantee (days)</label><input id="cn-guarantee" type="number" placeholder="e.g. 7"></div>
      <div class="form-group"><label>Default per-week price (override library)</label><input id="cn-price" type="text" placeholder="e.g. $55"><div class="help-text">Leave blank to use Healthy Price Library default for the city.</div></div>
      <div class="form-group"><label>Current promo % (if any)</label><input id="cn-promo" type="number" placeholder="e.g. 30"></div>
      <div class="form-section-h">Trust signals</div>
      <div class="form-group"><label>Family owned &amp; operated</label><label style="display:flex; align-items:center; gap:8px; font-family:inherit; font-size:14px; color:var(--text-1); font-weight:400; text-transform:none; letter-spacing:normal; cursor:pointer; padding:9px 11px; background:var(--bg); border:1px solid var(--border-2); border-radius:4px;"><input id="cn-family-owned" type="checkbox" style="width:auto;"> Yes — display "Family Owned &amp; Operated" badge on ads</label><div class="help-text">AI-generated badge per HR19 — only appears on ads when this is true.</div></div>
      <div class="form-group"><label>Australian owned</label><label style="display:flex; align-items:center; gap:8px; font-family:inherit; font-size:14px; color:var(--text-1); font-weight:400; text-transform:none; letter-spacing:normal; cursor:pointer; padding:9px 11px; background:var(--bg); border:1px solid var(--border-2); border-radius:4px;"><input id="cn-aus-owned" type="checkbox" style="width:auto;"> Yes — display "Australian Owned" badge on ads</label><div class="help-text">AI-generated badge per HR19 — only appears on ads when this is true.</div></div>
      <div class="form-section-h">Photos uploaded</div>
      <div class="form-group"><label>Team photos</label><input id="cn-photo-team" type="file" accept="image/*" multiple style="padding:8px; border:1px dashed var(--border-2); background:var(--surface-2); cursor:pointer; width:100%;"><div class="help-text">Local Trust (A10) ad fires if ANY of team / owner / van photos are uploaded.</div></div>
      <div class="form-group"><label>Owner photos</label><input id="cn-photo-owner" type="file" accept="image/*" multiple style="padding:8px; border:1px dashed var(--border-2); background:var(--surface-2); cursor:pointer; width:100%;"></div>
      <div class="form-group"><label>Van / vehicle photos</label><input id="cn-photo-van" type="file" accept="image/*" multiple style="padding:8px; border:1px dashed var(--border-2); background:var(--surface-2); cursor:pointer; width:100%;"></div>
      <div class="form-group" style="grid-column:1 / -1; display:flex; gap:10px; justify-content:flex-end; align-items:center; margin-top:8px; padding-top:18px; border-top:1px solid var(--surface-2);">
        <span id="cn-msg" style="font-size:12px; color:#b91c1c; margin-right:auto;"></span>
        <button class="btn btn-primary" onclick="createClientFromForm()">Create client</button>
      </div>
    </div>
  `;
}

const __origRenderClientDetail = renderClientDetail;
renderClientDetail = function(clientId) {
  const html = __origRenderClientDetail(clientId);
  // Inject a Delete client button at the bottom of the client-summary card.
  return html.replace(
    /<div style="margin-top:14px"><button class="btn btn-sm" onclick="openEditClient\('([^']+)'\)">Edit details<\/button><\/div>/,
    '<div style="margin-top:14px; display:flex; gap:8px;"><button class="btn btn-sm" onclick="openEditClient(\'$1\')">Edit details</button><button class="btn btn-sm btn-danger" onclick="deleteClient(\'$1\')">Delete client</button></div>'
  );
};

// ============================================================
// SECTION 7: GENERATE AD — wires Layer 2 (Claude) + Layer 3 (gpt-image-2)
// Configure every input to the last detail, preview the brief that goes to
// Claude, then either compose only (cheap dry-run) or compose + render (real).
// ============================================================
const GEN = {
  client_id: '',
  archetype: '',
  city: '',
  picks: { headline: '', sub_headline: '', value_stack: '', cta: '', badge: '' },
  component_keys: [],
  attach_client_photos: [],
  quality: 'high',
  n_candidates: 3,
  skip_critique: false,
  // Result state
  composedPrompt: '',
  composedPromptV1: '',
  critiqueApplied: false,
  composedUsage: null,
  composedCost: 0,
  imageUrl: '',
  imageAltUrls: [],
  candidateUrls: [],          // every candidate, in order — for manual picker
  bestIndex: 0,               // Claude's pick (advisory)
  manualPickIndex: null,      // operator override (null = use Claude's pick)
  hdUrls: {},                 // { '2k': '...', '4k': '...' }
  upscaleMethod: '',
  pickReasoning: '',
  pickPerCandidate: [],
  imageCost: 0,
  totalCost: 0,
  ad_id: '',
  promptDirty: false,         // operator edited the prompt textarea since last compose
  status: '',           // '', 'composing', 'critiquing', 'rendering', 'picking', 'upscaling', 'done', 'error'
  errorMsg: '',
  // Cached client photo list
  clientPhotos: [],
};

function genGetArch() { return STATE.archetypes.find(a => a.code === GEN.archetype) || null; }
function genGetClient() { return CLIENTS.find(c => c.id === GEN.client_id) || null; }

function genComponentsForArchetype(archCode) {
  if (!archCode) return [];
  return STATE.components.filter(c => Array.isArray(c.usedBy) && c.usedBy.includes(archCode));
}

function poolKeys(arch) {
  if (!arch || !arch.variable_inputs) return [];
  return Object.keys(arch.variable_inputs);
}
function findHeadlinePool(arch) {
  // Pick the first key that starts with 'headline' (covers A1 Headlines, A5/A6 seasonal sub-pools)
  return poolKeys(arch).find(k => k.toLowerCase().startsWith('headline'));
}

function genResetForArch() {
  const arch = genGetArch();
  if (!arch) return;
  // Auto-pick the first item from each pool as a default — operator can change.
  const v = arch.variable_inputs || {};
  const hk = findHeadlinePool(arch);
  GEN.picks.headline     = (hk && v[hk] && v[hk][0])           || '';
  GEN.picks.sub_headline = (v['Sub-headlines'] && v['Sub-headlines'][0]) || '';
  GEN.picks.value_stack  = (v['Value stacks']  && v['Value stacks'][0])  || (v['Solution lines'] && v['Solution lines'][0]) || '';
  GEN.picks.cta          = (v['CTAs']          && v['CTAs'][0])          || '';
  GEN.picks.badge        = (v['Badges']        && v['Badges'][0])        || '';
  // Default-select the components this archetype uses, capped at 4 to keep image-edit payload reasonable.
  GEN.component_keys = genComponentsForArchetype(arch.code).slice(0, 4).map(c => c.key);
}

function renderGenerate() {
  const arch = genGetArch();
  const client = genGetClient();
  const v = arch ? (arch.variable_inputs || {}) : {};
  const headlineKey = arch ? findHeadlinePool(arch) : null;
  const headlines    = (headlineKey && v[headlineKey]) || [];
  const subs         = v['Sub-headlines'] || [];
  const valueStacks  = v['Value stacks'] || v['Solution lines'] || [];
  const ctas         = v['CTAs'] || [];
  const badges       = v['Badges'] || [];

  const cities = STATE.prices.map(p => p.city);
  const archCity = GEN.city || (client && client.city) || '';
  const priceRow = STATE.prices.find(p => p.city === archCity);

  const archComponents = arch ? genComponentsForArchetype(arch.code) : [];
  const compsByCat = {};
  for (const c of archComponents) {
    if (!compsByCat[c.category]) compsByCat[c.category] = [];
    compsByCat[c.category].push(c);
  }

  const fires = arch
    ? (arch.code === 'A10'
       ? '<span class="pill pill-amber">Conditional · team/owner/van photo required</span>'
       : '<span class="pill pill-green">Always generates</span>')
    : '';

  const refUrl = arch ? refUrlForCode(arch.code) : '';

  // ── Build the right-column "what will go to Claude" preview locally (matches server side roughly).
  const briefPreview = arch && client ? buildLocalBriefPreview({arch, client, city: archCity, picks: GEN.picks, components: archComponents.filter(c => GEN.component_keys.includes(c.key)), priceRow, photos: GEN.attach_client_photos}) : '<em style="color:var(--text-3);">Pick a client and archetype to see the brief.</em>';

  return `
    <div class="page-header">
      <div class="page-eyebrow">Operations · Generate Ad</div>
      <h1 class="page-title">Generate Ad</h1>
      <p class="page-intro">Configure every input to the last detail, preview the brief Master AI will compose against, then run Layer 2 (Claude composes the ChatGPT-ready prompt) → Layer 3 (gpt-image-2 renders the final 1080×1080 PNG). Each generation is logged to <code>data/_cache/spend.jsonl</code> and saved to <code>assets/generated-ads/{client_id}/</code>.</p>
    </div>

    <div style="display:grid; grid-template-columns: 420px 1fr; gap:24px; align-items:start;">

      <!-- ============================ LEFT: CONFIG ============================ -->
      <div class="form-grid" style="grid-template-columns: 1fr; padding:18px; gap:14px;">
        <div class="form-section-h">Target</div>
        <div class="form-group">
          <label>Client</label>
          <select id="gen-client">
            <option value="">— pick a client —</option>
            ${CLIENTS.map(c => `<option value="${c.id}" ${c.id===GEN.client_id?'selected':''}>${htmlEscape(c.business_name)} · ${htmlEscape(c.city)}</option>`).join('')}
          </select>
          ${client ? `<div class="help-text">${htmlEscape(client.region || '')}${client.years_in_business ? ' · ' + client.years_in_business + 'y in business' : ''} · ${client.google_review_count} reviews · ${client.brands_sold.length} brands · ${client.current_promo_pct}% promo</div>` : '<div class="help-text">Or create one in <strong>Clients → + New client</strong>.</div>'}
        </div>
        <div class="form-group">
          <label>Archetype</label>
          <select id="gen-archetype">
            <option value="">— pick an archetype —</option>
            ${STATE.archetypes.map(a => `<option value="${a.code}" ${a.code===GEN.archetype?'selected':''}>${a.code} — ${htmlEscape(a.name)}</option>`).join('')}
          </select>
          ${arch ? `<div class="help-text">${fires} · Funnel: ${htmlEscape(arch.funnel_stage || '')}</div>` : ''}
        </div>
        <div class="form-group">
          <label>City (drives price-library lookup &amp; {{city}} substitution)</label>
          <select id="gen-city">
            <option value="">— defaults to client primary —</option>
            ${cities.map(c => `<option value="${c}" ${c===GEN.city?'selected':''}>${c}</option>`).join('')}
          </select>
          ${priceRow ? `<div class="help-text">Per-week ${priceRow.perWeek}${priceRow.fixed?` · Fixed ${priceRow.fixed}`:''}${priceRow.anchor?` · Anchor ${priceRow.anchor}`:''}${priceRow.rebate?` · Rebate ${priceRow.rebate}`:''}</div>` : ''}
        </div>

        ${arch ? `
          <div class="form-section-h">Variable inputs <span style="font-weight:400; color:var(--text-3); font-family:inherit; text-transform:none; letter-spacing:normal;">— operator picks (override Layer 1's random choice)</span></div>
          <div class="form-group">
            <label>Headline ${headlineKey ? `<span style="color:var(--text-3); font-weight:400; text-transform:none; letter-spacing:normal;">(${headlineKey} · ${headlines.length} options)</span>`: ''}</label>
            <select id="gen-headline">${headlines.map(h => `<option ${h===GEN.picks.headline?'selected':''}>${htmlEscape(h)}</option>`).join('') || '<option value="">— no headlines —</option>'}</select>
          </div>
          ${subs.length ? `<div class="form-group"><label>Sub-headline (${subs.length} options)</label><select id="gen-sub">${subs.map(s => `<option ${s===GEN.picks.sub_headline?'selected':''}>${htmlEscape(s)}</option>`).join('')}</select></div>` : ''}
          <div class="form-group">
            <label>Value stack (${valueStacks.length} options)</label>
            <select id="gen-value">${valueStacks.map(s => `<option ${s===GEN.picks.value_stack?'selected':''}>${htmlEscape(s)}</option>`).join('') || '<option value="">— none —</option>'}</select>
          </div>
          <div class="form-group">
            <label>CTA (${ctas.length} options)</label>
            <select id="gen-cta">${ctas.map(s => `<option ${s===GEN.picks.cta?'selected':''}>${htmlEscape(s)}</option>`).join('') || '<option value="">— none —</option>'}</select>
          </div>
          ${badges.length ? `<div class="form-group"><label>Badge (${badges.length} options)</label><select id="gen-badge">${badges.map(s => `<option ${s===GEN.picks.badge?'selected':''}>${htmlEscape(s)}</option>`).join('')}</select></div>` : ''}

          <div class="form-section-h">Components attached <span style="font-weight:400; color:var(--text-3); font-family:inherit; text-transform:none; letter-spacing:normal;">— locked images sent to gpt-image-2 (max 16)</span></div>
          ${Object.keys(compsByCat).length === 0 ? '<div class="empty-state">No components selected for this archetype yet. Visit <strong>Archetypes → ' + arch.code + ' → Components</strong> to wire some up.</div>' : Object.entries(compsByCat).map(([cat, list]) => `
            <div class="form-group" style="grid-column:1 / -1">
              <label>${htmlEscape(cat)} <span style="color:var(--text-3); font-weight:400; text-transform:none; letter-spacing:normal;">(${list.length})</span></label>
              <div class="component-pick-grid" style="grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));">
                ${list.map(c => {
                  const sel = GEN.component_keys.includes(c.key);
                  const thumb = c.uploadedImage || c.imagePath ? `<img src="${c.uploadedImage || c.imagePath}" style="width:100%; height:100%; object-fit:contain; padding:6px;">` : htmlEscape(c.imageId || c.key);
                  return `
                    <div class="component-pick-card ${sel?'selected':''}" onclick="genToggleComp('${c.key.replace(/'/g,"\\'")}')">
                      <div class="check-mark">✓</div>
                      <div class="component-pick-thumb">${thumb}</div>
                      <div class="component-pick-name" style="font-size:10px;">${htmlEscape(c.key)}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}

          ${client && (client.team_photos_uploaded || client.owner_photos_uploaded || client.van_photos_uploaded) ? `
            <div class="form-section-h">Client photos <span style="font-weight:400; color:var(--text-3); font-family:inherit; text-transform:none; letter-spacing:normal;">— used AS-IS per HR04</span></div>
            <div class="form-group"><div id="gen-photos-list" class="help-text">Loading uploaded photos…</div></div>
          ` : ''}

          <div class="form-section-h">Premium quality pipeline</div>
          <div class="form-group" style="background:var(--surface-2); padding:12px 14px; border-radius:6px; border:1px solid var(--border); font-size:12px; line-height:1.6; color:var(--text-2);">
            <strong style="color:var(--accent); font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.06em;">Active by default · cost is no object</strong><br>
            ① Gold-standard few-shots inlined into Claude's system prompt<br>
            ② Extended thinking (12k tokens) → composed prompt v1<br>
            ③ Self-critique pass → refined prompt v2<br>
            ④ <span id="gen-n-display">3</span>× gpt-image-2 candidates rendered in parallel<br>
            ⑤ Claude vision picks the best (alts saved for audit)<br>
            ⑥ Sharp Lanczos3 upscale to 1080×1080 (HR10)<br>
          </div>
          <div class="form-group">
            <label>gpt-image-2 quality</label>
            <select id="gen-quality">
              <option value="low" ${GEN.quality==='low'?'selected':''}>low (~$0.011/img · fastest)</option>
              <option value="medium" ${GEN.quality==='medium'?'selected':''}>medium (~$0.042/img)</option>
              <option value="high" ${GEN.quality==='high'?'selected':''}>high (~$0.167/img · best)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Best-of-N (image candidates)</label>
            <select id="gen-n-cand">
              <option value="1" ${GEN.n_candidates===1?'selected':''}>1 (no best-pick — fastest)</option>
              <option value="2" ${GEN.n_candidates===2?'selected':''}>2 (best of 2)</option>
              <option value="3" ${GEN.n_candidates===3?'selected':''}>3 (best of 3 · default)</option>
              <option value="4" ${GEN.n_candidates===4?'selected':''}>4 (best of 4 · slowest)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Skip critique pass</label>
            <label style="display:flex; align-items:center; gap:8px; padding:9px 11px; background:var(--bg); border:1px solid var(--border-2); border-radius:4px; font-family:inherit; font-size:14px; color:var(--text-1); font-weight:400; text-transform:none; letter-spacing:normal; cursor:pointer;">
              <input type="checkbox" id="gen-skip-critique" ${GEN.skip_critique?'checked':''} style="width:auto;"> Faster, slightly lower quality
            </label>
          </div>

          <div class="form-group" style="display:flex; gap:10px; flex-direction:column;">
            <button class="btn" id="gen-compose-btn" onclick="genRun(true)">Compose prompt only · ~$1–3 (Claude only)</button>
            <button class="btn btn-primary" id="gen-render-btn" onclick="genRun(false)">Compose &amp; render full pipeline · ~$2–5</button>
            <span id="gen-status" style="font-size:12px; color:var(--text-3); text-align:center; min-height:18px;">${genStatusText()}</span>
          </div>
        ` : '<div class="empty-state" style="grid-column:1 / -1;">Pick an archetype to see its variable inputs and components.</div>'}
      </div>

      <!-- ============================ RIGHT: PREVIEW + RESULTS ============================ -->
      <div style="display:flex; flex-direction:column; gap:18px;">

        ${refUrl ? `
        <div class="section" style="margin:0;">
          <h2 class="section-h" style="font-size:17px;">Reference vs generated · side-by-side</h2>
          <div class="section-flow">→ reference is the gold-standard structure + palette · generation should mirror both</div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:12px;">
            <div>
              <div style="font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:6px; text-align:center;">REFERENCE</div>
              <img class="zoomable" src="${refUrl}" data-caption="${htmlEscape(arch.code + ' reference')}" alt="" style="width:100%; aspect-ratio:1; object-fit:cover; border:1px solid var(--border); border-radius:6px;">
            </div>
            <div>
              <div style="font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:${GEN.imageUrl ? 'var(--accent)' : 'var(--text-3)'}; margin-bottom:6px; text-align:center;">${GEN.imageUrl ? 'YOUR GENERATION' : '— not generated yet —'}</div>
              ${GEN.imageUrl
                ? `<img class="zoomable" src="${GEN.imageUrl}?t=${Date.now()}" data-caption="latest generation" alt="" style="width:100%; aspect-ratio:1; object-fit:cover; border:1px solid var(--accent); border-radius:6px;">`
                : `<div style="width:100%; aspect-ratio:1; background:var(--surface-2); border:1px dashed var(--border-2); border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--text-3); font-family:JetBrains Mono,monospace; font-size:11px;">— compose &amp; render to see —</div>`
              }
            </div>
          </div>
          <div style="font-size:12px; color:var(--text-2); margin-top:8px;">When the generation lands, click either image to fullscreen. Hold cmd/ctrl and click the reference if you want to swap it from the <strong>Archetypes → ${arch.code}</strong> page.</div>
        </div>
        ` : ''}

        <div class="section" style="margin:0;">
          <h2 class="section-h" style="font-size:17px;">What we'll send to Claude (per-ad brief)</h2>
          <div class="section-flow">→ this is the user message · system prompt = <code>data/master-prompt.md</code> (cached)</div>
          <div class="preview-output" style="max-height:380px; overflow-y:auto; font-size:11.5px;">${briefPreview}</div>
        </div>

        <div class="section" style="margin:0;">
          <h2 class="section-h" style="font-size:17px;">ChatGPT-ready prompt ${GEN.critiqueApplied ? '<span class="pill pill-green" style="vertical-align:middle;">critique applied</span>' : ''} <span style="font-weight:400; color:var(--text-3); font-family:'JetBrains Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">${GEN.composedCost ? '· $' + GEN.composedCost.toFixed(4) : ''}</span></h2>
          <div class="section-flow">→ editable · what gets sent to gpt-image-2 · tweak this if you know prompting and click "Render with this prompt"</div>
          ${GEN.composedPrompt ? `
            <textarea id="gen-prompt-edit" oninput="GEN.promptDirty=true; document.getElementById('gen-render-edited-btn').disabled=false;" style="width:100%; min-height:340px; padding:14px 16px; border:1px solid var(--border-2); border-radius:8px; background:var(--code-bg); color:var(--code-fg); font-family:'JetBrains Mono',monospace; font-size:12px; line-height:1.6; resize:vertical;">${htmlEscape(GEN.composedPrompt)}</textarea>
            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
              <button class="btn btn-sm" onclick="genRecompose()" title="Re-run Claude on the same brief with extended thinking + critique">↻ Re-compose with Claude (fresh)</button>
              <button class="btn btn-primary btn-sm" id="gen-render-edited-btn" onclick="genRenderWithEdited()" disabled title="Render the textarea contents with gpt-image-2, skipping Claude entirely">▶ Render with this prompt (skip Claude)</button>
              <button class="btn btn-sm" onclick="genCopyPrompt()">Copy</button>
              <span style="margin-left:auto; font-size:11px; color:var(--text-3); align-self:center;">${(GEN.composedPrompt || '').length.toLocaleString()} chars</span>
            </div>
          ` : `<div class="preview-output" style="font-size:12px; color:var(--text-3); font-style:italic;">— compose first to see the prompt; you'll be able to edit it before render —</div>`}
        </div>

        ${GEN.pickReasoning ? `
        <div class="section" style="margin:0;">
          <h2 class="section-h" style="font-size:17px;">Critic's pick · vision judgment</h2>
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:14px; font-size:13px; line-height:1.6;">
            <div style="margin-bottom:10px;"><strong>Why this candidate won:</strong> ${htmlEscape(GEN.pickReasoning)}</div>
            ${GEN.pickPerCandidate.length ? '<div style="display:grid; grid-template-columns:repeat(' + GEN.pickPerCandidate.length + ', 1fr); gap:10px; margin-top:8px;">' + GEN.pickPerCandidate.map(c => `
              <div style="background:var(--surface-2); padding:10px; border-radius:6px; font-size:11.5px; line-height:1.45;">
                <div style="font-family:'JetBrains Mono',monospace; font-weight:600; margin-bottom:4px;">CANDIDATE ${c.index} · ${c.score!=null ? c.score.toFixed(1) + '/10' : '—'}</div>
                ${c.strengths && c.strengths.length ? '<div style="color:var(--L3); margin-bottom:3px;">+ ' + c.strengths.map(s=>htmlEscape(s)).join('<br>+ ') + '</div>' : ''}
                ${c.defects && c.defects.length ? '<div style="color:#b91c1c;">− ' + c.defects.map(s=>htmlEscape(s)).join('<br>− ') + '</div>' : ''}
              </div>
            `).join('') + '</div>' : ''}
          </div>
        </div>
        ` : ''}

        <div class="section" style="margin:0;">
          <h2 class="section-h" style="font-size:17px;">Generated ad <span style="font-weight:400; color:var(--text-3); font-family:'JetBrains Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">${GEN.imageCost ? '· $' + GEN.imageCost.toFixed(4) + ' · total $' + GEN.totalCost.toFixed(4) : ''}</span></h2>
          ${GEN.candidateUrls && GEN.candidateUrls.length > 1 ? `
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:14px;">
            <div style="font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:10px;">${GEN.candidateUrls.length} candidates · click to pick · Claude’s pick is highlighted</div>
            <div style="display:grid; grid-template-columns:repeat(${GEN.candidateUrls.length}, 1fr); gap:10px;">
              ${GEN.candidateUrls.map((u, i) => {
                const claudesPick = i === GEN.bestIndex;
                const yourPick = (GEN.manualPickIndex == null ? GEN.bestIndex : GEN.manualPickIndex) === i;
                return `<div style="position:relative; cursor:pointer; border:3px solid ${yourPick ? 'var(--accent)' : 'var(--border)'}; border-radius:6px; overflow:hidden; transition:transform 0.1s;" onclick="genPickCandidate(${i})">
                  <img src="${u}?t=${Date.now()}" alt="candidate ${i}" style="width:100%; aspect-ratio:1; object-fit:cover; display:block;">
                  <div style="position:absolute; top:6px; left:6px; display:flex; gap:4px;">
                    <span style="background:rgba(0,0,0,0.65); color:#fff; font-family:JetBrains Mono,monospace; font-size:10px; padding:3px 7px; border-radius:3px;">CANDIDATE ${i}</span>
                    ${claudesPick ? '<span style="background:var(--SP); color:#fff; font-family:JetBrains Mono,monospace; font-size:10px; padding:3px 7px; border-radius:3px;">CLAUDE’S PICK</span>' : ''}
                  </div>
                  ${yourPick ? '<div style="position:absolute; bottom:6px; right:6px; background:var(--accent); color:#fff; font-family:JetBrains Mono,monospace; font-size:10px; padding:3px 7px; border-radius:3px; font-weight:600;">YOUR PICK ✓</div>' : ''}
                </div>`;
              }).join('')}
            </div>
            ${GEN.manualPickIndex != null && GEN.manualPickIndex !== GEN.bestIndex ? `<div style="margin-top:10px; font-size:12px; color:var(--accent); font-style:italic;">You picked candidate ${GEN.manualPickIndex} — it has been promoted to canonical. The HD upscale is being regenerated…</div>` : ''}
          </div>
          ` : ''}

          <div id="gen-image-out" style="background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:14px; min-height:240px; display:flex; align-items:center; justify-content:center; margin-top:14px;">
            ${GEN.imageUrl ? `<img class="zoomable" src="${GEN.imageUrl}?t=${Date.now()}" data-caption="${htmlEscape(arch ? arch.code + ' generated ad' : '')}" alt="" style="max-width:100%; max-height:600px; border:1px solid var(--border); border-radius:6px;">` : '<div style="color:var(--text-3); font-style:italic; font-family:JetBrains Mono, monospace; font-size:12px;">— rendered ad will appear here —</div>'}
          </div>

          ${GEN.imageUrl ? `
          <!-- HD downloads + edit buttons -->
          <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; align-items:center;">
            <a class="btn btn-sm" href="${GEN.imageUrl}" download>Download 1080</a>
            ${GEN.hdUrls['2k'] ? `<a class="btn btn-sm" href="${GEN.hdUrls['2k']}" download>Download 2K HD</a>` : ''}
            ${GEN.hdUrls['4k'] ? `<a class="btn btn-sm" href="${GEN.hdUrls['4k']}" download>Download 4K HD</a>` : ''}
            <button class="btn btn-sm" onclick="genUpscaleHD()" title="Re-run HD upscale (4K via Real-ESRGAN if Replicate token is set, else sharp)">Re-upscale HD</button>
            <button class="btn btn-primary btn-sm" onclick="openCanvasEditor('${GEN.ad_id}', '${GEN.imageUrl}')">✎ Edit components on canvas</button>
            <span style="margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-3);">upscale: ${GEN.upscaleMethod || 'pending'}</span>
          </div>
          <div style="margin-top:6px; padding:10px 14px; background:var(--surface-2); border-radius:6px; font-size:12px; line-height:1.55; color:var(--text-2);">
            <strong>Pixel-perfect components:</strong> if gpt-image-2 has multiplied or distorted a locked component (e.g. rendered 2 houses instead of 1), open the <strong>✎ Edit components on canvas</strong> editor and drag the source component on top — it pastes the exact source pixels and lets you save a flattened version. The reference is your structural template; the editor is your pixel-perfect lever.
          </div>

          ` : ''}
        </div>

      </div>
    </div>
  `;
}

// Lightweight status line — used inline in renderGenerate and updated mid-flight from genRun.
function genStatusText() {
  const s = GEN.status;
  if (s === 'composing')  return '… ① Claude composing prompt v1 with extended thinking (~30–90s)';
  if (s === 'critiquing') return '… ② Claude critiquing &amp; refining (~20–60s)';
  if (s === 'rendering')  return '… ③ rendering ' + GEN.n_candidates + '× gpt-image-2 candidates in parallel (~60–120s)';
  if (s === 'picking')    return '… ④ Claude vision picking best (~10–20s)';
  if (s === 'upscaling')  return '… ⑤ sharp Lanczos3 upscale to 1080×1080';
  if (s === 'error')      return '<span style="color:#b91c1c;">' + htmlEscape(GEN.errorMsg) + '</span>';
  return '';
}

// Wire up reactive inputs in the Generate page (called from render() after innerHTML).
function wireGenerate() {
  const onClient = document.getElementById('gen-client');
  if (onClient) onClient.addEventListener('change', (e) => { GEN.client_id = e.target.value; GEN.attach_client_photos = []; loadGenClientPhotos(); render(); });
  const onArch = document.getElementById('gen-archetype');
  if (onArch) onArch.addEventListener('change', (e) => { GEN.archetype = e.target.value; genResetForArch(); render(); });
  const onCity = document.getElementById('gen-city');
  if (onCity) onCity.addEventListener('change', (e) => { GEN.city = e.target.value; render(); });
  for (const [id, key] of [['gen-headline','headline'],['gen-sub','sub_headline'],['gen-value','value_stack'],['gen-cta','cta'],['gen-badge','badge']]) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', (e) => { GEN.picks[key] = e.target.value; render(); });
  }
  const q = document.getElementById('gen-quality');
  if (q) q.addEventListener('change', (e) => { GEN.quality = e.target.value; });
  const ncand = document.getElementById('gen-n-cand');
  if (ncand) ncand.addEventListener('change', (e) => {
    GEN.n_candidates = parseInt(e.target.value, 10);
    const d = document.getElementById('gen-n-display'); if (d) d.textContent = String(GEN.n_candidates);
  });
  const skipc = document.getElementById('gen-skip-critique');
  if (skipc) skipc.addEventListener('change', (e) => { GEN.skip_critique = e.target.checked; });
  // Async-load client photo list if client supports it.
  loadGenClientPhotos();
}

async function loadGenClientPhotos() {
  if (!GEN.client_id) { GEN.clientPhotos = []; return; }
  try {
    const r = await fetch('/api/clients/' + encodeURIComponent(GEN.client_id) + '/photos');
    if (!r.ok) return;
    const photos = await r.json();
    GEN.clientPhotos = photos;
    const list = document.getElementById('gen-photos-list');
    if (list) {
      if (photos.length === 0) {
        list.innerHTML = '<em>No photos uploaded for this client yet.</em>';
      } else {
        list.innerHTML = photos.map(p => {
          const checked = GEN.attach_client_photos.includes(p.filename) ? 'checked' : '';
          return `<label style="display:flex; align-items:center; gap:10px; padding:8px; border:1px solid var(--border); border-radius:4px; margin-bottom:6px; cursor:pointer; background:var(--surface);">
            <input type="checkbox" ${checked} onchange="genTogglePhoto('${p.filename.replace(/'/g,"\\'")}')" style="width:auto;">
            <img src="${p.url}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
            <span style="font-family:JetBrains Mono, monospace; font-size:12px;">${htmlEscape(p.filename)}</span>
          </label>`;
        }).join('');
      }
    }
  } catch { /* silent */ }
}

function genToggleComp(key) {
  const i = GEN.component_keys.indexOf(key);
  if (i >= 0) GEN.component_keys.splice(i, 1);
  else GEN.component_keys.push(key);
  render();
}

function genTogglePhoto(filename) {
  const i = GEN.attach_client_photos.indexOf(filename);
  if (i >= 0) GEN.attach_client_photos.splice(i, 1);
  else GEN.attach_client_photos.push(filename);
}

function buildLocalBriefPreview({arch, client, city, picks, components, priceRow, photos}) {
  // Lightweight client-side preview that mirrors generate.js's buildUserMessage.
  const lines = [];
  lines.push('<span class="src-LOCKED">PACK MANIFEST:</span> single-ad generation (Layer 1 single-shot — no pack-balance enforcement)\n');
  lines.push('<span class="src-LOCKED">TARGET AD:</span>');
  lines.push('  Archetype:    <span class="src-LOCKED">' + htmlEscape(arch.code) + ' — ' + htmlEscape(arch.name) + '</span>');
  lines.push('  Funnel stage: <span class="src-LOCKED">' + htmlEscape(arch.funnel_stage || '') + '</span>\n');
  lines.push('<span class="src-CLIENT">CLIENT CONTEXT:</span>');
  lines.push('  Business:    <span class="src-CLIENT">' + htmlEscape(client.business_name) + '</span>');
  lines.push('  City:        <span class="src-CLIENT">' + htmlEscape(city) + '</span>');
  lines.push('  Brands:      <span class="src-CLIENT">' + htmlEscape((client.brands_sold||[]).join(', ')) + '</span>');
  lines.push('  Reviews:     <span class="src-CLIENT">' + (client.google_review_count || 0) + '</span>');
  lines.push('  Promo:       <span class="src-CLIENT">' + (client.current_promo_pct || 0) + '%</span>');
  lines.push('  Family/Aus owned: <span class="src-CLIENT">' + (!!client.family_owned) + ' / ' + (!!client.australian_owned) + '</span>\n');
  if (priceRow) {
    lines.push('<span class="src-CLIENT">PRICE LIBRARY:</span>');
    lines.push('  Per-week ' + htmlEscape(priceRow.perWeek||'—') + ' · Fixed ' + htmlEscape(priceRow.fixed||'—') + ' · Anchor ' + htmlEscape(priceRow.anchor||'—') + ' · Rebate ' + htmlEscape(priceRow.rebate||'—') + '\n');
  }
  lines.push('<span class="src-PICKED">PICKED VARIABLES:</span>');
  if (picks.headline)     lines.push('  Headline:    "<span class="src-PICKED">' + htmlEscape(picks.headline) + '</span>"');
  if (picks.sub_headline) lines.push('  Sub:         "<span class="src-PICKED">' + htmlEscape(picks.sub_headline) + '</span>"');
  if (picks.value_stack)  lines.push('  Value stack: <span class="src-PICKED">' + htmlEscape(picks.value_stack.length>120?picks.value_stack.substring(0,120)+'...':picks.value_stack) + '</span>');
  if (picks.cta)          lines.push('  CTA:         "<span class="src-PICKED">' + htmlEscape(picks.cta) + '</span>"');
  if (picks.badge)        lines.push('  Badge:       "<span class="src-PICKED">' + htmlEscape(picks.badge) + '</span>"');
  lines.push('');
  lines.push('<span class="src-LOCKED">ARCHETYPE-SPECIFIC RULES:</span>');
  for (const r of (arch.rules||[]).slice(0,3)) lines.push('  - ' + htmlEscape(r.length>180?r.substring(0,180)+'...':r));
  if ((arch.rules||[]).length > 3) lines.push('  ...plus ' + ((arch.rules||[]).length - 3) + ' more.');
  lines.push('');
  lines.push('<span class="src-RULE">ASSETS ATTACHED:</span>');
  lines.push('  - IMAGE 1: Reference ad for ' + htmlEscape(arch.code));
  let n = 2;
  for (const c of components) { lines.push('  - IMAGE ' + n + ': ' + htmlEscape(c.key) + ' (' + htmlEscape(c.category) + ')'); n++; }
  for (const p of (photos||[])) { lines.push('  - IMAGE ' + n + ': client photo "' + htmlEscape(p) + '"'); n++; }
  return lines.join('\n');
}

async function genRun(composeOnly) {
  const arch = genGetArch();
  const client = genGetClient();
  if (!arch || !client) {
    GEN.errorMsg = 'Pick a client and an archetype first.';
    render();
    return;
  }
  GEN.status = 'composing';
  GEN.errorMsg = '';
  GEN.composedPrompt = ''; GEN.composedPromptV1 = ''; GEN.critiqueApplied = false;
  GEN.composedCost = 0; GEN.imageUrl = ''; GEN.imageAltUrls = [];
  GEN.pickReasoning = ''; GEN.pickPerCandidate = [];
  GEN.imageCost = 0; GEN.totalCost = 0;

  const cb = document.getElementById('gen-compose-btn'); const rb = document.getElementById('gen-render-btn'); const st = document.getElementById('gen-status');
  if (cb) cb.disabled = true; if (rb) rb.disabled = true;
  if (st) st.innerHTML = genStatusText();

  const body = {
    archetype: arch.code,
    client_id: client.id,
    city: GEN.city || undefined,
    picks: { ...GEN.picks },
    component_keys: [...GEN.component_keys],
    attach_client_photos: [...GEN.attach_client_photos],
    quality: GEN.quality,
    n_candidates: GEN.n_candidates,
    skip_critique: GEN.skip_critique,
    compose_only: !!composeOnly,
  };

  // Mid-flight status updates — server pipeline is sequential so we estimate timings.
  // Compose v1 (~60s) → Critique (~40s) → Render (~80s) → Pick (~15s) → Upscale (instant).
  const tCompose = 0;
  const tCritique = composeOnly ? null : (GEN.skip_critique ? null : 60_000);
  const tRender   = composeOnly ? null : ((GEN.skip_critique ? 60_000 : 100_000));
  const tPick     = composeOnly ? null : (GEN.n_candidates > 1 ? (GEN.skip_critique ? 130_000 : 170_000) : null);
  const timers = [];
  function flipStatus(ms, st) { timers.push(setTimeout(() => { if (GEN.status !== 'done' && GEN.status !== 'error') { GEN.status = st; const e = document.getElementById('gen-status'); if (e) e.innerHTML = genStatusText(); }}, ms)); }
  if (tCritique != null) flipStatus(tCritique, 'critiquing');
  if (tRender   != null) flipStatus(tRender,   'rendering');
  if (tPick     != null) flipStatus(tPick,     'picking');

  try {
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      let detail; try { detail = await r.json(); } catch { detail = { error: r.statusText }; }
      throw new Error(detail.error || ('HTTP ' + r.status));
    }
    const result = await r.json();
    GEN.ad_id            = result.ad_id || '';
    GEN.composedPrompt   = result.prompt?.text || '';
    GEN.composedPromptV1 = result.prompt?.textV1 || '';
    GEN.critiqueApplied  = !!result.prompt?.critiqueApplied;
    GEN.composedCost     = result.prompt?.costUsd || 0;
    GEN.imageUrl         = result.image?.url || '';
    GEN.imageAltUrls     = result.image?.altUrls || [];
    GEN.candidateUrls    = result.image?.candidateUrls || [];
    GEN.bestIndex        = result.image?.bestIndex || 0;
    GEN.manualPickIndex  = null;
    GEN.hdUrls           = result.image?.hdUrls || {};
    GEN.upscaleMethod    = result.image?.upscaleMethod || '';
    GEN.imageCost        = result.image?.costUsd || 0;
    GEN.pickReasoning    = result.pickBest?.reasoning || '';
    GEN.pickPerCandidate = result.pickBest?.perCandidate || [];
    GEN.totalCost        = result.totalCostUsd || 0;
    GEN.rating           = null;  // reset for new ad
    GEN.status = 'done';
    if (result.image?.url) { ADS = await api.ads.list(); }
  } catch (err) {
    GEN.errorMsg = err.message || 'Generation failed';
    GEN.status = 'error';
    console.error(err);
  } finally {
    timers.forEach(clearTimeout);
    render();
  }
}

window.genToggleComp = genToggleComp;
window.genTogglePhoto = genTogglePhoto;
window.genRun = genRun;

// ── Manual best-of-N picker ────────────────────────────────────────────────
async function genPickCandidate(i) {
  if (!GEN.ad_id || !GEN.candidateUrls[i]) return;
  GEN.manualPickIndex = i;
  render();  // immediate visual feedback
  try {
    const r = await fetch('/api/edits/pick/' + encodeURIComponent(GEN.ad_id), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidate_url: GEN.candidateUrls[i] }),
    });
    if (!r.ok) throw new Error('pick failed: HTTP ' + r.status);
    const j = await r.json();
    // Re-run HD upscale on the newly canonical candidate.
    const u = await fetch('/api/edits/upscale/' + encodeURIComponent(GEN.ad_id), { method: 'POST' });
    if (u.ok) {
      const uj = await u.json();
      GEN.hdUrls = uj.urls || GEN.hdUrls;
      GEN.upscaleMethod = uj.method || GEN.upscaleMethod;
    }
    GEN.imageUrl = j.url + '?t=' + Date.now();  // bust cache
    render();
  } catch (err) {
    GEN.errorMsg = err.message; GEN.status = 'error'; render();
  }
}
window.genPickCandidate = genPickCandidate;

// ── Editable prompt handlers ───────────────────────────────────────────────
// You can either re-compose with Claude, OR edit the textarea and render
// directly with gpt-image-2 (skipping Claude). The textarea is the source of
// truth for what gets sent to gpt-image-2.

function genCopyPrompt() {
  const ta = document.getElementById('gen-prompt-edit');
  if (!ta) return;
  navigator.clipboard.writeText(ta.value).then(() => {
    const original = ta.style.borderColor;
    ta.style.borderColor = 'var(--L3)';
    setTimeout(() => { ta.style.borderColor = original; }, 600);
  });
}
window.genCopyPrompt = genCopyPrompt;

async function genRecompose() {
  // Re-runs the full Claude compose + critique pass with the same selections.
  // Discards any operator edits to the textarea.
  await genRun(true);  // compose_only=true; operator can then click Render
}
window.genRecompose = genRecompose;

async function genRenderWithEdited() {
  // Sends the current textarea contents to gpt-image-2 directly (no Claude).
  const ta = document.getElementById('gen-prompt-edit');
  if (!ta || !ta.value.trim()) { alert('Prompt is empty.'); return; }
  const arch = genGetArch();
  const client = genGetClient();
  if (!arch || !client) { alert('Pick a client and an archetype first.'); return; }

  GEN.status = 'rendering';
  GEN.errorMsg = '';
  GEN.composedPrompt = ta.value;
  GEN.composedCost = 0;       // operator-edited — no Claude cost this run
  GEN.imageUrl = ''; GEN.imageAltUrls = []; GEN.candidateUrls = [];
  GEN.pickReasoning = ''; GEN.pickPerCandidate = [];

  const cb = document.getElementById('gen-compose-btn');
  const rb = document.getElementById('gen-render-btn');
  const eb = document.getElementById('gen-render-edited-btn');
  if (cb) cb.disabled = true; if (rb) rb.disabled = true; if (eb) eb.disabled = true;
  const st = document.getElementById('gen-status');
  if (st) st.innerHTML = '… rendering ' + GEN.n_candidates + '× gpt-image-2 candidates with your edited prompt';

  try {
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        archetype: arch.code,
        client_id: client.id,
        city: GEN.city || undefined,
        picks: { ...GEN.picks },
        component_keys: [...GEN.component_keys],
        attach_client_photos: [...GEN.attach_client_photos],
        quality: GEN.quality,
        n_candidates: GEN.n_candidates,
        prompt_override: ta.value,  // ← bypasses Claude entirely
      }),
    });
    if (!r.ok) {
      let detail; try { detail = await r.json(); } catch { detail = { error: r.statusText }; }
      throw new Error(detail.error || ('HTTP ' + r.status));
    }
    const result = await r.json();
    GEN.ad_id            = result.ad_id || '';
    GEN.composedPrompt   = result.prompt?.text || ta.value;
    GEN.composedPromptV1 = result.prompt?.textV1 || '';
    GEN.critiqueApplied  = false;
    GEN.composedCost     = result.prompt?.costUsd || 0;
    GEN.imageUrl         = result.image?.url || '';
    GEN.imageAltUrls     = result.image?.altUrls || [];
    GEN.candidateUrls    = result.image?.candidateUrls || [];
    GEN.bestIndex        = result.image?.bestIndex || 0;
    GEN.manualPickIndex  = null;
    GEN.hdUrls           = result.image?.hdUrls || {};
    GEN.upscaleMethod    = result.image?.upscaleMethod || '';
    GEN.imageCost        = result.image?.costUsd || 0;
    GEN.pickReasoning    = result.pickBest?.reasoning || '';
    GEN.pickPerCandidate = result.pickBest?.perCandidate || [];
    GEN.totalCost        = result.totalCostUsd || 0;
    GEN.promptDirty      = false;
    GEN.status = 'done';
    if (result.image?.url) { ADS = await api.ads.list(); }
  } catch (err) {
    GEN.errorMsg = err.message || 'Render failed';
    GEN.status = 'error';
    console.error(err);
  } finally {
    render();
  }
}
window.genRenderWithEdited = genRenderWithEdited;

// ── Standalone HD re-upscale ──────────────────────────────────────────────
async function genUpscaleHD() {
  if (!GEN.ad_id) return;
  const status = document.getElementById('gen-status');
  if (status) status.innerHTML = '… running HD upscale (Real-ESRGAN if Replicate; else sharp)';
  try {
    const r = await fetch('/api/edits/upscale/' + encodeURIComponent(GEN.ad_id), { method: 'POST' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    GEN.hdUrls = j.urls || GEN.hdUrls;
    GEN.upscaleMethod = j.method || GEN.upscaleMethod;
    render();
  } catch (err) {
    GEN.errorMsg = err.message; GEN.status = 'error'; render();
  }
}
window.genUpscaleHD = genUpscaleHD;

// ── Canvas editor (Fabric.js) — drag/replace/add components on top of the AI image ──
function openCanvasEditor(adId, imageUrl) {
  const components = STATE.components.filter(c => c.uploadedImage || c.imagePath);
  const cats = [...new Set(components.map(c => c.category))].sort();
  showModal(`
    <div class="modal-header">
      <div>
        <h3 class="modal-title">✎ Canvas editor — ${adId}</h3>
        <div class="modal-subtitle">Drag, resize, replace, or add components on top of the AI image. Save flattens to a new PNG (replaces canonical; original stays as alt).</div>
      </div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body" style="padding:0; display:grid; grid-template-columns: 1fr 280px; height:75vh;">
      <div style="background:#1a1a17; display:flex; align-items:center; justify-content:center; padding:20px; overflow:auto;">
        <canvas id="ce-canvas" style="background:#000; box-shadow:0 8px 30px rgba(0,0,0,0.5);"></canvas>
      </div>
      <div style="background:var(--surface-2); padding:14px; overflow-y:auto; border-left:1px solid var(--border);">
        <div class="form-section-h" style="grid-column:initial; margin:0 0 10px;">Add component</div>
        <select id="ce-cat" style="width:100%; padding:7px 9px; border:1px solid var(--border-2); border-radius:4px; font-size:13px; background:var(--bg); margin-bottom:8px;">
          ${cats.map(c => `<option value="${htmlEscape(c)}">${htmlEscape(c)}</option>`).join('')}
        </select>
        <div id="ce-comp-grid" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px; margin-bottom:14px; max-height:240px; overflow-y:auto;"></div>
        <div class="form-section-h" style="grid-column:initial; margin:14px 0 10px;">Layers</div>
        <div id="ce-layers" style="font-size:12px; line-height:1.6;">Click image inside the canvas to select.</div>
        <div style="margin-top:14px; padding-top:14px; border-top:1px solid var(--border);">
          <button class="btn btn-sm" onclick="ceBringForward()" style="width:100%; margin-bottom:6px;">↑ Bring forward</button>
          <button class="btn btn-sm" onclick="ceSendBackward()" style="width:100%; margin-bottom:6px;">↓ Send backward</button>
          <button class="btn btn-sm btn-danger" onclick="ceDeleteSelected()" style="width:100%;">🗑 Delete selected</button>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="ceSaveFlattened('${adId}')">Save edited PNG</button>
    </div>
  `, { large: true });

  // Initialise Fabric (loaded via CDN in index.html). Wait for it to be available.
  function init() {
    if (typeof fabric === 'undefined') { setTimeout(init, 100); return; }
    const cnv = new fabric.Canvas('ce-canvas', { width: 720, height: 720, backgroundColor: '#000', preserveObjectStacking: true });
    window.__ce = { cnv, components };
    fabric.Image.fromURL(imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + Date.now(), (img) => {
      img.scaleToWidth(720);
      img.set({ selectable: false, evented: false, originX: 'left', originY: 'top' });
      cnv.add(img);
      cnv.sendToBack(img);
      cnv.renderAll();
    }, { crossOrigin: 'anonymous' });
    cnv.on('selection:created', updateLayersList);
    cnv.on('selection:updated', updateLayersList);
    cnv.on('object:added', updateLayersList);
    cnv.on('object:removed', updateLayersList);
    rebuildCompGrid();
    document.getElementById('ce-cat').addEventListener('change', rebuildCompGrid);
  }
  function rebuildCompGrid() {
    const cat = document.getElementById('ce-cat').value;
    const list = window.__ce.components.filter(c => c.category === cat);
    const grid = document.getElementById('ce-comp-grid');
    grid.innerHTML = list.map(c => `<div onclick="ceAddComponent('${c.key.replace(/'/g,"\\'")}')" title="${htmlEscape(c.key)}" style="cursor:pointer; border:1px solid var(--border); border-radius:4px; padding:4px; background:#fff; aspect-ratio:1; display:flex; align-items:center; justify-content:center;">
      <img src="${c.uploadedImage || c.imagePath}" style="max-width:100%; max-height:100%; object-fit:contain;">
    </div>`).join('');
  }
  function updateLayersList() {
    const objs = window.__ce.cnv.getObjects().filter(o => o.selectable !== false);
    const ll = document.getElementById('ce-layers');
    if (!ll) return;
    if (objs.length === 0) { ll.innerHTML = '<em style="color:var(--text-3);">No editable layers yet — pick a component on the right to add one.</em>'; return; }
    ll.innerHTML = objs.map((o, i) => `<div style="padding:6px 8px; background:var(--surface); border:1px solid var(--border); border-radius:4px; margin-bottom:4px; font-family:JetBrains Mono,monospace;">${o.__compKey || ('layer ' + (i+1))}</div>`).join('');
  }
  setTimeout(init, 50);
}
window.openCanvasEditor = openCanvasEditor;

function ceAddComponent(compKey) {
  const ce = window.__ce; if (!ce) return;
  const c = ce.components.find(x => x.key === compKey);
  if (!c) return;
  fabric.Image.fromURL(c.uploadedImage || c.imagePath, (img) => {
    const maxDim = 240;
    const scale = Math.min(maxDim / img.width, maxDim / img.height);
    img.set({ left: 60 + Math.random()*200, top: 60 + Math.random()*200, scaleX: scale, scaleY: scale, cornerColor: '#b8420a', cornerStrokeColor: '#fff', borderColor: '#b8420a', transparentCorners: false });
    img.__compKey = c.key;
    ce.cnv.add(img);
    ce.cnv.setActiveObject(img);
    ce.cnv.renderAll();
  }, { crossOrigin: 'anonymous' });
}
window.ceAddComponent = ceAddComponent;

function ceBringForward() { const ce = window.__ce; const o = ce?.cnv.getActiveObject(); if (o) ce.cnv.bringForward(o); ce.cnv.renderAll(); }
function ceSendBackward() { const ce = window.__ce; const o = ce?.cnv.getActiveObject(); if (o) ce.cnv.sendBackwards(o); ce.cnv.renderAll(); }
function ceDeleteSelected() { const ce = window.__ce; const o = ce?.cnv.getActiveObject(); if (o && o.selectable !== false) { ce.cnv.remove(o); ce.cnv.renderAll(); } }
window.ceBringForward = ceBringForward;
window.ceSendBackward = ceSendBackward;
window.ceDeleteSelected = ceDeleteSelected;

async function ceSaveFlattened(adId) {
  const ce = window.__ce; if (!ce) return;
  ce.cnv.discardActiveObject().renderAll();
  // Render at 1080 by upscaling the canvas (sharp-equivalent on the server happens via download too).
  const dataUrl = ce.cnv.toDataURL({ format: 'png', multiplier: 1080 / 720 });
  const blob = await (await fetch(dataUrl)).blob();
  const fd = new FormData();
  fd.append('image', new File([blob], 'edited.png', { type: 'image/png' }));
  try {
    const r = await fetch('/api/edits/' + encodeURIComponent(adId), { method: 'POST', body: fd });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    GEN.imageUrl = j.url + '?t=' + Date.now();
    closeModal();
    render();
  } catch (err) {
    alert('Save failed: ' + err.message);
  }
}
window.ceSaveFlattened = ceSaveFlattened;

// ============================================================
// SECTION 8: GENERATE PACK — Layer 1 (pack-manifest engine + sequential firing)
// Pick a client → see manifest of all 9-10 ads that will fire → confirm →
// loops through /api/generate one ad at a time, showing live progress.
// ============================================================
const PACK = {
  client_id: '',
  manifest: null,        // {pack_id, entries:[...], skipped, pack_balance}
  status: 'idle',        // idle | building | ready | running | done | error
  progress: { current: 0, total: 0, current_archetype: '', cost_so_far: 0 },
  results: [],           // [{archetype, ad_id, image_url, error}]
  errorMsg: '',
};

function renderPacks() {
  return `
    <div class="page-header">
      <div class="page-eyebrow">Operations · Generate Pack (Layer 1)</div>
      <h1 class="page-title">Generate Pack</h1>
      <p class="page-intro">Pick a client → Layer 1 builds a pack manifest (decides which archetypes fire, picks variable inputs deterministically, enforces HR06 max-one-fixed-price, A10/A6 gating) → loops through them sequentially through the full premium pipeline. The future automation entry point — when you onboard a new client, you click here and walk away.</p>
    </div>

    <div class="form-grid" style="grid-template-columns: 1fr; padding:18px; gap:14px; max-width:520px;">
      <div class="form-section-h">Target client</div>
      <div class="form-group">
        <label>Client</label>
        <select id="pack-client">
          <option value="">— pick a client —</option>
          ${CLIENTS.map(c => `<option value="${c.id}" ${c.id===PACK.client_id?'selected':''}>${htmlEscape(c.business_name)} · ${htmlEscape(c.city)}</option>`).join('')}
        </select>
        <div class="help-text">Client must already exist (Clients → + New client).</div>
      </div>
      <div class="form-group" style="display:flex; gap:10px;">
        <button class="btn" id="pack-build-btn" onclick="packBuild()" ${!PACK.client_id?'disabled':''}>1. Build manifest</button>
        <button class="btn btn-primary" id="pack-run-btn" onclick="packRun()" ${PACK.status!=='ready' ? 'disabled' : ''}>2. Generate all (${PACK.manifest?.entries.length || 0} ads)</button>
      </div>
      <div class="form-group">
        <span id="pack-status" style="font-size:12px; color:var(--text-3);">${packStatusText()}</span>
      </div>
    </div>

    ${PACK.manifest ? renderPackManifestTable() : ''}

    ${PACK.results.length ? renderPackResults() : ''}
  `;
}

function packStatusText() {
  if (PACK.status === 'building') return '… building manifest';
  if (PACK.status === 'ready')    return '✓ manifest ready · click Generate to fire';
  if (PACK.status === 'running')  return `… generating ad ${PACK.progress.current + 1}/${PACK.progress.total} (${PACK.progress.current_archetype}) · spent $${PACK.progress.cost_so_far.toFixed(2)}`;
  if (PACK.status === 'done')     return `✓ done · ${PACK.results.filter(r=>!r.error).length}/${PACK.results.length} succeeded · total $${PACK.progress.cost_so_far.toFixed(2)}`;
  if (PACK.status === 'error')    return `<span style="color:#b91c1c;">${htmlEscape(PACK.errorMsg)}</span>`;
  return '';
}

function renderPackManifestTable() {
  const m = PACK.manifest;
  const skippedNotes = Object.entries(m.skipped || {}).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join(' · ');
  return `
    <div class="section">
      <h2 class="section-h" style="font-size:18px;">Pack manifest <span style="font-weight:400; color:var(--text-3); font-family:'JetBrains Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">${m.pack_id}</span></h2>
      <div class="section-flow">${m.entries.length} ads will fire · fixed-price slot: ${m.pack_balance.fixed_price_archetype || 'none'} · ${skippedNotes ? 'skipped: ' + skippedNotes : 'no archetypes skipped'}</div>
      <table class="clients-table">
        <thead><tr><th>#</th><th>Archetype</th><th>Funnel</th><th>Price</th><th>Headline (picked)</th><th>Components</th></tr></thead>
        <tbody>
          ${m.entries.map((e, i) => `
            <tr>
              <td style="font-family:JetBrains Mono,monospace; color:var(--text-3);">${i + 1}</td>
              <td><strong>${e.archetype}</strong> ${htmlEscape(e.archetype_name || '')}</td>
              <td><span class="pill">${htmlEscape(e.funnel_stage || '')}</span></td>
              <td><span class="pill ${e.price_treatment === 'fixed' ? 'pill-amber' : 'pill-green'}">${e.price_treatment.replace('_',' ')}</span></td>
              <td style="font-size:12px; max-width:340px;">${htmlEscape((e.picks?.headline || '').substring(0, 80))}${(e.picks?.headline || '').length > 80 ? '…' : ''}</td>
              <td style="font-family:JetBrains Mono,monospace; font-size:11px; color:var(--text-3);">${e.component_keys.length} attached</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderPackResults() {
  return `
    <div class="section">
      <h2 class="section-h" style="font-size:18px;">Generated ads</h2>
      <div class="ad-grid">
        ${PACK.results.map(r => `
          <div class="ad-card">
            <div class="ad-thumb-output" style="${r.image_url ? `background-image:url(${r.image_url}?t=${Date.now()}); background-size:cover; background-position:center; aspect-ratio:1;` : ''}">
              ${r.image_url ? '' : `<div class="ph-icon">${r.error ? '✗' : '⏳'}</div><div class="ph-arch">${r.archetype}</div><div class="ph-headline" style="font-size:11px;">${r.error ? htmlEscape(r.error.slice(0, 100)) : 'pending…'}</div>`}
            </div>
            <div class="ad-card-body">
              <div style="font-weight:600; font-size:13px; margin-bottom:3px">${r.archetype} ${r.image_url ? '✓' : ''}</div>
              <div class="ad-card-meta">${r.cost_usd ? '$' + r.cost_usd.toFixed(3) : ''} · ${r.elapsed_s ? r.elapsed_s + 's' : ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function wirePacks() {
  const sel = document.getElementById('pack-client');
  if (sel) sel.addEventListener('change', (e) => { PACK.client_id = e.target.value; PACK.manifest = null; PACK.results = []; PACK.status = 'idle'; render(); });
}

async function packBuild() {
  if (!PACK.client_id) return;
  PACK.status = 'building'; PACK.errorMsg = ''; render();
  try {
    const r = await fetch('/api/packs', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ client_id: PACK.client_id }) });
    if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error || ('HTTP ' + r.status)); }
    PACK.manifest = await r.json();
    PACK.status = 'ready';
    PACK.progress = { current: 0, total: PACK.manifest.entries.length, current_archetype: '', cost_so_far: 0 };
  } catch (err) { PACK.status = 'error'; PACK.errorMsg = err.message; }
  render();
}
window.packBuild = packBuild;

async function packRun() {
  if (!PACK.manifest) return;
  PACK.status = 'running'; PACK.results = []; render();
  for (let i = 0; i < PACK.manifest.entries.length; i++) {
    const e = PACK.manifest.entries[i];
    PACK.progress.current = i;
    PACK.progress.current_archetype = e.archetype;
    render();
    const t0 = Date.now();
    try {
      const r = await fetch('/api/generate', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({
        archetype: e.archetype, client_id: e.client_id, picks: e.picks, component_keys: e.component_keys, attach_client_photos: e.attach_client_photos || [], quality: e.quality, n_candidates: e.n_candidates,
      }) });
      if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error || ('HTTP ' + r.status)); }
      const result = await r.json();
      // Stamp pack_id onto the ad record (best-effort).
      await fetch('/api/review/' + result.ad_id, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ status: 'pending', notes: 'pack_id=' + PACK.manifest.pack_id }) }).catch(()=>{});
      const elapsed_s = Math.round((Date.now() - t0) / 1000);
      PACK.results.push({ archetype: e.archetype, ad_id: result.ad_id, image_url: result.image?.url, cost_usd: result.totalCostUsd, elapsed_s });
      PACK.progress.cost_so_far += (result.totalCostUsd || 0);
    } catch (err) {
      PACK.results.push({ archetype: e.archetype, error: err.message });
    }
    render();
  }
  PACK.status = 'done';
  ADS = await api.ads.list();
  render();
}
window.packRun = packRun;

// ============================================================
// SECTION 9: REVIEW QUEUE — pending/approved/rejected states
// ============================================================
const REVIEW = { tab: 'pending', items: [], loading: false };

function renderReview() {
  return `
    <div class="page-header">
      <div class="page-eyebrow">Operations · Review Queue</div>
      <h1 class="page-title">Review Queue</h1>
      <p class="page-intro">Generated ads land here for approval before delivery to clients. Approve = ready to ship. Reject = discarded; can regenerate.</p>
    </div>
    <div class="client-tabs">
      <div class="client-tab ${REVIEW.tab==='pending' ?'active':''}" onclick="setReviewTab('pending')">Pending ${REVIEW.tab==='pending' && REVIEW.items.length ? '· ' + REVIEW.items.length : ''}</div>
      <div class="client-tab ${REVIEW.tab==='approved'?'active':''}" onclick="setReviewTab('approved')">Approved</div>
      <div class="client-tab ${REVIEW.tab==='rejected'?'active':''}" onclick="setReviewTab('rejected')">Rejected</div>
    </div>
    <div id="review-grid">${REVIEW.loading ? '<div class="empty-state">Loading…</div>' : renderReviewGrid()}</div>
  `;
}

function renderReviewGrid() {
  if (REVIEW.items.length === 0) {
    return '<div class="empty-state">No ads with status <strong>' + REVIEW.tab + '</strong>.</div>';
  }
  return `
    <div class="ad-grid">
      ${REVIEW.items.map(a => {
        const arch = STATE.archetypes.find(x => x.code === a.archetype) || {};
        const client = CLIENTS.find(c => c.id === a.client_id) || {};
        return `
          <div class="ad-card" style="cursor:default;">
            <div class="ad-thumb-output" style="${a.image_url ? `background-image:url(${a.image_url}?t=${Date.now()}); background-size:cover; background-position:center;` : ''} aspect-ratio:1;">
              ${a.image_url ? '' : `<div class="ph-icon">▢</div><div class="ph-arch">${a.archetype}</div>`}
            </div>
            <div class="ad-card-body">
              <div style="font-weight:600; font-size:13px;">${a.archetype} — ${htmlEscape(arch.name||'')}</div>
              <div class="ad-card-meta" style="margin-top:3px;">${htmlEscape(client.business_name||a.client_id||'')} · ${htmlEscape(a.city||'')} · ${htmlEscape(a.created||'')}</div>
              <div class="ad-card-actions" style="border-top:1px solid var(--surface-2); padding-top:8px; margin-top:8px;">
                ${REVIEW.tab !== 'approved' ? `<button class="btn btn-sm btn-primary" onclick="reviewSet('${a.id}','approved')">Approve</button>` : ''}
                ${REVIEW.tab !== 'rejected' ? `<button class="btn btn-sm btn-danger" onclick="reviewSet('${a.id}','rejected')">Reject</button>` : ''}
                ${REVIEW.tab !== 'pending' ? `<button class="btn btn-sm" onclick="reviewSet('${a.id}','pending')">Reset</button>` : ''}
                <button class="btn btn-sm" onclick="openAdDetail('${a.id}')">View</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function setReviewTab(tab) { REVIEW.tab = tab; loadReview(); }
window.setReviewTab = setReviewTab;

async function loadReview() {
  REVIEW.loading = true; render();
  try {
    const r = await fetch('/api/review?status=' + REVIEW.tab);
    REVIEW.items = await r.json();
  } catch { REVIEW.items = []; }
  REVIEW.loading = false; render();
}

function wireReview() { loadReview(); }

async function reviewSet(adId, status) {
  try {
    await fetch('/api/review/' + encodeURIComponent(adId), { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ status }) });
    loadReview();
  } catch (err) { alert('Failed: ' + err.message); }
}
window.reviewSet = reviewSet;
