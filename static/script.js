let scripts = [];
let isSaving = false;
const activeMonitoring = new Set(); // Tracks scripts being monitored for completion

async function loadScripts() {
    if (isSaving) return;
    const res = await fetch('/api/scripts');
    scripts = await res.json();
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('scriptGrid');
    grid.innerHTML = '';

    // Only show enabled scripts (Soft Delete/Logic Delete)
    const visibleScripts = scripts.filter(s => s.enabled !== false);

    visibleScripts.forEach(s => {
        const card = document.createElement('div');
        card.className = 'script-card';
        card.innerHTML = `
            <div class="script-header">
                <div class="script-title">${s.name}</div>
                <div class="id-badge">${s.id}</div>
            </div>
            <div class="path-text">${s.path}</div>
            <div class="controls">
                <div class="input-group">
                    <label><input type="checkbox" class="select-script" value="${s.id}" style="width: auto;" ${s.batch_selected ? 'checked' : ''} onchange="updateScript('${s.id}', 'batch_selected', this.checked)"> Select for batch run</label>
                </div>
                <div class="input-group">
                    <label>Params</label>
                    <input type="text" id="params-${s.id}" value="${s.params || ''}" onchange="updateScript('${s.id}', 'params', this.value)">
                </div>
                <div class="input-group">
                    <label>Schedule (Cron)</label>
                    <input type="text" id="schedule-${s.id}" value="${s.schedule || ''}" onchange="updateScript('${s.id}', 'schedule', this.value)" placeholder="e.g. 0 12 * * *">
                </div>
                <div class="actions">
                    <button class="btn btn-primary" onclick="runOne('${s.id}')">
                        <i data-lucide="play-circle"></i> Run Now
                    </button>
                    <button class="btn btn-outline" onclick="toggleLogs('${s.id}')">
                        <i data-lucide="terminal"></i> Logs
                    </button>
                    <button class="btn btn-outline" onclick="showReports('${s.id}')" ${s.report_dir ? '' : 'disabled'} title="${s.report_dir ? 'View Reports' : 'No report directory configured'}">
                        <i data-lucide="file-text"></i> Reports
                    </button>
                    <button class="btn btn-outline btn-icon btn-edit-hover" onclick="editScript('${s.id}')" title="Edit Config">
                        <i data-lucide="edit" style="width: 18px; height: 18px;"></i>
                    </button>
                    <button class="btn btn-outline btn-icon btn-danger-hover" onclick="deleteScript('${s.id}')" title="Delete Script">
                        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>
            </div>
            <div id="logs-${s.id}" class="log-panel" style="display: none;"></div>
        `;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

async function updateScript(id, field, value) {
    const s = scripts.find(x => x.id === id);
    if (s) {
        s[field] = value;
        await saveToServer();
    }
}

async function saveToServer() {
    isSaving = true;
    try {
        await fetch('/api/scripts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scripts)
        });
        showToast();
    } finally {
        isSaving = false;
    }
}

async function runOne(id) {
    const s = scripts.find(x => x.id === id);
    const params = document.getElementById(`params-${id}`).value;
    await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_ids: [id], custom_params: params })
    });
    showToast(`Script "${s ? s.name : id}" is executing...`);
    monitorScript(id);
}

async function executeSelected() {
    const selectedIds = Array.from(document.querySelectorAll('.select-script:checked')).map(cb => cb.value);
    if (selectedIds.length === 0) return alert("Select at least one script");

    await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_ids: selectedIds })
    });

    selectedIds.forEach(id => {
        const s = scripts.find(x => x.id === id);
        showToast(`Script "${s ? s.name : id}" started...`);
        monitorScript(id);
    });
}

function monitorScript(id) {
    if (activeMonitoring.has(id)) return;
    activeMonitoring.add(id);

    const checkStatus = async () => {
        const res = await fetch(`/api/logs/${id}`);
        const data = await res.json();
        const s = scripts.find(x => x.id === id);

        // Update logs if the panel is open
        const container = document.getElementById(`logs-${id}`);
        if (container && container.style.display === 'block') {
            container.textContent = data.logs;
            container.scrollTop = container.scrollHeight;
        }

        if (data.logs.includes("Script finished")) {
            activeMonitoring.delete(id);
            showToast(`✅ Script "${s ? s.name : id}" has finished!`);
            return;
        }
        setTimeout(checkStatus, 2000);
    };
    checkStatus();
}

