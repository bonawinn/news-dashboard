// Financial Statements module
const FinancialsModule = (() => {
    let loaded = false;
    const DOM = {};

    function init() {
        DOM.ticker = document.getElementById("fin-ticker");
        DOM.lookupBtn = document.getElementById("fin-lookup");
        DOM.compare = document.getElementById("fin-compare");
        DOM.compareBtn = document.getElementById("fin-compare-btn");
        DOM.status = document.getElementById("fin-status");
        DOM.content = document.getElementById("fin-content");

        DOM.lookupBtn.addEventListener("click", doLookup);
        DOM.ticker.addEventListener("keydown", e => { if (e.key === "Enter") doLookup(); });
        DOM.compareBtn.addEventListener("click", doCompare);
        DOM.compare.addEventListener("keydown", e => { if (e.key === "Enter") doCompare(); });
    }

    async function doLookup() {
        const ticker = DOM.ticker.value.trim().toUpperCase();
        if (!ticker) return;
        DOM.status.innerHTML = '<span class="spinner"></span> Fetching financials...';
        DOM.content.innerHTML = "";

        try {
            const resp = await fetch(`/api/financials/lookup?ticker=${encodeURIComponent(ticker)}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (data.error) throw new Error(data.error);
            renderFinancials(data);
            DOM.status.textContent = "";
        } catch (err) {
            DOM.status.textContent = `Error: ${err.message}`;
        }
    }

    async function doCompare() {
        const raw = DOM.compare.value.trim().toUpperCase();
        if (!raw) return;
        DOM.status.innerHTML = '<span class="spinner"></span> Comparing...';
        DOM.content.innerHTML = "";

        try {
            const resp = await fetch(`/api/financials/compare?tickers=${encodeURIComponent(raw)}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (data.error) throw new Error(data.error);
            renderComparison(data);
            DOM.status.textContent = "";
        } catch (err) {
            DOM.status.textContent = `Error: ${err.message}`;
        }
    }

    function renderFinancials(data) {
        if (data.status === "not_implemented") {
            DOM.content.innerHTML = `<div class="setup-box"><h3>Coming Soon</h3><p>${Utils.escapeHtml(data.message || "")}</p></div>`;
            return;
        }

        const metrics = data.metrics || {};
        const statements = data.statements || {};
        const ticker = data.ticker || "";

        // Metrics grid
        let metricsHtml = `<h3 style="margin-bottom:12px">${Utils.escapeHtml(ticker)} Key Metrics</h3><div class="metrics-grid">`;
        const metricList = [
            ["Revenue", Utils.formatUSD(metrics.revenue)],
            ["Net Income", Utils.formatUSD(metrics.net_income)],
            ["Gross Margin", Utils.formatPct(metrics.gross_margin)],
            ["Operating Margin", Utils.formatPct(metrics.operating_margin)],
            ["Net Margin", Utils.formatPct(metrics.net_margin)],
            ["ROE", Utils.formatPct(metrics.roe)],
            ["ROA", Utils.formatPct(metrics.roa)],
            ["Current Ratio", Utils.formatNumber(metrics.current_ratio)],
            ["Debt/Equity", Utils.formatNumber(metrics.debt_to_equity)],
            ["FCF", Utils.formatUSD(metrics.free_cash_flow)],
            ["EPS", Utils.formatNumber(metrics.eps)],
            ["P/E Ratio", Utils.formatNumber(metrics.pe_ratio)],
            ["Revenue Growth", Utils.formatPct(metrics.revenue_growth)],
            ["Earnings Growth", Utils.formatPct(metrics.earnings_growth)],
        ];

        metricList.forEach(([label, value]) => {
            metricsHtml += `<div class="metric-card"><div class="metric-label">${label}</div><div class="metric-value">${value}</div></div>`;
        });
        metricsHtml += "</div>";

        // Tabs for statements
        const tabs = [
            ["income", "Income Statement"],
            ["balance", "Balance Sheet"],
            ["cashflow", "Cash Flow"],
        ];

        let tabBar = '<div class="tab-bar">';
        let tabPanels = "";

        tabs.forEach(([key, label], i) => {
            tabBar += `<button class="tab-btn ${i === 0 ? "active" : ""}" data-tab="${key}">${label}</button>`;
            const stData = statements[key] || {};
            let tableHtml = buildStatementTable(stData);
            tabPanels += `<div class="tab-panel ${i === 0 ? "active" : ""}" data-tab="${key}">${tableHtml}</div>`;
        });
        tabBar += "</div>";

        DOM.content.innerHTML = metricsHtml + tabBar + tabPanels;

        // Tab switching
        DOM.content.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                DOM.content.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
                DOM.content.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
                btn.classList.add("active");
                DOM.content.querySelector(`.tab-panel[data-tab="${btn.dataset.tab}"]`).classList.add("active");
            });
        });
    }

    function buildStatementTable(data) {
        if (!data || !Object.keys(data).length) return '<p class="text-muted">No data available</p>';

        // data is { "line_item": value, ... } or { "line_item": [year1, year2, ...] }
        let html = '<table class="data-table"><thead><tr><th>Item</th>';
        const years = data._years || [];
        years.forEach(y => { html += `<th>${y}</th>`; });
        if (!years.length) html += "<th>Value</th>";
        html += "</tr></thead><tbody>";

        Object.entries(data).forEach(([key, val]) => {
            if (key === "_years") return;
            html += `<tr><td>${Utils.escapeHtml(key)}</td>`;
            if (Array.isArray(val)) {
                val.forEach(v => {
                    html += `<td class="${Utils.colorClass(v)}">${Utils.formatNumber(v)}</td>`;
                });
            } else {
                html += `<td class="${Utils.colorClass(val)}">${Utils.formatNumber(val)}</td>`;
            }
            html += "</tr>";
        });

        html += "</tbody></table>";
        return html;
    }

    function renderComparison(data) {
        if (data.status === "not_implemented") {
            DOM.content.innerHTML = `<div class="setup-box"><h3>Coming Soon</h3><p>${Utils.escapeHtml(data.message || "")}</p></div>`;
            return;
        }

        const companies = data.companies || [];
        if (!companies.length) { DOM.content.innerHTML = '<p class="text-muted">No data</p>'; return; }

        const metricKeys = [
            "revenue", "net_income", "gross_margin", "operating_margin",
            "net_margin", "roe", "roa", "current_ratio", "debt_to_equity",
            "free_cash_flow", "eps", "pe_ratio", "revenue_growth", "earnings_growth",
        ];

        let html = '<table class="data-table"><thead><tr><th>Metric</th>';
        companies.forEach(c => { html += `<th>${Utils.escapeHtml(c.ticker)}</th>`; });
        html += "</tr></thead><tbody>";

        metricKeys.forEach(key => {
            const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            html += `<tr><td>${label}</td>`;
            companies.forEach(c => {
                const v = (c.metrics || {})[key];
                const isPct = key.includes("margin") || key.includes("growth") || key === "roe" || key === "roa";
                html += `<td class="${Utils.colorClass(v)}">${isPct ? Utils.formatPct(v) : Utils.formatNumber(v)}</td>`;
            });
            html += "</tr>";
        });

        html += "</tbody></table>";
        DOM.content.innerHTML = html;
    }

    function onActivate() {
        if (!loaded) { init(); loaded = true; }
    }

    function onDeactivate() {}

    return { onActivate, onDeactivate };
})();
