/* =============================================
   SafeNet PH — Frontend Application Logic
   ============================================= */

   const API = '';

   // ── STATE ──────────────────────────────────────
   let currentPage = 'dashboard';
   let locations = [];
   let agenciesCache = [];
   let graphData = { nodes: [], links: [] };
   let graphDrag = null;
   let graphAnimFrame = null;
   let mapInstance = null;
   
   // ── NAV ────────────────────────────────────────
   function navigate(page) {
     document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
     document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
   
     document.getElementById(`page-${page}`).classList.add('active');
     document.querySelector(`[data-page="${page}"]`).classList.add('active');
   
     const titles = {
       dashboard: ['Dashboard',   'Overview / Statistics'],
       incidents: ['Incidents',   'Manage / Search Incidents'],
       persons:   ['Persons',     'Manage / Search Persons'],
       locations: ['Locations',   'Manage Locations'],
       agencies:  ['Agencies',    'Manage Agencies'],
       map:       ['Map View',    'Incident Map — Iligan City'],
       link:      ['Link Person', 'Connect Person to Incident'],
       graph:     ['Graph View',  'Relationship Network']
     };
   
     document.getElementById('pageTitle').textContent      = titles[page][0];
     document.getElementById('pageBreadcrumb').textContent = titles[page][1];
   
     const showSearch = ['incidents','persons','locations','agencies'].includes(page);
     document.getElementById('searchWrap').style.display = showSearch ? 'block' : 'none';
     document.getElementById('searchInput').value = '';
   
     currentPage = page;
   
     if (page === 'dashboard')  loadDashboard();
     if (page === 'incidents')  loadIncidents();
     if (page === 'persons')    loadPersons();
     if (page === 'locations')  loadLocations();
     if (page === 'agencies')   loadAgencies();
     if (page === 'map')        loadMap();
     if (page === 'link')       loadLinkPage();
     if (page === 'graph')      loadGraph();
   }
   
   // ── SEARCH ─────────────────────────────────────
   let searchTimer = null;
   function handleSearch() {
     clearTimeout(searchTimer);
     searchTimer = setTimeout(() => {
       if (currentPage === 'incidents') loadIncidents();
       if (currentPage === 'persons')   loadPersons();
       if (currentPage === 'locations') loadLocations();
       if (currentPage === 'agencies')  loadAgencies();
     }, 300);
   }
   
   // ── TOAST ──────────────────────────────────────
   function toast(msg, type = 'ok') {
     const el = document.getElementById('toast');
     el.textContent = msg;
     el.className = 'toast show' + (type === 'error' ? ' error' : '');
     setTimeout(() => el.className = 'toast', 2800);
   }
   
   // ── API HELPERS ────────────────────────────────
   async function apiFetch(path, opts = {}) {
     const res = await fetch(API + path, {
       headers: { 'Content-Type': 'application/json' },
       ...opts
     });
     if (!res.ok) {
       const err = await res.json().catch(() => ({ error: res.statusText }));
       throw new Error(err.error || 'Request failed');
     }
     return res.json();
   }
   
   // ── DASHBOARD ──────────────────────────────────
   async function loadDashboard() {
     try {
       const s = await apiFetch('/api/stats');
   
       document.getElementById('statGrid').innerHTML = `
         <div class="stat-card" style="animation-delay:.05s">
           <div class="stat-label">Total Incidents</div>
           <div class="stat-value">${s.totals.incidents}</div>
           <div class="stat-icon">◈</div>
         </div>
         <div class="stat-card red" style="animation-delay:.1s">
           <div class="stat-label">Persons on Record</div>
           <div class="stat-value">${s.totals.persons}</div>
           <div class="stat-icon">◉</div>
         </div>
         <div class="stat-card green" style="animation-delay:.15s">
           <div class="stat-label">Locations</div>
           <div class="stat-value">${s.totals.locations}</div>
           <div class="stat-icon">◎</div>
         </div>
         <div class="stat-card yellow" style="animation-delay:.2s">
           <div class="stat-label">Agencies</div>
           <div class="stat-value">${s.totals.agencies}</div>
           <div class="stat-icon">⬡</div>
         </div>
       `;
   
       renderBarChart('chartByType', s.byType, 'accent');
       renderBarChart('chartBySeverity', s.bySeverity, 'severity');
       renderBarChart('chartByStatus', s.byStatus, 'status');
   
       document.getElementById('hotspotList').innerHTML = s.hotspots.length
         ? s.hotspots.map(h => `
             <div class="hotspot-item">
               <span class="hotspot-name">📍 ${h.location}</span>
               <span class="hotspot-count">${h.count} incident${h.count !== 1 ? 's' : ''}</span>
             </div>`).join('')
         : '<div class="empty-state">No hotspot data yet</div>';
   
       document.getElementById('recentList').innerHTML = s.recentIncidents.length
         ? s.recentIncidents.map(i => `
             <div class="recent-item">
               <div>
                 <div class="recent-title">${i.title}</div>
                 <div class="recent-meta">${i.location || 'Unknown location'} &nbsp;·&nbsp; ${badgeSeverity(i.severity)}</div>
               </div>
               <span class="recent-date">${i.date}</span>
             </div>`).join('')
         : '<div class="empty-state">No recent incidents</div>';
   
     } catch (e) {
       toast('Failed to load dashboard: ' + e.message, 'error');
     }
   }
   
   function renderBarChart(containerId, data, colorMode) {
     if (!data || !data.length) {
       document.getElementById(containerId).innerHTML = '<div class="empty-state">No data</div>';
       return;
     }
     const max = Math.max(...data.map(d => d.count));
     const colorMap = {
       severity: { Critical:'red', High:'yellow', Medium:'', Low:'green' },
       status:   { Open:'red', 'Under Investigation':'yellow', Resolved:'green', Closed:'' }
     };
     document.getElementById(containerId).innerHTML = data.map(d => {
       const pct = max > 0 ? Math.round((d.count / max) * 100) : 0;
       let cls = '';
       if (colorMode === 'severity' || colorMode === 'status') {
         cls = (colorMap[colorMode][d.label] || '');
       }
       return `
         <div class="bar-row">
           <div class="bar-label" title="${d.label}">${d.label}</div>
           <div class="bar-track">
             <div class="bar-fill ${cls}" style="width:${pct}%"></div>
           </div>
           <div class="bar-count">${d.count}</div>
         </div>`;
     }).join('');
   }
   
   function badgeSeverity(s) {
     return `<span class="badge badge-${s}">${s}</span>`;
   }
   
   // ── INCIDENTS ──────────────────────────────────
   async function loadIncidents() {
     const q = document.getElementById('searchInput').value.trim();
     const body = document.getElementById('incidentBody');
     body.innerHTML = '<tr><td colspan="7" class="loading">LOADING...</td></tr>';
     try {
       const data = await apiFetch(`/api/incidents${q ? '?q=' + encodeURIComponent(q) : ''}`);
       if (!data.length) {
         body.innerHTML = '<tr><td colspan="7" class="empty-state">No incidents found</td></tr>';
         return;
       }
       body.innerHTML = data.map(i => `
         <tr>
           <td>${i.title}</td>
           <td>${i.type}</td>
           <td>${badgeSeverity(i.severity)}</td>
           <td style="font-family:var(--font-mono);font-size:12px">${i.date}</td>
           <td><span class="badge badge-${i.status.replace(/ /g,'-')}">${i.status}</span></td>
           <td style="color:var(--text-secondary)">${i.locations?.join(', ') || '—'}</td>
           <td>
             <div class="action-btns">
               <button class="btn btn-edit" onclick="editIncident('${i.id}')">Edit</button>
               <button class="btn btn-danger" onclick="deleteIncident('${i.id}')">Delete</button>
             </div>
           </td>
         </tr>`).join('');
     } catch (e) {
       toast('Failed to load incidents', 'error');
     }
   }
   
   async function editIncident(id) {
    try {
      const i = await apiFetch(`/api/incidents/${id}`);
      document.getElementById('incidentId').value       = i.id;
      document.getElementById('incidentTitle').value    = i.title;
      document.getElementById('incidentType').value     = i.type;
      document.getElementById('incidentSeverity').value = i.severity;
      document.getElementById('incidentDate').value     = i.date;
      document.getElementById('incidentStatus').value   = i.status;
      document.getElementById('incidentModalTitle').textContent = 'Edit Incident';
      await openModal('incident');
      // Pre-select existing location and agency
      if (i.locationId) document.getElementById('incidentLocation').value = i.locationId;
      if (i.agencyId)   document.getElementById('incidentAgency').value   = i.agencyId;
    } catch (e) { toast('Could not load incident', 'error'); }
  }
   
   async function saveIncident() {
     const id   = document.getElementById('incidentId').value;
     const body = {
       title:      document.getElementById('incidentTitle').value.trim(),
       type:       document.getElementById('incidentType').value,
       severity:   document.getElementById('incidentSeverity').value,
       date:       document.getElementById('incidentDate').value,
       status:     document.getElementById('incidentStatus').value,
       locationId: document.getElementById('incidentLocation').value,
       agencyId:   document.getElementById('incidentAgency').value
     };
     if (!body.title || !body.date) { toast('Title and date are required', 'error'); return; }
     try {
       if (id) {
         await apiFetch(`/api/incidents/${id}`, { method:'PUT', body: JSON.stringify(body) });
         toast('✓ Incident updated');
       } else {
         await apiFetch('/api/incidents', { method:'POST', body: JSON.stringify(body) });
         toast('✓ Incident created');
       }
       closeModal();
       loadIncidents();
     } catch (e) { toast('Save failed: ' + e.message, 'error'); }
   }
   
   async function deleteIncident(id) {
     if (!confirm('Delete this incident and all its relationships?')) return;
     try {
       await apiFetch(`/api/incidents/${id}`, { method:'DELETE' });
       toast('✓ Incident deleted');
       loadIncidents();
       if (currentPage === 'dashboard') loadDashboard();
     } catch (e) { toast('Delete failed', 'error'); }
   }
   
   // ── PERSONS ────────────────────────────────────
   async function loadPersons() {
     const q = document.getElementById('searchInput').value.trim();
     const body = document.getElementById('personBody');
     body.innerHTML = '<tr><td colspan="6" class="loading">LOADING...</td></tr>';
     try {
       const data = await apiFetch(`/api/persons${q ? '?q=' + encodeURIComponent(q) : ''}`);
       if (!data.length) {
         body.innerHTML = '<tr><td colspan="6" class="empty-state">No persons found</td></tr>';
         return;
       }
       body.innerHTML = data.map(p => `
         <tr>
           <td>${p.name}</td>
           <td><span class="badge badge-${p.role}">${p.role}</span></td>
           <td style="font-family:var(--font-mono)">${p.age}</td>
           <td><span class="badge badge-${p.status.replace(/ /g,'-')}">${p.status}</span></td>
           <td style="color:var(--text-secondary);font-size:12px">${p.incidents?.length ? p.incidents.slice(0,2).join('; ') + (p.incidents.length > 2 ? '…' : '') : '—'}</td>
           <td>
             <div class="action-btns">
               <button class="btn btn-edit" onclick="editPerson('${p.id}')">Edit</button>
               <button class="btn btn-danger" onclick="deletePerson('${p.id}')">Delete</button>
             </div>
           </td>
         </tr>`).join('');
     } catch (e) { toast('Failed to load persons', 'error'); }
   }
   
   async function editPerson(id) {
     try {
       const p = await apiFetch(`/api/persons/${id}`);
       document.getElementById('personId').value     = p.id;
       document.getElementById('personName').value   = p.name;
       document.getElementById('personRole').value   = p.role;
       document.getElementById('personAge').value    = p.age;
       document.getElementById('personStatus').value = p.status;
       document.getElementById('personModalTitle').textContent = 'Edit Person';
       openModal('person');
     } catch (e) { toast('Could not load person', 'error'); }
   }
   
   async function savePerson() {
     const id   = document.getElementById('personId').value;
     const body = {
       name:   document.getElementById('personName').value.trim(),
       role:   document.getElementById('personRole').value,
       age:    document.getElementById('personAge').value,
       status: document.getElementById('personStatus').value
     };
     if (!body.name || !body.age) { toast('Name and age are required', 'error'); return; }
     try {
       if (id) {
         await apiFetch(`/api/persons/${id}`, { method:'PUT', body: JSON.stringify(body) });
         toast('✓ Person updated');
       } else {
         await apiFetch('/api/persons', { method:'POST', body: JSON.stringify(body) });
         toast('✓ Person added');
       }
       closeModal();
       loadPersons();
     } catch (e) { toast('Save failed: ' + e.message, 'error'); }
   }
   
   async function deletePerson(id) {
     if (!confirm('Delete this person and all their relationships?')) return;
     try {
       await apiFetch(`/api/persons/${id}`, { method:'DELETE' });
       toast('✓ Person deleted');
       loadPersons();
     } catch (e) { toast('Delete failed', 'error'); }
   }
   
   // ── LOCATIONS ──────────────────────────────────
   async function loadLocations() {
     const q = document.getElementById('searchInput').value.trim();
     const body = document.getElementById('locationBody');
     body.innerHTML = '<tr><td colspan="5" class="loading">LOADING...</td></tr>';
     try {
       const data = await apiFetch(`/api/locations${q ? '?q=' + encodeURIComponent(q) : ''}`);
       locations = data;
       if (!data.length) {
         body.innerHTML = '<tr><td colspan="5" class="empty-state">No locations found</td></tr>';
         return;
       }
       body.innerHTML = data.map(l => `
         <tr>
           <td>${l.name}</td>
           <td style="color:var(--text-secondary)">${l.type}</td>
           <td style="font-family:var(--font-mono);color:var(--accent2)">${l.incidentCount}</td>
           <td style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted)">${l.lat?.toFixed(4) || '—'}, ${l.lng?.toFixed(4) || '—'}</td>
           <td>
             <div class="action-btns">
               <button class="btn btn-edit" onclick="editLocation('${l.id}')">Edit</button>
               <button class="btn btn-danger" onclick="deleteLocation('${l.id}')">Delete</button>
             </div>
           </td>
         </tr>`).join('');
     } catch (e) { toast('Failed to load locations', 'error'); }
   }
   
   function editLocation(id) {
     const l = locations.find(x => x.id === id);
     if (!l) return;
     document.getElementById('locationId').value   = l.id;
     document.getElementById('locationName').value = l.name;
     document.getElementById('locationType').value = l.type;
     document.getElementById('locationLat').value  = l.lat;
     document.getElementById('locationLng').value  = l.lng;
     document.getElementById('locationModalTitle').textContent = 'Edit Location';
     openModal('location');
   }
   
   async function saveLocation() {
     const id   = document.getElementById('locationId').value;
     const body = {
       name: document.getElementById('locationName').value.trim(),
       type: document.getElementById('locationType').value,
       lat:  document.getElementById('locationLat').value,
       lng:  document.getElementById('locationLng').value
     };
     if (!body.name) { toast('Location name is required', 'error'); return; }
     try {
       if (id) {
         await apiFetch(`/api/locations/${id}`, { method:'PUT', body: JSON.stringify(body) });
         toast('✓ Location updated');
       } else {
         await apiFetch('/api/locations', { method:'POST', body: JSON.stringify(body) });
         toast('✓ Location added');
       }
       closeModal();
       loadLocations();
     } catch (e) { toast('Save failed: ' + e.message, 'error'); }
   }
   
   async function deleteLocation(id) {
     if (!confirm('Delete this location?')) return;
     try {
       await apiFetch(`/api/locations/${id}`, { method:'DELETE' });
       toast('✓ Location deleted');
       loadLocations();
     } catch (e) { toast('Delete failed', 'error'); }
   }
   
   // ── AGENCIES ───────────────────────────────────
   async function loadAgencies() {
     const q = document.getElementById('searchInput').value.trim();
     const body = document.getElementById('agencyBody');
     body.innerHTML = '<tr><td colspan="5" class="loading">LOADING...</td></tr>';
     try {
       const data = await apiFetch(`/api/agencies${q ? '?q=' + encodeURIComponent(q) : ''}`);
       agenciesCache = data;
       if (!data.length) {
         body.innerHTML = '<tr><td colspan="5" class="empty-state">No agencies found</td></tr>';
         return;
       }
       body.innerHTML = data.map(a => `
         <tr>
           <td>${a.name}</td>
           <td style="font-family:var(--font-mono)">${a.code}</td>
           <td style="color:var(--text-secondary)">${a.type}</td>
           <td style="font-family:var(--font-mono);color:var(--accent2)">${a.incidentCount}</td>
           <td>
             <div class="action-btns">
               <button class="btn btn-edit" onclick="editAgency('${a.id}')">Edit</button>
               <button class="btn btn-danger" onclick="deleteAgency('${a.id}')">Delete</button>
             </div>
           </td>
         </tr>`).join('');
     } catch (e) { toast('Failed to load agencies', 'error'); }
   }
   
   function editAgency(id) {
     const a = agenciesCache.find(x => x.id === id);
     if (!a) return;
     document.getElementById('agencyId').value   = a.id;
     document.getElementById('agencyName').value = a.name;
     document.getElementById('agencyCode').value = a.code;
     document.getElementById('agencyType').value = a.type;
     document.getElementById('agencyModalTitle').textContent = 'Edit Agency';
     openModal('agency');
   }
   
   async function saveAgency() {
     const id   = document.getElementById('agencyId').value;
     const body = {
       name: document.getElementById('agencyName').value.trim(),
       code: document.getElementById('agencyCode').value.trim(),
       type: document.getElementById('agencyType').value
     };
     if (!body.name || !body.code) { toast('Name and code are required', 'error'); return; }
     try {
       if (id) {
         await apiFetch(`/api/agencies/${id}`, { method:'PUT', body: JSON.stringify(body) });
         toast('✓ Agency updated');
       } else {
         await apiFetch('/api/agencies', { method:'POST', body: JSON.stringify(body) });
         toast('✓ Agency created');
       }
       closeModal();
       loadAgencies();
     } catch (e) { toast('Save failed: ' + e.message, 'error'); }
   }
   
   async function deleteAgency(id) {
     if (!confirm('Delete this agency and all its relationships?')) return;
     try {
       await apiFetch(`/api/agencies/${id}`, { method:'DELETE' });
       toast('✓ Agency deleted');
       loadAgencies();
     } catch (e) { toast('Delete failed', 'error'); }
   }
   
   // ── MODAL ──────────────────────────────────────
   async function openModal(type) {
     if (type === 'incident') {
       try {
         const [locs, ags] = await Promise.all([
           apiFetch('/api/locations'),
           apiFetch('/api/agencies')
         ]);
         const locSel = document.getElementById('incidentLocation');
         locSel.innerHTML = '<option value="">— None —</option>' +
           locs.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
         const agSel = document.getElementById('incidentAgency');
         agSel.innerHTML = '<option value="">— None —</option>' +
           ags.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
       } catch(e) {}
     }
     document.getElementById('modalOverlay').classList.add('active');
     document.getElementById(`modal-${type}`).classList.add('active');
   }
   
   function closeModal() {
     document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
     document.getElementById('modalOverlay').classList.remove('active');
     ['incidentId','incidentTitle','incidentDate'].forEach(id => {
       const el = document.getElementById(id);
       if (el) el.value = '';
     });
     ['personId','personName','personAge'].forEach(id => {
       const el = document.getElementById(id);
       if (el) el.value = '';
     });
     ['locationId','locationName','locationLat','locationLng'].forEach(id => {
       const el = document.getElementById(id);
       if (el) el.value = '';
     });
     ['agencyId','agencyName','agencyCode'].forEach(id => {
       const el = document.getElementById(id);
       if (el) el.value = '';
     });
     document.getElementById('incidentModalTitle').textContent = 'New Incident';
     document.getElementById('personModalTitle').textContent   = 'New Person';
     document.getElementById('locationModalTitle').textContent = 'New Location';
     document.getElementById('agencyModalTitle').textContent   = 'New Agency';
   }
   
   // ── BACKUP ─────────────────────────────────────
   async function downloadBackup() {
     try {
       toast('Preparing backup...');
       const res = await fetch('/api/backup');
       const blob = await res.blob();
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `safenet-backup-${new Date().toISOString().slice(0,10)}.json`;
       a.click();
       URL.revokeObjectURL(url);
       toast('✓ Backup downloaded');
     } catch (e) {
       toast('Backup failed: ' + e.message, 'error');
     }
   }
   
   // ── THEME TOGGLE ───────────────────────────────
   function toggleTheme() {
     const html = document.documentElement;
     const isDark = html.getAttribute('data-theme') === 'dark';
     html.setAttribute('data-theme', isDark ? 'light' : 'dark');
     document.getElementById('themeBtn').textContent = isDark ? '🌙 Dark Mode' : '☀ Light Mode';
   }
   
   // ── MAP VIEW ───────────────────────────────────
   async function loadMap() {
     if (mapInstance) {
       mapInstance.remove();
       mapInstance = null;
     }
   
     mapInstance = L.map('incidentMap', { maxZoom: 19 }).setView([8.2280, 124.2452], 14);
   
     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
       attribution: '© OpenStreetMap contributors',
       maxZoom: 19
     }).addTo(mapInstance);
   
     mapInstance.on('contextmenu', function(e) {
       const lat = e.latlng.lat.toFixed(4);
       const lng = e.latlng.lng.toFixed(4);
   
       const popupContent = document.createElement('div');
       popupContent.style.fontFamily = 'DM Sans, sans-serif';
       popupContent.style.minWidth = '220px';
       popupContent.innerHTML = `
         <div style="font-weight:700;font-size:13px;margin-bottom:10px">📍 Add Location Here</div>
         <div style="font-size:11px;color:#999;margin-bottom:10px">${lat}, ${lng}</div>
         <input id="popupLocName" type="text" placeholder="Location name..." style="width:100%;padding:6px 8px;margin-bottom:6px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box" />
         <select id="popupLocType" style="width:100%;padding:6px 8px;margin-bottom:10px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box">
           <option>Barangay</option>
           <option>District</option>
           <option>City</option>
           <option>Landmark</option>
           <option>Province</option>
           <option>Region</option>
         </select>
         <button id="popupSaveBtn" style="width:100%;padding:7px;background:#00d4ff;color:#000;border:none;border-radius:4px;font-weight:700;font-size:12px;cursor:pointer">Save Location</button>
       `;
   
       const popup = L.popup({ closeButton: true, maxWidth: 260 })
         .setLatLng(e.latlng)
         .setContent(popupContent)
         .openOn(mapInstance);
   
       setTimeout(() => {
         const btn = document.getElementById('popupSaveBtn');
         if (btn) {
           btn.onclick = async () => {
             const name = document.getElementById('popupLocName').value.trim();
             const type = document.getElementById('popupLocType').value;
             if (!name) { alert('Please enter a location name'); return; }
             try {
               await apiFetch('/api/locations', {
                 method: 'POST',
                 body: JSON.stringify({ name, type, lat, lng })
               });
               mapInstance.closePopup();
               toast('✓ Location saved — reloading map...');
               setTimeout(() => loadMap(), 800);
             } catch (e) {
               alert('Failed to save location: ' + e.message);
             }
           };
         }
       }, 100);
     });
   
     try {
       const [locs, incidents] = await Promise.all([
         apiFetch('/api/locations'),
         apiFetch('/api/incidents')
       ]);
   
       const severityColors = {
         Critical: '#ff4757',
         High:     '#ffa502',
         Medium:   '#00d4ff',
         Low:      '#2ed573'
       };
   
       locs.forEach(loc => {
         if (!loc.lat || !loc.lng) return;
   
         const locIncidents = incidents.filter(i =>
           i.locations && i.locations.includes(loc.name)
         );
   
         const worstSeverity = ['Critical','High','Medium','Low']
           .find(s => locIncidents.some(i => i.severity === s)) || 'Low';
   
         const color = severityColors[worstSeverity];
   
         const marker = L.circleMarker([loc.lat, loc.lng], {
           radius: 10 + locIncidents.length * 3,
           fillColor: color,
           color: '#fff',
           weight: 2,
           opacity: 1,
           fillOpacity: 0.85
         }).addTo(mapInstance);
   
         const popupContent = `
           <div style="font-family:DM Sans,sans-serif;min-width:180px">
             <div style="font-weight:700;font-size:14px;margin-bottom:6px">📍 ${loc.name}</div>
             <div style="font-size:12px;color:#666;margin-bottom:8px">${loc.type}</div>
             ${locIncidents.length
               ? `<div style="font-size:12px;font-weight:600;margin-bottom:4px">Incidents (${locIncidents.length}):</div>` +
                 locIncidents.map(i => `
                   <div style="font-size:11px;padding:3px 0;border-bottom:1px solid #eee">
                     <span style="color:${severityColors[i.severity]}">●</span>
                     ${i.title}<br>
                     <span style="color:#999">${i.date} · ${i.status}</span>
                   </div>`).join('')
               : '<div style="font-size:12px;color:#999">No incidents recorded</div>'
             }
           </div>
         `;
   
         marker.bindPopup(popupContent, { maxWidth: 280 });
       });
   
     } catch (e) {
       toast('Failed to load map data', 'error');
     }
   }
   
   // ── PERSON-TO-INCIDENT LINKING ─────────────────
   async function loadLinkPage() {
     try {
       const [persons, incidents] = await Promise.all([
         apiFetch('/api/persons'),
         apiFetch('/api/incidents')
       ]);
       const personOptions = persons.map(p => `<option value="${p.id}">${p.name} (${p.role})</option>`).join('');
       const incidentOptions = incidents.map(i => `<option value="${i.id}">${i.title}</option>`).join('');
       document.getElementById('linkPerson').innerHTML = personOptions;
       document.getElementById('linkIncident').innerHTML = incidentOptions;
       document.getElementById('unlinkPerson').innerHTML = '<option value="">— Select —</option>' + personOptions;
       document.getElementById('unlinkIncident').innerHTML = '<option value="">— Select —</option>' + incidentOptions;
     } catch (e) {
       toast('Failed to load link data', 'error');
     }
   }
   
   async function saveLink() {
     const personId   = document.getElementById('linkPerson').value;
     const incidentId = document.getElementById('linkIncident').value;
     const relType    = document.getElementById('linkRole').value;
     const roleLabel  = document.getElementById('linkRoleLabel').value;
     try {
       await apiFetch('/api/links', {
         method: 'POST',
         body: JSON.stringify({ personId, incidentId, relType, roleLabel })
       });
       toast('✓ Link created successfully');
     } catch (e) {
       toast('Failed to create link: ' + e.message, 'error');
     }
   }
   
   async function removeLink() {
     const personId   = document.getElementById('unlinkPerson').value;
     const incidentId = document.getElementById('unlinkIncident').value;
     const relType    = document.getElementById('unlinkRole').value;
     if (!personId || !incidentId) { toast('Please select a person and incident', 'error'); return; }
     if (!confirm('Remove this relationship?')) return;
     try {
       await apiFetch('/api/links', {
         method: 'DELETE',
         body: JSON.stringify({ personId, incidentId, relType })
       });
       toast('✓ Link removed');
     } catch (e) {
       toast('Failed to remove link: ' + e.message, 'error');
     }
   }
   
   // ── GRAPH VIEW ─────────────────────────────────
   const NODE_COLORS = {
     Incident: '#ff4757',
     Person:   '#00d4ff',
     Location: '#2ed573',
     Agency:   '#ffa502'
   };
   
   async function loadGraph() {
     const canvas = document.getElementById('graphCanvas');
     const ctx = canvas.getContext('2d');
   
     const rect = canvas.parentElement.getBoundingClientRect();
     canvas.width  = rect.width || 900;
     canvas.height = canvas.parentElement.clientHeight - 90 || 500;
   
     ctx.fillStyle = '#080c10';
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     ctx.fillStyle = '#3d5a73';
     ctx.font = '14px Share Tech Mono';
     ctx.textAlign = 'center';
     ctx.fillText('LOADING GRAPH...', canvas.width / 2, canvas.height / 2);
   
     try {
       const [incidents, persons, locs, ags] = await Promise.all([
         apiFetch('/api/incidents'),
         apiFetch('/api/persons'),
         apiFetch('/api/locations'),
         apiFetch('/api/agencies')
       ]);
   
       const nodes = [];
       const links = [];
       const nodeMap = {};
       const cx = canvas.width / 2;
       const cy = canvas.height / 2;
   
       function addNode(id, label, type, x, y, tooltip) {
         if (nodeMap[id]) return;
         const node = { id, label, type, x, y, vx: 0, vy: 0, radius: type === 'Incident' ? 14 : 10, tooltip: tooltip || label };
         nodes.push(node);
         nodeMap[id] = node;
       }
   
       const iCount = incidents.length;
       incidents.forEach((inc, i) => {
         const angle = (i / iCount) * Math.PI * 2;
         const r = Math.min(cx, cy) * 0.35;
         const tooltip = `[Incident] ${inc.title}\nType: ${inc.type}\nSeverity: ${inc.severity}\nStatus: ${inc.status}\nDate: ${inc.date}`;
         addNode(inc.id, inc.title.slice(0, 20) + (inc.title.length > 20 ? '…' : ''), 'Incident',
           cx + Math.cos(angle) * r + (Math.random()-0.5)*40,
           cy + Math.sin(angle) * r + (Math.random()-0.5)*40,
           tooltip);
       });
   
       persons.forEach((p, i) => {
         const angle = (i / persons.length) * Math.PI * 2 + 0.3;
         const r = Math.min(cx, cy) * 0.7;
         const tooltip = `[Person] ${p.name}\nRole: ${p.role}\nAge: ${p.age}\nStatus: ${p.status}`;
         addNode(p.id, p.name, 'Person',
           cx + Math.cos(angle) * r,
           cy + Math.sin(angle) * r,
           tooltip);
         if (p.incidents) {
           p.incidents.forEach(ititle => {
             const inc = incidents.find(x => x.title === ititle);
             if (inc && nodeMap[inc.id]) links.push({ source: p.id, target: inc.id, type: 'LINKED' });
           });
         }
       });
   
       locs.forEach((l, i) => {
         const angle = (i / locs.length) * Math.PI * 2 + 1.0;
         const r = Math.min(cx, cy) * 0.85;
         const tooltip = `[Location] ${l.name}\nType: ${l.type}\nCoords: ${l.lat}, ${l.lng}\nIncidents: ${l.incidentCount}`;
         addNode(l.id, l.name.split(',')[0], 'Location',
           cx + Math.cos(angle) * r,
           cy + Math.sin(angle) * r,
           tooltip);
         incidents.forEach(inc => {
           if (inc.locations && inc.locations.includes(l.name)) {
             links.push({ source: inc.id, target: l.id, type: 'OCCURRED_AT' });
           }
         });
       });
   
       ags.forEach((a, i) => {
         const angle = (i / ags.length) * Math.PI * 2 + 2.0;
         const r = Math.min(cx, cy) * 0.75;
         const tooltip = `[Agency] ${a.name}\nCode: ${a.code}\nType: ${a.type}`;
         addNode(a.id, a.code || a.name.split(' ')[0], 'Agency',
           cx + Math.cos(angle) * r,
           cy + Math.sin(angle) * r,
           tooltip);
         incidents.forEach(inc => {
           if (inc.agencies && inc.agencies.includes(a.name)) {
             links.push({ source: inc.id, target: a.id, type: 'RESPONDED_BY' });
           }
         });
       });
   
       graphData = { nodes, links, nodeMap };
   
       if (graphAnimFrame) cancelAnimationFrame(graphAnimFrame);
       runGraph(canvas, ctx);
   
       canvas.onmousedown = e => {
         const pos = canvasPos(canvas, e);
         graphDrag = nodes.find(n => Math.hypot(n.x - pos.x, n.y - pos.y) < n.radius + 4) || null;
       };
       canvas.onmousemove = e => {
         if (graphDrag) {
           const pos = canvasPos(canvas, e);
           graphDrag.x = pos.x;
           graphDrag.y = pos.y;
           graphDrag.vx = 0;
           graphDrag.vy = 0;
         }
         const pos = canvasPos(canvas, e);
         const hovered = nodes.find(n => Math.hypot(n.x - pos.x, n.y - pos.y) < n.radius + 4);
         canvas.title = hovered ? (hovered.tooltip || hovered.label) : '';
       };
       canvas.onmouseup    = () => { graphDrag = null; };
       canvas.onmouseleave = () => { graphDrag = null; };
   
     } catch (e) {
       console.error(e);
       toast('Failed to load graph', 'error');
     }
   }
   
   function canvasPos(canvas, e) {
     const r = canvas.getBoundingClientRect();
     return { x: e.clientX - r.left, y: e.clientY - r.top };
   }
   
   function runGraph(canvas, ctx) {
     const { nodes, links } = graphData;
     const W = canvas.width, H = canvas.height;
   
     function tick() {
       for (let i = 0; i < nodes.length; i++) {
         for (let j = i + 1; j < nodes.length; j++) {
           const a = nodes[i], b = nodes[j];
           const dx = b.x - a.x, dy = b.y - a.y;
           const dist = Math.sqrt(dx*dx + dy*dy) || 1;
           const force = 1800 / (dist * dist);
           const fx = (dx / dist) * force, fy = (dy / dist) * force;
           a.vx -= fx; a.vy -= fy;
           b.vx += fx; b.vy += fy;
         }
       }
   
       links.forEach(link => {
         const a = graphData.nodeMap[link.source], b = graphData.nodeMap[link.target];
         if (!a || !b) return;
         const dx = b.x - a.x, dy = b.y - a.y;
         const dist = Math.sqrt(dx*dx + dy*dy) || 1;
         const force = (dist - 120) * 0.015;
         const fx = (dx / dist) * force, fy = (dy / dist) * force;
         a.vx += fx; a.vy += fy;
         b.vx -= fx; b.vy -= fy;
       });
   
       nodes.forEach(n => {
         if (n === graphDrag) return;
         n.vx += (W/2 - n.x) * 0.002;
         n.vy += (H/2 - n.y) * 0.002;
         n.vx *= 0.85; n.vy *= 0.85;
         n.x += n.vx; n.y += n.vy;
         n.x = Math.max(n.radius + 4, Math.min(W - n.radius - 4, n.x));
         n.y = Math.max(n.radius + 4, Math.min(H - n.radius - 4, n.y));
       });
   
       ctx.clearRect(0, 0, W, H);
       ctx.fillStyle = '#080c10';
       ctx.fillRect(0, 0, W, H);
   
       links.forEach(link => {
         const a = graphData.nodeMap[link.source], b = graphData.nodeMap[link.target];
         if (!a || !b) return;
         ctx.beginPath();
         ctx.moveTo(a.x, a.y);
         ctx.lineTo(b.x, b.y);
         ctx.strokeStyle = '#1e2d3d';
         ctx.lineWidth = 1.5;
         ctx.stroke();
       });
   
       nodes.forEach(n => {
         const color = NODE_COLORS[n.type] || '#888';
         const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 2.5);
         grd.addColorStop(0, color + '44');
         grd.addColorStop(1, 'transparent');
         ctx.beginPath();
         ctx.arc(n.x, n.y, n.radius * 2.5, 0, Math.PI * 2);
         ctx.fillStyle = grd;
         ctx.fill();
   
         ctx.beginPath();
         ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
         ctx.fillStyle = color + '33';
         ctx.fill();
         ctx.strokeStyle = color;
         ctx.lineWidth = 2;
         ctx.stroke();
   
         ctx.fillStyle = '#7a9bb5';
         ctx.font = '10px Share Tech Mono';
         ctx.textAlign = 'center';
         ctx.fillText(n.label.length > 18 ? n.label.slice(0,18)+'…' : n.label, n.x, n.y + n.radius + 13);
       });
   
       graphAnimFrame = requestAnimationFrame(tick);
     }
     tick();
   }
   
   // ── INIT ───────────────────────────────────────
   window.addEventListener('DOMContentLoaded', () => {
     loadDashboard();
   });
   
   const observer = new MutationObserver(() => {
     const graphPage = document.getElementById('page-graph');
     if (!graphPage.classList.contains('active') && graphAnimFrame) {
       cancelAnimationFrame(graphAnimFrame);
       graphAnimFrame = null;
     }
   });
   observer.observe(document.getElementById('page-graph'), { attributes: true });