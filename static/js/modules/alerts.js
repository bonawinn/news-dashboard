// Alerts module
const AlertsModule = (() => {
    let loaded = false;
    const DOM = {};

    function init() {
        DOM.createBtn = document.getElementById("alert-create");
        DOM.testTgBtn = document.getElementById("alert-test-tg");
        DOM.status = document.getElementById("alert-status");
        DOM.content = document.getElementById("alert-content");

        DOM.createBtn.addEventListener("click", showCreateModal);
        DOM.testTgBtn.addEventListener("click", testTelegram);

        fetchAlerts();
    }

    async function fetchAlerts() {
        DOM.status.innerHTML = '<span class="spinner"></span> Loading alerts...';

        try {
            const resp = await fetch("/api/alerts/list");
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (data.error) throw new Error(data.error);
            renderAlerts(data);
            DOM.status.textContent = "";
        } catch (err) {
            DOM.status.textContent = `Error: ${err.message}`;
        }
    }

    function renderAlerts(data) {
        if (data.status === "not_implemented") {
            DOM.content.innerHTML = `<div class="setup-box"><h3>Coming Soon</h3><p>${Utils.escapeHtml(data.message || "")}</p></div>`;
            return;
        }

        const alerts = data.alerts || [];
        if (!alerts.length) {
            DOM.content.innerHTML = '<p class="text-muted" style="text-align:center;padding:24px;">No alerts configured. Click "+ New Alert" to create one.</p>';
            return;
        }

        DOM.content.innerHTML = alerts.map(a => `
            <div class="alert-card" data-id="${a.id}">
                <div class="alert-info">
                    <div class="alert-name">${Utils.escapeHtml(a.name)}</div>
                    <div class="alert-type">${Utils.escapeHtml(a.alert_type)} ${a.enabled ? '<span class="text-green">Active</span>' : '<span class="text-red">Disabled</span>'}</div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-danger btn-sm alert-delete" data-id="${a.id}">Delete</button>
                </div>
            </div>
        `).join("");

        DOM.content.querySelectorAll(".alert-delete").forEach(btn => {
            btn.addEventListener("click", () => deleteAlert(btn.dataset.id));
        });
    }

    async function deleteAlert(id) {
        try {
            const resp = await fetch(`/api/alerts/delete/${id}`, { method: "DELETE" });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            fetchAlerts();
        } catch (err) {
            DOM.status.textContent = `Error: ${err.message}`;
        }
    }

    function showCreateModal() {
        // Remove existing modal if any
        const existing = document.querySelector(".modal-overlay");
        if (existing) existing.remove();

        const overlay = document.createElement("div");
        overlay.className = "modal-overlay open";
        overlay.innerHTML = `
            <div class="modal">
                <h3>Create Alert</h3>
                <div class="form-group">
                    <label>Alert Name</label>
                    <input type="text" id="modal-alert-name" placeholder="e.g. NVDA Insider Cluster">
                </div>
                <div class="form-group">
                    <label>Alert Type</label>
                    <select id="modal-alert-type">
                        <option value="insider_cluster">Insider Buying Cluster</option>
                        <option value="price_above">Price Above</option>
                        <option value="price_below">Price Below</option>
                        <option value="sentiment_bullish">Sentiment Bullish Spike</option>
                        <option value="sentiment_bearish">Sentiment Bearish Spike</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Ticker (optional)</label>
                    <input type="text" id="modal-alert-ticker" placeholder="e.g. NVDA">
                </div>
                <div class="form-group">
                    <label>Threshold (if applicable)</label>
                    <input type="number" id="modal-alert-threshold" step="any" placeholder="e.g. 150.00">
                </div>
                <div class="modal-actions">
                    <button class="btn" id="modal-cancel">Cancel</button>
                    <button class="btn btn-primary" id="modal-save">Create</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.remove();
        });

        document.getElementById("modal-cancel").addEventListener("click", () => overlay.remove());
        document.getElementById("modal-save").addEventListener("click", async () => {
            const name = document.getElementById("modal-alert-name").value.trim();
            const alertType = document.getElementById("modal-alert-type").value;
            const ticker = document.getElementById("modal-alert-ticker").value.trim().toUpperCase();
            const threshold = document.getElementById("modal-alert-threshold").value;

            if (!name) { alert("Name required"); return; }

            try {
                const resp = await fetch("/api/alerts/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        alert_type: alertType,
                        config: { ticker, threshold: threshold ? parseFloat(threshold) : null },
                    }),
                });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                overlay.remove();
                fetchAlerts();
            } catch (err) {
                DOM.status.textContent = `Error creating alert: ${err.message}`;
            }
        });
    }

    async function testTelegram() {
        DOM.status.innerHTML = '<span class="spinner"></span> Testing Telegram...';
        try {
            const resp = await fetch("/api/alerts/test", { method: "POST" });
            const data = await resp.json();
            if (data.error) throw new Error(data.error);
            DOM.status.textContent = data.message || "Test sent!";
        } catch (err) {
            DOM.status.textContent = `Telegram: ${err.message}`;
        }
    }

    function onActivate() {
        if (!loaded) { init(); loaded = true; }
    }

    function onDeactivate() {}

    return { onActivate, onDeactivate };
})();
