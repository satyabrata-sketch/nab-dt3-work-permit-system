/* ==========================================================================
   NAB-DT3 WORK PERMIT SYSTEM - LOGIC (TOTAL BLUE THEME & SEQUENTIAL SR NO)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // STATE MANAGEMENT
    // ----------------------------------------------------
    let permits = [];
    const LOCAL_STORAGE_KEY = 'NAB_DT3_PERMITS_DATA_V3';

    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
        try {
            permits = JSON.parse(savedData);
        } catch (e) {
            permits = [...PERMIT_DATA];
        }
    } else {
        permits = [...PERMIT_DATA];
    }

    // Ensure all permits have Long Date Format
    permits.forEach(p => {
        p.date = formatLongDate(p.date);
    });

    let filteredPermits = [...permits];
    
    let activeSlide = 'slide1';
    
    let currentCategory = 'All';
    let minCategoryThreshold = 5;
    let selectedLocation = 'All';
    let selectedCompany = 'All';
    let selectedSheet = 'All';
    let selectedStatus = 'All';
    let searchQuery = '';
    
    let currentPage = 1;
    let itemsPerPage = 25;
    let currentView = 'table';
    
    let sortColumn = 'id';
    let sortAscending = false;

    let chartInstances = {};

    // ----------------------------------------------------
    // INITIALIZATION
    // ----------------------------------------------------
    initApp();

    function initApp() {
        startLiveClock();
        populateFilterDropdowns();
        setupSlideTabs();
        setupEventListeners();
        setupFormHandlers();
        setupExportModalHandlers();
        applyFilters();
        initCharts();
        
        document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
    }

    function saveStateToLocalStorage() {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(permits));
    }

    // LONG DATE FORMAT HELPER (e.g. July 08, 2026)
    function formatLongDate(dateStr) {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
        if (dateStr.includes(',') && dateStr.length > 8) return dateStr;
        
        const clean = dateStr.split(' ')[0];
        const parsed = new Date(clean);
        if (!isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: '2-digit'
            });
        }
        return dateStr;
    }

    // ----------------------------------------------------
    // LIVE CLOCK & TOAST NOTIFICATION
    // ----------------------------------------------------
    function startLiveClock() {
        const clockEl = document.getElementById('clockText');
        function updateClock() {
            const now = new Date();
            clockEl.textContent = now.toLocaleTimeString() + ' | ' + now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    function showToast(msg) {
        const toast = document.getElementById('toastNotification');
        const toastMsg = document.getElementById('toastMessage');
        toastMsg.textContent = msg;
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3500);
    }

    // ----------------------------------------------------
    // SLIDE TABS NAVIGATION
    // ----------------------------------------------------
    function setupSlideTabs() {
        const tabSlide1 = document.getElementById('tabSlide1');
        const tabSlide2 = document.getElementById('tabSlide2');
        const slide1View = document.getElementById('slide1View');
        const slide2View = document.getElementById('slide2View');

        tabSlide1.addEventListener('click', () => {
            activeSlide = 'slide1';
            tabSlide1.classList.add('active');
            tabSlide2.classList.remove('active');
            slide1View.classList.add('active');
            slide2View.classList.remove('active');
        });

        tabSlide2.addEventListener('click', () => {
            activeSlide = 'slide2';
            tabSlide2.classList.add('active');
            tabSlide1.classList.remove('active');
            slide2View.classList.add('active');
            slide1View.classList.remove('active');
            
            setTimeout(() => {
                updateCharts();
            }, 100);
        });
    }

    // ----------------------------------------------------
    // POPULATE DROPDOWNS
    // ----------------------------------------------------
    function populateFilterDropdowns() {
        const locationSelect = document.getElementById('filterLocationSelect');
        const locations = Array.from(new Set(permits.map(p => p.location).filter(Boolean))).sort();
        
        locationSelect.innerHTML = '<option value="All">All Site Locations (' + locations.length + ')</option>';
        locations.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc;
            opt.textContent = loc;
            locationSelect.appendChild(opt);
        });

        const companySelect = document.getElementById('filterCompanySelect');
        const companies = Array.from(new Set(permits.map(p => p.company).filter(Boolean))).sort();
        
        companySelect.innerHTML = '<option value="All">All Companies (' + companies.length + ')</option>';
        companies.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            companySelect.appendChild(opt);
        });

        const sheetSelect = document.getElementById('filterSheetSelect');
        const sheets = Array.from(new Set(permits.map(p => p.sheet).filter(Boolean)));
        
        sheetSelect.innerHTML = '<option value="All">All Periods (Jan 25 - Jul 26)</option>';
        sheets.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            sheetSelect.appendChild(opt);
        });
    }

    // ----------------------------------------------------
    // FILTERING LOGIC
    // ----------------------------------------------------
    function applyFilters() {
        filteredPermits = permits.filter(p => {
            if (currentCategory !== 'All') {
                if (p.type !== currentCategory) return false;
            }

            const filterCatVal = document.getElementById('filterCategorySelect').value;
            if (filterCatVal !== 'All' && p.type !== filterCatVal) {
                return false;
            }

            if (selectedLocation !== 'All' && p.location !== selectedLocation) {
                return false;
            }

            if (selectedCompany !== 'All' && p.company !== selectedCompany) {
                return false;
            }

            if (selectedSheet !== 'All' && p.sheet !== selectedSheet) {
                return false;
            }

            if (selectedStatus !== 'All' && p.status !== selectedStatus) {
                return false;
            }

            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchPermit = (p.permit_no || '').toLowerCase().includes(q);
                const matchDesc = (p.description || '').toLowerCase().includes(q);
                const matchComp = (p.company || '').toLowerCase().includes(q);
                const matchVendor = (p.vendor || '').toLowerCase().includes(q);
                const matchContact = (p.contact || '').toLowerCase().includes(q);
                const matchLoc = (p.location || '').toLowerCase().includes(q);
                const matchDate = (p.date || '').toLowerCase().includes(q);

                if (!matchPermit && !matchDesc && !matchComp && !matchVendor && !matchContact && !matchLoc && !matchDate) {
                    return false;
                }
            }

            return true;
        });

        sortPermits();
        currentPage = 1;
        
        updateStats();
        updateCategoryMatrix();
        renderPermits();
        updateCharts();
    }

    function sortPermits() {
        filteredPermits.sort((a, b) => {
            let valA = a[sortColumn] || '';
            let valB = b[sortColumn] || '';

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortAscending ? -1 : 1;
            if (valA > valB) return sortAscending ? 1 : -1;
            return 0;
        });
    }

    // ----------------------------------------------------
    // REALTIME DASHBOARD METRICS FOR 5 CATEGORIES
    // ----------------------------------------------------
    function updateStats() {
        const total = filteredPermits.length;
        const general = filteredPermits.filter(p => p.type === 'General').length;
        const electrical = filteredPermits.filter(p => p.type === 'Electrical').length;
        const hot = filteredPermits.filter(p => p.type === 'HOT').length;
        const height = filteredPermits.filter(p => p.type === 'Height').length;
        const confined = filteredPermits.filter(p => p.type === 'Confined Space').length;

        animateCounter('statTotalPermits', total);
        animateCounter('statGeneralPermits', general);
        animateCounter('statElectricalPermits', electrical);
        animateCounter('statHotPermits', hot);
        animateCounter('statHeightPermits', height);
        animateCounter('statConfinedPermits', confined);

        document.getElementById('statGeneralPct').textContent = (total ? Math.round((general / total) * 100) : 0) + '% of Total';
        document.getElementById('statElectricalPct').textContent = (total ? Math.round((electrical / total) * 100) : 0) + '% of Total';
        document.getElementById('statHotPct').textContent = (total ? Math.round((hot / total) * 100) : 0) + '% of Total';
        document.getElementById('statHeightPct').textContent = (total ? Math.round((height / total) * 100) : 0) + '% of Total';
        document.getElementById('statConfinedPct').textContent = (total ? Math.round((confined / total) * 100) : 0) + '% of Total';

        document.getElementById('barGeneral').style.width = (total ? (general / total) * 100 : 0) + '%';
        document.getElementById('barElectrical').style.width = (total ? (electrical / total) * 100 : 0) + '%';
        document.getElementById('barHot').style.width = (total ? (hot / total) * 100 : 0) + '%';
        document.getElementById('barHeight').style.width = (total ? (height / total) * 100 : 0) + '%';
        document.getElementById('barConfined').style.width = (total ? (confined / total) * 100 : 0) + '%';

        document.getElementById('pillCountAll').textContent = permits.length;
        document.getElementById('pillCountGeneral').textContent = permits.filter(p => p.type === 'General').length;
        document.getElementById('pillCountElectrical').textContent = permits.filter(p => p.type === 'Electrical').length;
        document.getElementById('pillCountHot').textContent = permits.filter(p => p.type === 'HOT').length;
        document.getElementById('pillCountHeight').textContent = permits.filter(p => p.type === 'Height').length;
        document.getElementById('pillCountConfined').textContent = permits.filter(p => p.type === 'Confined Space').length;

        document.getElementById('matchingRecordsCount').textContent = `Showing ${total} of ${permits.length} permits`;
    }

    function animateCounter(elementId, targetValue) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const startValue = parseInt(el.textContent) || 0;
        if (startValue === targetValue) return;

        let current = startValue;
        const step = Math.ceil(Math.abs(targetValue - startValue) / 15) || 1;
        const timer = setInterval(() => {
            if (current < targetValue) {
                current = Math.min(current + step, targetValue);
            } else {
                current = Math.max(current - step, targetValue);
            }
            el.textContent = current;
            if (current === targetValue) clearInterval(timer);
        }, 20);
    }

    // 5 CATEGORIES SUMMARY MATRIX CARDS
    function updateCategoryMatrix() {
        const matrixContainer = document.getElementById('categoryMatrixGrid');
        matrixContainer.innerHTML = '';

        const categories = [
            { name: 'General Maintenance', typeKey: 'General', icon: 'fa-wrench', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
            { name: 'Electrical Safety Work', typeKey: 'Electrical', icon: 'fa-bolt', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
            { name: 'HOT Work (Welding/Spark)', typeKey: 'HOT', icon: 'fa-fire-flame-curved', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)' },
            { name: 'Height Work (Ceiling/Roof)', typeKey: 'Height', icon: 'fa-person-falling-burst', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
            { name: 'Confined Space Work', typeKey: 'Confined Space', icon: 'fa-boxes-packing', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' }
        ];

        categories.forEach(cat => {
            const matches = permits.filter(p => p.type === cat.typeKey);
            const totalCount = matches.length;
            const meetsMinThreshold = totalCount >= minCategoryThreshold;
            let statusText = meetsMinThreshold ? 'Meets Min Quota' : 'Below Min Quota';
            let statusClass = meetsMinThreshold ? 'status-optimal' : 'status-warning';

            if (totalCount > 100) {
                statusText = 'High Volume Alert';
                statusClass = 'status-alert';
            }

            const activeCount = matches.filter(p => p.status === 'Active').length;
            
            const vendorCounts = {};
            matches.forEach(p => { vendorCounts[p.company] = (vendorCounts[p.company] || 0) + 1; });
            let topVendor = 'N/A';
            let maxV = 0;
            for (let v in vendorCounts) {
                if (vendorCounts[v] > maxV) { maxV = vendorCounts[v]; topVendor = v; }
            }

            const card = document.createElement('div');
            card.className = 'matrix-card';
            card.style.borderLeft = `4px solid ${cat.color}`;
            card.innerHTML = `
                <div class="matrix-card-header">
                    <div class="matrix-title-box">
                        <div class="matrix-icon" style="background: ${cat.bg}; color: ${cat.color};">
                            <i class="fa-solid ${cat.icon}"></i>
                        </div>
                        <span class="matrix-title">${cat.name}</span>
                    </div>
                    <span class="status-badge-sm ${statusClass}">${statusText}</span>
                </div>
                <div class="matrix-metrics">
                    <div class="metric-box">
                        <span>Total Issued</span>
                        <strong>${totalCount}</strong>
                    </div>
                    <div class="metric-box">
                        <span>Active</span>
                        <strong>${activeCount}</strong>
                    </div>
                    <div class="metric-box">
                        <span>Min Quota</span>
                        <strong>${minCategoryThreshold}+</strong>
                    </div>
                </div>
                <div class="matrix-footer">
                    <span>Top Vendor: <strong>${topVendor}</strong> (${maxV})</span>
                    <span><i class="fa-solid fa-chart-line"></i> ${Math.round((totalCount / permits.length) * 100)}% share</span>
                </div>
            `;

            card.addEventListener('click', () => {
                currentCategory = cat.typeKey;
                document.querySelectorAll('.pill-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.category === cat.typeKey);
                });
                applyFilters();
            });

            matrixContainer.appendChild(card);
        });
    }

    // ----------------------------------------------------
    // RENDER SLIDE 1 PERMITS TRACKER (SEQUENTIAL SR NO: 1, 2, 3...)
    // ----------------------------------------------------
    function renderPermits() {
        const tbody = document.getElementById('permitsTableBody');
        const grid = document.getElementById('permitsCardsGrid');
        tbody.innerHTML = '';
        grid.innerHTML = '';

        if (filteredPermits.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center" style="padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                No work permits found matching current category or filter criteria.
            </td></tr>`;
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                No work permits match current criteria.
            </div>`;
            renderPagination(0);
            return;
        }

        const totalItems = filteredPermits.length;
        const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
        
        let startIdx = 0;
        let endIdx = totalItems;
        if (itemsPerPage !== 'all') {
            startIdx = (currentPage - 1) * itemsPerPage;
            endIdx = Math.min(startIdx + parseInt(itemsPerPage), totalItems);
        }

        const pageRecords = filteredPermits.slice(startIdx, endIdx);

        pageRecords.forEach((p, idx) => {
            const tr = document.createElement('tr');
            
            // SEQUENTIAL SR NO (1, 2, 3, 4...)
            const sequentialSrNo = startIdx + idx + 1;

            let badgeClass = 'badge-general';
            if (p.type === 'Electrical') badgeClass = 'badge-electrical';
            if (p.type === 'HOT') badgeClass = 'badge-hot';
            if (p.type === 'Height') badgeClass = 'badge-height';
            if (p.type === 'Confined Space') badgeClass = 'badge-confined';

            let statusClass = 'status-completed';
            if (p.status === 'Active') statusClass = 'status-active';
            if (p.status === 'Pending Approval') statusClass = 'status-pending';

            const longDateStr = formatLongDate(p.date);

            tr.innerHTML = `
                <td><span class="sr-no-cell">${sequentialSrNo}</span></td>
                <td><strong>#${p.permit_no}</strong></td>
                <td><i class="fa-regular fa-calendar-check" style="color: var(--primary);"></i> ${longDateStr}</td>
                <td><span class="type-badge ${badgeClass}">${p.type}</span></td>
                <td><i class="fa-solid fa-location-dot" style="color: var(--text-dim);"></i> ${escapeHtml(p.location)}</td>
                <td><strong>${escapeHtml(p.company)}</strong> <br><small style="color: var(--text-dim);">${escapeHtml(p.vendor)}</small></td>
                <td>${escapeHtml(p.contact || 'N/A')}</td>
                <td style="max-width: 250px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${escapeHtml(p.description)}">
                    ${escapeHtml(p.description)}
                </td>
                <td><span class="status-badge ${statusClass}">${p.status}</span></td>
                <td class="text-center">
                    <div class="action-btns">
                        <button class="action-btn view-btn" data-id="${p.id}" title="View Ticket Pass"><i class="fa-solid fa-eye"></i></button>
                        <button class="action-btn edit-btn" data-id="${p.id}" title="Edit Permit"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn delete-btn" data-id="${p.id}" title="Delete Permit"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);

            const card = document.createElement('div');
            card.className = 'permit-card';
            card.innerHTML = `
                <div class="permit-card-header">
                    <span class="sr-no-cell">Sr No #${sequentialSrNo}</span>
                    <span class="type-badge ${badgeClass}">${p.type}</span>
                    <span class="status-badge ${statusClass}">${p.status}</span>
                </div>
                <div class="permit-card-body">
                    <h4 style="font-size: 16px; color: #fff;">Permit #${p.permit_no}</h4>
                    <p class="permit-card-desc">${escapeHtml(p.description)}</p>
                    <div class="permit-card-meta">
                        <span><i class="fa-solid fa-building"></i> <strong>Company:</strong> ${escapeHtml(p.company)} (${escapeHtml(p.vendor)})</span>
                        <span><i class="fa-solid fa-location-dot"></i> <strong>Location:</strong> ${escapeHtml(p.location)}</span>
                        <span><i class="fa-regular fa-calendar"></i> <strong>Date:</strong> ${longDateStr}</span>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 10px 0 0 0; background: transparent; border-top: 1px solid var(--border-glass);">
                    <button class="btn btn-secondary view-btn" data-id="${p.id}" style="padding: 6px 12px; font-size: 12px;"><i class="fa-solid fa-eye"></i> Ticket</button>
                    <button class="btn btn-ghost edit-btn" data-id="${p.id}" style="padding: 6px 12px; font-size: 12px;"><i class="fa-solid fa-pen"></i> Edit</button>
                </div>
            `;
            grid.appendChild(card);
        });

        document.querySelectorAll('.view-btn').forEach(b => b.addEventListener('click', (e) => openDetailModal(e.currentTarget.dataset.id)));
        document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', (e) => loadPermitIntoEntryForm(e.currentTarget.dataset.id)));
        document.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', (e) => deletePermit(e.currentTarget.dataset.id)));

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        const pagContainer = document.getElementById('paginationButtons');
        pagContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPermits(); } });
        pagContainer.appendChild(prevBtn);

        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => { currentPage = i; renderPermits(); });
            pagContainer.appendChild(btn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderPermits(); } });
        pagContainer.appendChild(nextBtn);
    }

    // ----------------------------------------------------
    // CHARTS (BLUE THEME VISUALIZATIONS)
    // ----------------------------------------------------
    function initCharts() {
        const ctxCat = document.getElementById('categoryChart').getContext('2d');
        chartInstances.cat = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: ['General', 'Electrical', 'HOT Work', 'Height Work', 'Confined Space'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: ['#3B82F6', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4'],
                    borderWidth: 2,
                    borderColor: '#060B19'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94A3B8', font: { family: 'Plus Jakarta Sans' } } }
                }
            }
        });

        const ctxTrend = document.getElementById('monthlyTrendChart').getContext('2d');
        chartInstances.trend = new Chart(ctxTrend, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Permits Issued',
                    data: [],
                    backgroundColor: 'rgba(59, 130, 246, 0.75)',
                    borderColor: '#3B82F6',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#64748B' }, grid: { display: false } },
                    y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: { legend: { display: false } }
            }
        });

        const ctxZone = document.getElementById('zoneChart').getContext('2d');
        chartInstances.zone = new Chart(ctxZone, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    axis: 'y',
                    label: 'Permits',
                    data: [],
                    backgroundColor: 'rgba(56, 189, 248, 0.75)',
                    borderColor: '#38BDF8',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#64748B' }, grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });

        const ctxVendor = document.getElementById('vendorChart').getContext('2d');
        chartInstances.vendor = new Chart(ctxVendor, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Permits Worked',
                    data: [],
                    backgroundColor: 'rgba(6, 182, 212, 0.75)',
                    borderColor: '#06B6D4',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#64748B' }, grid: { display: false } },
                    y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: { legend: { display: false } }
            }
        });

        updateCharts();
    }

    function updateCharts() {
        if (!chartInstances.cat) return;

        const genCount = filteredPermits.filter(p => p.type === 'General').length;
        const elecCount = filteredPermits.filter(p => p.type === 'Electrical').length;
        const hotCount = filteredPermits.filter(p => p.type === 'HOT').length;
        const heightCount = filteredPermits.filter(p => p.type === 'Height').length;
        const confinedCount = filteredPermits.filter(p => p.type === 'Confined Space').length;

        chartInstances.cat.data.datasets[0].data = [genCount, elecCount, hotCount, heightCount, confinedCount];
        chartInstances.cat.update();

        const monthlyCounts = {};
        const sheetsOrder = ['Jan-2025', 'Feb-2025', 'March-2025', 'APRIL-25', 'MAY-2025', 'JUNE -2025', 'Jan-2026', 'Feb-26', 'MAR -2026', 'April-2026', 'May-2026', 'JUNE -2026', 'JULY-2026'];
        
        sheetsOrder.forEach(s => monthlyCounts[s] = 0);
        filteredPermits.forEach(p => {
            if (p.sheet) monthlyCounts[p.sheet] = (monthlyCounts[p.sheet] || 0) + 1;
        });

        chartInstances.trend.data.labels = sheetsOrder.map(s => s.replace('-20', '-').replace(' ', ''));
        chartInstances.trend.data.datasets[0].data = sheetsOrder.map(s => monthlyCounts[s] || 0);
        chartInstances.trend.update();

        const zoneCounts = {};
        filteredPermits.forEach(p => {
            const loc = p.location || 'General Area';
            zoneCounts[loc] = (zoneCounts[loc] || 0) + 1;
        });
        const sortedZones = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

        chartInstances.zone.data.labels = sortedZones.map(z => z[0]);
        chartInstances.zone.data.datasets[0].data = sortedZones.map(z => z[1]);
        chartInstances.zone.update();

        const vendorCounts = {};
        filteredPermits.forEach(p => {
            const comp = p.company || 'Unknown';
            vendorCounts[comp] = (vendorCounts[comp] || 0) + 1;
        });
        const topVendors = Object.entries(vendorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

        chartInstances.vendor.data.labels = topVendors.map(v => v[0]);
        chartInstances.vendor.data.datasets[0].data = topVendors.map(v => v[1]);
        chartInstances.vendor.update();
    }

    // ----------------------------------------------------
    // FORM HANDLERS (SLIDE 1 ENTRY FORM)
    // ----------------------------------------------------
    function setupFormHandlers() {
        const form = document.getElementById('entryForm');
        const btnToggleForm = document.getElementById('btnToggleEntryForm');
        const btnClear = document.getElementById('btnClearForm');

        btnToggleForm.addEventListener('click', () => {
            if (form.style.display === 'none') {
                form.style.display = 'flex';
                btnToggleForm.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Hide Form';
            } else {
                form.style.display = 'none';
                btnToggleForm.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Show Form';
            }
        });

        btnClear.addEventListener('click', () => {
            clearEntryForm();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('entryPermitId').value;
            const permit_no = document.getElementById('entryPermitNo').value.trim();
            const rawDate = document.getElementById('entryDate').value;
            const date = formatLongDate(rawDate);
            const type = document.getElementById('entryType').value;
            const location = document.getElementById('entryLocation').value.trim();
            const company = document.getElementById('entryCompany').value.trim();
            const vendor = document.getElementById('entryVendor').value.trim();
            const contact = document.getElementById('entryContact').value.trim();
            const status = document.getElementById('entryStatus').value;
            const description = document.getElementById('entryDescription').value.trim();

            if (id) {
                const idx = permits.findIndex(x => x.id == id);
                if (idx !== -1) {
                    permits[idx] = {
                        ...permits[idx],
                        permit_no, date, type, location, company, vendor, contact, status, description
                    };
                    showToast(`Permit #${permit_no} updated! Realtime Dashboard refreshed.`);
                }
            } else {
                const newId = permits.length ? Math.max(...permits.map(p => p.id)) + 1 : 1;
                permits.unshift({
                    id: newId,
                    sheet: 'JULY-2026',
                    sr_no: permits.length + 1,
                    permit_no,
                    date,
                    type,
                    location,
                    company,
                    vendor,
                    contact: contact || 'N/A',
                    status,
                    description
                });
                showToast(`Permit #${permit_no} added! Realtime Dashboard updated.`);
            }

            saveStateToLocalStorage();
            populateFilterDropdowns();
            applyFilters();
            clearEntryForm();
        });
    }

    function clearEntryForm() {
        document.getElementById('entryPermitId').value = '';
        document.getElementById('entryForm').reset();
        document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('btnSubmitEntry').innerHTML = '<i class="fa-solid fa-plus-circle"></i> Save & Update Tracker';
    }

    function loadPermitIntoEntryForm(id) {
        const p = permits.find(x => x.id == id);
        if (!p) return;

        if (activeSlide !== 'slide1') {
            document.getElementById('tabSlide1').click();
        }

        document.getElementById('entryPermitId').value = p.id;
        document.getElementById('entryPermitNo').value = p.permit_no;
        
        try {
            const parsed = new Date(p.date);
            if (!isNaN(parsed.getTime())) {
                document.getElementById('entryDate').value = parsed.toISOString().split('T')[0];
            }
        } catch(e) {}

        document.getElementById('entryType').value = p.type;
        document.getElementById('entryLocation').value = p.location;
        document.getElementById('entryCompany').value = p.company;
        document.getElementById('entryVendor').value = p.vendor;
        document.getElementById('entryContact').value = p.contact !== 'N/A' ? p.contact : '';
        document.getElementById('entryStatus').value = p.status;
        document.getElementById('entryDescription').value = p.description;

        document.getElementById('btnSubmitEntry').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Permit Details';
        document.getElementById('entryForm').style.display = 'flex';
        
        document.querySelector('.entry-card').scrollIntoView({ behavior: 'smooth' });
    }

    function deletePermit(id) {
        const p = permits.find(x => x.id == id);
        if (!p) return;
        if (confirm(`Are you sure you want to delete Permit #${p.permit_no} (${p.description})?`)) {
            permits = permits.filter(x => x.id != id);
            saveStateToLocalStorage();
            populateFilterDropdowns();
            applyFilters();
            showToast(`Permit #${p.permit_no} deleted! Realtime Dashboard updated.`);
        }
    }

    // ----------------------------------------------------
    // EXPORT HUB MODAL & FORMATTED EXCEL LOGIC
    // ----------------------------------------------------
    function setupExportModalHandlers() {
        const exportModal = document.getElementById('exportModalOverlay');
        const btnClose = document.getElementById('btnCloseExportModal');
        const btnCancel = document.getElementById('btnCancelExport');
        const btnConfirm = document.getElementById('btnConfirmExportExcel');

        function openExportModal() {
            document.getElementById('exportFilteredCount').textContent = filteredPermits.length;
            document.getElementById('exportAllCount').textContent = permits.length;
            exportModal.classList.add('active');
        }

        function closeExportModal() {
            exportModal.classList.remove('active');
        }

        document.getElementById('btnHeaderExportExcel').addEventListener('click', openExportModal);
        document.getElementById('btnExportExcelSlide1').addEventListener('click', openExportModal);
        document.getElementById('btnExportExcelDashboard').addEventListener('click', openExportModal);

        btnClose.addEventListener('click', closeExportModal);
        btnCancel.addEventListener('click', closeExportModal);

        btnConfirm.addEventListener('click', () => {
            const scope = document.querySelector('input[name="exportScope"]:checked').value;
            const targetDataset = scope === 'filtered' ? filteredPermits : permits;
            
            const incCat = document.getElementById('chkSheetCategory').checked;
            const incKPI = document.getElementById('chkSheetKPI').checked;

            generateFormattedExcel(targetDataset, incCat, incKPI);
            closeExportModal();
        });
    }

    function generateFormattedExcel(dataset, includeCategorySheet, includeKpiSheet) {
        if (typeof XLSX === 'undefined') {
            alert('Excel export library is loading. Please try again.');
            return;
        }

        if (!dataset.length) {
            alert('No permit records available for export.');
            return;
        }

        const wb = XLSX.utils.book_new();

        const formattedPermits = dataset.map((p, idx) => ({
            'Sr No': idx + 1, // Sequential 1, 2, 3, 4...
            'Permit Number': p.permit_no,
            'Date (Long Format)': formatLongDate(p.date),
            'Category': p.type,
            'Site Location': p.location,
            'Company / Agency': p.company,
            'Vendor Technician': p.vendor,
            'Contact Number': p.contact || 'N/A',
            'Permit Status': p.status,
            'Work Scope & Description': p.description,
            'Log Period Sheet': p.sheet || 'N/A'
        }));

        const wsPermits = XLSX.utils.json_to_sheet(formattedPermits);

        wsPermits['!cols'] = [
            { wch: 8 },   // Sr No
            { wch: 15 },  // Permit Number
            { wch: 20 },  // Date (Long Format)
            { wch: 16 },  // Category
            { wch: 28 },  // Site Location
            { wch: 26 },  // Company / Agency
            { wch: 22 },  // Vendor Technician
            { wch: 16 },  // Contact Number
            { wch: 18 },  // Permit Status
            { wch: 55 },  // Work Scope & Description
            { wch: 15 }   // Log Period Sheet
        ];

        XLSX.utils.book_append_sheet(wb, wsPermits, 'Master Permits Tracker');

        if (includeCategorySheet) {
            const categories = [
                { name: 'General Maintenance', typeKey: 'General' },
                { name: 'Electrical Safety Work', typeKey: 'Electrical' },
                { name: 'HOT Work (Welding/Grinding/Spark)', typeKey: 'HOT' },
                { name: 'Height Work (Ceiling/Roof)', typeKey: 'Height' },
                { name: 'Confined Space Work', typeKey: 'Confined Space' }
            ];

            const categoryData = categories.map(cat => {
                const matches = permits.filter(p => p.type === cat.typeKey);
                const total = matches.length;
                const active = matches.filter(p => p.status === 'Active').length;
                const completed = matches.filter(p => p.status === 'Completed').length;
                const meetsQuota = total >= minCategoryThreshold;
                
                const vendorCounts = {};
                matches.forEach(p => { vendorCounts[p.company] = (vendorCounts[p.company] || 0) + 1; });
                let topVendor = 'N/A';
                let maxV = 0;
                for (let v in vendorCounts) {
                    if (vendorCounts[v] > maxV) { maxV = vendorCounts[v]; topVendor = v; }
                }

                return {
                    'Work Permit Category': cat.name,
                    'Total Permits Issued': total,
                    'Active In-Progress': active,
                    'Completed Permits': completed,
                    'Minimum Quota Target': minCategoryThreshold,
                    'Compliance Status': meetsQuota ? 'Meets Min Quota' : 'Below Min Quota',
                    'Top Contractor / Vendor': topVendor + ` (${maxV} permits)`
                };
            });

            const wsCategory = XLSX.utils.json_to_sheet(categoryData);
            wsCategory['!cols'] = [
                { wch: 32 },
                { wch: 20 },
                { wch: 18 },
                { wch: 18 },
                { wch: 20 },
                { wch: 22 },
                { wch: 28 }
            ];
            XLSX.utils.book_append_sheet(wb, wsCategory, '5 Category Threshold Monitor');
        }

        if (includeKpiSheet) {
            const kpiSummary = [
                { 'Executive Indicator': 'Total Work Permits Recorded', 'Value / Count': permits.length, 'Percentage Share': '100%' },
                { 'Executive Indicator': 'Current Filtered View Records', 'Value / Count': dataset.length, 'Percentage Share': Math.round((dataset.length / permits.length) * 100) + '%' },
                { 'Executive Indicator': 'General Work Permits', 'Value / Count': permits.filter(p => p.type === 'General').length, 'Percentage Share': Math.round((permits.filter(p => p.type === 'General').length / permits.length) * 100) + '%' },
                { 'Executive Indicator': 'Electrical Safety Permits', 'Value / Count': permits.filter(p => p.type === 'Electrical').length, 'Percentage Share': Math.round((permits.filter(p => p.type === 'Electrical').length / permits.length) * 100) + '%' },
                { 'Executive Indicator': 'HOT Work Permits', 'Value / Count': permits.filter(p => p.type === 'HOT').length, 'Percentage Share': Math.round((permits.filter(p => p.type === 'HOT').length / permits.length) * 100) + '%' },
                { 'Executive Indicator': 'Height Work Permits', 'Value / Count': permits.filter(p => p.type === 'Height').length, 'Percentage Share': Math.round((permits.filter(p => p.type === 'Height').length / permits.length) * 100) + '%' },
                { 'Executive Indicator': 'Confined Space Permits', 'Value / Count': permits.filter(p => p.type === 'Confined Space').length, 'Percentage Share': Math.round((permits.filter(p => p.type === 'Confined Space').length / permits.length) * 100) + '%' },
                { 'Executive Indicator': 'Active Site Permits (In-Progress)', 'Value / Count': permits.filter(p => p.status === 'Active').length, 'Percentage Share': '-' },
                { 'Executive Indicator': 'Pending Safety Approvals', 'Value / Count': permits.filter(p => p.status === 'Pending Approval').length, 'Percentage Share': '-' },
                { 'Executive Indicator': 'NAB-DT3 Minimum Category Quota', 'Value / Count': minCategoryThreshold, 'Percentage Share': '-' },
                { 'Executive Indicator': 'Report Generated Date & Time', 'Value / Count': new Date().toLocaleString(), 'Percentage Share': '-' }
            ];

            const wsKpi = XLSX.utils.json_to_sheet(kpiSummary);
            wsKpi['!cols'] = [
                { wch: 38 },
                { wch: 25 },
                { wch: 18 }
            ];
            XLSX.utils.book_append_sheet(wb, wsKpi, 'Executive KPI Summary');
        }

        const formattedFileName = `NAB-DT3_Work_Permits_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, formattedFileName);

        showToast('Formatted Excel report downloaded successfully!');
    }

    // ----------------------------------------------------
    // OTHER EVENT LISTENERS
    // ----------------------------------------------------
    function setupEventListeners() {
        document.querySelectorAll('.pill-btn').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
                const btn = e.currentTarget;
                btn.classList.add('active');
                currentCategory = btn.dataset.category;
                applyFilters();
            });
        });

        const thresholdInput = document.getElementById('minCategoryThreshold');
        const thresholdRange = document.getElementById('minCategoryRange');
        const thresholdBadge = document.getElementById('thresholdBadge');

        function updateThreshold(val) {
            minCategoryThreshold = parseInt(val) || 1;
            thresholdInput.value = minCategoryThreshold;
            thresholdRange.value = minCategoryThreshold;
            thresholdBadge.textContent = `Min >= ${minCategoryThreshold}`;
            applyFilters();
        }

        thresholdInput.addEventListener('input', (e) => updateThreshold(e.target.value));
        thresholdRange.addEventListener('input', (e) => updateThreshold(e.target.value));

        document.getElementById('filterCategorySelect').addEventListener('change', () => applyFilters());
        document.getElementById('filterLocationSelect').addEventListener('change', (e) => {
            selectedLocation = e.target.value;
            applyFilters();
        });
        document.getElementById('filterCompanySelect').addEventListener('change', (e) => {
            selectedCompany = e.target.value;
            applyFilters();
        });
        document.getElementById('filterSheetSelect').addEventListener('change', (e) => {
            selectedSheet = e.target.value;
            applyFilters();
        });
        document.getElementById('filterStatusSelect').addEventListener('change', (e) => {
            selectedStatus = e.target.value;
            applyFilters();
        });

        const searchInput = document.getElementById('searchInput');
        const btnClearSearch = document.getElementById('btnClearSearch');

        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            btnClearSearch.style.display = searchQuery ? 'block' : 'none';
            applyFilters();
        });
        btnClearSearch.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            btnClearSearch.style.display = 'none';
            applyFilters();
        });

        const viewBtnTable = document.getElementById('viewBtnTable');
        const viewBtnGrid = document.getElementById('viewBtnGrid');
        const tableViewContainer = document.getElementById('tableViewContainer');
        const cardsViewContainer = document.getElementById('cardsViewContainer');

        viewBtnTable.addEventListener('click', () => {
            viewBtnTable.classList.add('active');
            viewBtnGrid.classList.remove('active');
            tableViewContainer.style.display = 'block';
            cardsViewContainer.style.display = 'none';
            currentView = 'table';
        });

        viewBtnGrid.addEventListener('click', () => {
            viewBtnGrid.classList.add('active');
            viewBtnTable.classList.remove('active');
            cardsViewContainer.style.display = 'block';
            tableViewContainer.style.display = 'none';
            currentView = 'grid';
        });

        document.getElementById('itemsPerPageSelect').addEventListener('change', (e) => {
            itemsPerPage = e.target.value;
            currentPage = 1;
            renderPermits();
        });

        document.querySelectorAll('.permits-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.dataset.sort;
                if (sortColumn === col) {
                    sortAscending = !sortAscending;
                } else {
                    sortColumn = col;
                    sortAscending = true;
                }
                sortPermits();
                renderPermits();
            });
        });

        document.getElementById('btnResetTrackerFilters').addEventListener('click', () => {
            currentCategory = 'All';
            minCategoryThreshold = 5;
            selectedLocation = 'All';
            selectedCompany = 'All';
            selectedSheet = 'All';
            selectedStatus = 'All';
            searchQuery = '';

            document.getElementById('filterCategorySelect').value = 'All';
            document.getElementById('filterLocationSelect').value = 'All';
            document.getElementById('filterCompanySelect').value = 'All';
            document.getElementById('filterSheetSelect').value = 'All';
            document.getElementById('filterStatusSelect').value = 'All';
            document.getElementById('searchInput').value = '';
            document.getElementById('btnClearSearch').style.display = 'none';

            updateThreshold(5);

            document.querySelectorAll('.pill-btn').forEach(b => b.classList.toggle('active', b.dataset.category === 'All'));
            applyFilters();
        });

        document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
        document.getElementById('btnCloseDetailModal').addEventListener('click', closeDetailModal);
    }

    // ----------------------------------------------------
    // EXPORT TO CSV
    // ----------------------------------------------------
    function exportCSV() {
        if (!filteredPermits.length) {
            alert('No permits available to export!');
            return;
        }

        const headers = ['Sr No', 'Permit No', 'Date', 'Category/Type', 'Site Location', 'Company', 'Vendor Name', 'Contact', 'Description', 'Status', 'Log Sheet'];
        const rows = filteredPermits.map((p, idx) => [
            `"${idx + 1}"`,
            `"${p.permit_no}"`,
            `"${formatLongDate(p.date)}"`,
            `"${p.type}"`,
            `"${p.location}"`,
            `"${p.company}"`,
            `"${p.vendor}"`,
            `"${p.contact}"`,
            `"${p.description.replace(/"/g, '""')}"`,
            `"${p.status}"`,
            `"${p.sheet}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `NAB-DT3_Work_Permits_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function openDetailModal(id) {
        const p = permits.find(x => x.id == id);
        if (!p) return;

        document.getElementById('detailPermitNo').textContent = 'Permit #' + p.permit_no;
        document.getElementById('detailDate').textContent = formatLongDate(p.date);
        document.getElementById('detailCategoryBadge').textContent = p.type;
        document.getElementById('detailLocation').textContent = p.location;
        document.getElementById('detailCompany').textContent = p.company;
        document.getElementById('detailVendor').textContent = p.vendor;
        document.getElementById('detailContact').textContent = p.contact || 'N/A';
        document.getElementById('detailSheet').textContent = p.sheet || 'N/A';
        document.getElementById('detailStatus').textContent = p.status;
        document.getElementById('detailDescription').textContent = p.description;

        document.getElementById('btnEditFromDetail').onclick = () => {
            closeDetailModal();
            loadPermitIntoEntryForm(p.id);
        };

        document.getElementById('detailModalOverlay').classList.add('active');
    }

    function closeDetailModal() {
        document.getElementById('detailModalOverlay').classList.remove('active');
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
});
