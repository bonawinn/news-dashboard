// Insider Trading module
const InsidersModule = (() => {
    let loaded = false;
    const DOM = {};

    function init() {
        DOM.ticker = document.getElementById("insider-ticker");
        DOM.days = document.getElementById("insider-days");
        DOM.searchBtn = document.getElementById("insider-search");
        DOM.clustersBtn = document.getElementById("insider-clusters");
        DOM.status = document.getElementById("insider-status");
        DOM.content = document.getElementById("insider-content");

        DOM.searchBtn.addEventListener("click", searchTrades);
        DOM.ticker.addEventListener("keydown", e => { if (e.key === "Enter") searchTrades(); });
        DOM.clustersBtn.addEventListener("click", fetchClusters);
    }

    async function searchTrades() {
        const ticker = DOM.ticker.value.trim().toUpperCase();
        const days = DOM.days.value;
        DOM.status.innerHTML = '<span class="spinner"></span> Fetching insider trades...';
        DOM.content.innerHTML = "";

        const params = new URLSearchParams({ days });
        if (ticker) params.set("ticker", ticker);

        try {
            const resp = await fetch(`/api/insiders/trades?${params}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (data.error) throw new Error(data.error);
            renderTrades(data);
            DOM.status.textContent = `${(data.trades || []).length} trades found`;
        } catch (err) {
            DOM.status.textContent = `Error: ${err.message}`;
        }
    }

    async function fetchClusters() {
        DOM.status.innerHTML = '<span class="spinner"></span> Detecting buying clusters...';
        DOM.content.innerHTML = "";

        try {
            const resp = await fetch("/api/insiders/clusters");
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (data.error) throw new Error(data.error);
            renderClusters(data);
            DOM.status.textContent = `${(data.clusters || []).length} clusters detected`;
        } catch (err) {
            DOM.status.textContent = `Error: ${err.message}`;
        }
    }

    function renderTrades(data) {
        if (data.status === "not_implemented") {
            DOM.content.innerHTML = `<div class="setup-box"><h3>Coming Soon</h3><p>${Utils.escapeHtml(data.message || "")}</p></div>`;
            return;
        }

        const trades = data.trades || [];
        if (!trades.length) { DOM.content.innerHTML = '<p class="text-muted">No insider trades found.</p>'; return; }

        let html = '<table class="data-table"><thead><tr>';
        ["Date", "Ticker", "Insider", "Title", "Type", "Shares", "Price", "Value"].forEach(h => {
            html += `<th>${h}</th>`;
        });
        html += "</tr></thead><tbody>";

        trades.forEach(t => {
            const isBuy = (t.trade_type || "").toLowerCase().includes("buy") || (t.trade_type || "").toLowerCase().includes("purchase");
            const typeClass = isBuy ? "text-green" : "text-red";
            html += `<tr>
                <td>${Utils.escapeHtml(t.filing_date || "")}</td>
                <td class="text-accent">${Utils.escapeHtml(t.ticker || "")}</td>
                <td>${Utils.escapeHtml(t.insider_name || "")}</td>
                <td class="text-muted">${Utils.escapeHtml(t.title || "")}</td>
                <td class="${typeClass}">${Utils.escapeHtml(t.trade_type || "")}</td>
                <td>${Utils.formatNumber(t.shares, 0)}</td>
                <td>${Utils.formatUSD(t.price)}</td>
                <td>${Utils.formatUSD(t.value)}</td>
            </tr>`;
        });

        html += "</tbody></table>";
        DOM.content.innerHTML = html;
    }

    function renderClusters(data) {
        if (data.status === "not_implemented") {
            DOM.content.innerHTML = `<div class="setup-box"><h3>Coming Soon</h3><p>${Utils.escapeHtml(data.message || "")}</p></div>`;
            return;
        }

        const clusters = data.clusters || [];
        if (!clusters.length) { DOM.content.innerHTML = '<p class="text-muted">No buying clusters detected.</p>'; return; }

        DOM.content.innerHTML = clusters.map(c => `
            <div class="cluster-card">
                <div class="cluster-header">
                    <span class="cluster-ticker">${Utils.escapeHtml(c.ticker)}</span>
                    <span class="cluster-count">${c.insider_count} insiders buying</span>
                </div>
                <table class="data-table">
                    <thead><tr><th>Insider</th><th>Date</th><th>Shares</th><th>Value</th></tr></thead>
                    <tbody>
                        ${(c.trades || []).map(t => `
                            <tr>
                                <td>${Utils.escapeHtml(t.insider_name || "")}</td>
                                <td>${Utils.escapeHtml(t.filing_date || "")}</td>
                                <td>${Utils.formatNumber(t.shares, 0)}</td>
                                <td>${Utils.formatUSD(t.value)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `).join("");
    }

    function onActivate() {
        if (!loaded) { init(); loaded = true; }
    }

    function onDeactivate() {}

    return { onActivate, onDeactivate };
})();