async function toggleLogs(id) {
    const container = document.getElementById(`logs-${id}`);
    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }
    showLogs(id);
}

async function showLogs(id) {
    const container = document.getElementById(`logs-${id}`);
    container.style.display = 'block';

    // Ensure it's being monitored so logs update
    monitorScript(id);
}

async function showReports(id) {
    const modal = document.getElementById('reportModal');
    const list = document.getElementById('reportList');
    list.innerHTML = 'Loading...';
    modal.style.display = 'flex';

    const res = await fetch(`/api/reports/${id}`);
    const reports = await res.json();

    if (reports.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No reports found in the configured directory.</div>';
        return;
    }

    list.innerHTML = reports.map(r => `
        <div class="report-item" onclick="window.open('/api/reports/${id}/${r.name}', '_blank')">
            <div style="display: flex; align-items: center; gap: 10px;">
                <i data-lucide="file"></i>
                <div>
                    <div style="font-weight: 600; color: var(--text-main);">${r.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(r.mtime * 1000).toLocaleString()} • ${(r.size / 1024).toFixed(1)} KB</div>
                </div>
            </div>
            <i data-lucide="external-link" style="width: 16px; height: 16px;"></i>
        </div>
    `).join('');
    lucide.createIcons();
}

function hideReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function showModal(isEdit = false) {
    document.getElementById('addModal').style.display = 'flex';
    document.getElementById('modalTitle').textContent = isEdit ? 'Edit Script' : 'Add New Script';
    if (!isEdit) {
        // Clear inputs for new script
        document.getElementById('newId').value = '';
        document.getElementById('newId').disabled = false;
        document.getElementById('newName').value = '';
        document.getElementById('newPath').value = '';
        document.getElementById('newParams').value = '';
        document.getElementById('newSchedule').value = '';
        document.getElementById('newReportDir').value = '';
    }
}
function hideModal() { document.getElementById('addModal').style.display = 'none'; }

function editScript(id) {
    console.log("Opening edit modal for:", id);
    const s = scripts.find(x => x.id === id);
    if (!s) {
        console.error("Script not found in memory!", id);
        return;
    }

    document.getElementById('newId').value = s.id;
    document.getElementById('newId').disabled = true; // ID should be unique/immutable
    document.getElementById('newName').value = s.name || '';
    document.getElementById('newPath').value = s.path || '';
    document.getElementById('newParams').value = s.params || '';
    document.getElementById('newSchedule').value = s.schedule || '';
    document.getElementById('newReportDir').value = s.report_dir || '';

    showModal(true);
}

async function saveScript() {
    const id = document.getElementById('newId').value;
    const isEdit = scripts.some(x => x.id === id);
    const existing = scripts.find(x => x.id === id);

    const newS = {
        id: id,
        name: document.getElementById('newName').value,
        path: document.getElementById('newPath').value,
        params: document.getElementById('newParams').value,
        schedule: document.getElementById('newSchedule').value,
        report_dir: document.getElementById('newReportDir').value,
        enabled: isEdit ? existing.enabled : true,
        batch_selected: isEdit ? existing.batch_selected : false
    };

    if (!newS.id || !newS.path) return alert("ID and Path are required");

    if (isEdit) {
        const index = scripts.findIndex(x => x.id === id);
        scripts[index] = newS;
    } else {
        scripts.push(newS);
    }

    await saveToServer();
    hideModal();
    loadScripts();
}

async function deleteScript(id) {
    const modal = document.getElementById('deleteConfirmModal');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    modal.style.display = 'flex';

    confirmBtn.onclick = async () => {
        console.log("Delete confirmed for:", id);
        const script = scripts.find(s => s.id === id);
        if (script) {
            script.enabled = false;
            await saveToServer();
            modal.style.display = 'none';
            renderGrid();
            showToast("Script hidden successfully!");
        }
    };
}

function hideDeleteModal() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
}

function showToast(msg = "Changes saved!") {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast-msg';
    t.textContent = msg;
    container.appendChild(t);

    // Auto-remove after some time
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(20px)';
        t.style.transition = 'all 0.5s ease';
        setTimeout(() => t.remove(), 500);
    }, 4000);
}

loadScripts();
setInterval(loadScripts, 10000); // Sync occasionally
lucide.createIcons();
