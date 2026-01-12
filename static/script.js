let scripts = [];

async function loadScripts() {
    const res = await fetch('/api/scripts');
    scripts = await res.json();
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('scriptGrid');
    grid.innerHTML = '';

    scripts.forEach(s => {
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
                    <label><input type="checkbox" class="select-script" value="${s.id}" style="width: auto;"> Select for batch run</label>
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
                    <button class="btn btn-outline" onclick="showLogs('${s.id}')">
                        <i data-lucide="terminal"></i> Logs
                    </button>
                    <button class="btn btn-outline" onclick="deleteScript('${s.id}')">
                        <i data-lucide="trash-2" style="color: #ef4444"></i>
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
    await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scripts)
    });
    showToast();
}

async function runOne(id) {
    const params = document.getElementById(`params-${id}`).value;
    await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_ids: [id], custom_params: params })
    });
    showLogs(id);
    showToast("Execution started!");
}

async function executeSelected() {
    const selected = Array.from(document.querySelectorAll('.select-script:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Select at least one script");

    await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_ids: selected })
    });
    showToast(`Running ${selected.length} scripts...`);
}

async function showLogs(id) {
    const container = document.getElementById(`logs-${id}`);
    container.style.display = 'block';
    
    async function fetchLogs() {
        if (container.style.display === 'none') return;
        const res = await fetch(`/api/logs/${id}`);
        const data = await res.json();
        container.textContent = data.logs;
        container.scrollTop = container.scrollHeight;
        setTimeout(fetchLogs, 2000);
    }
    fetchLogs();
}

function showModal() { document.getElementById('addModal').style.display = 'flex'; }
function hideModal() { document.getElementById('addModal').style.display = 'none'; }

async function addScript() {
    const newS = {
        id: document.getElementById('newId').value,
        name: document.getElementById('newName').value,
        path: document.getElementById('newPath').value,
        params: document.getElementById('newParams').value,
        schedule: document.getElementById('newSchedule').value,
        enabled: true
    };
    
    if (!newS.id || !newS.path) return alert("ID and Path are required");
    
    scripts.push(newS);
    await saveToServer();
    hideModal();
    loadScripts();
}

async function deleteScript(id) {
    if (!confirm("Really delete?")) return;
    scripts = scripts.filter(s => s.id !== id);
    await saveToServer();
    renderGrid();
}

function showToast(msg = "Changes saved!") {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

loadScripts();
setInterval(loadScripts, 10000); // Sync occasionally
lucide.createIcons();
