// Equity Screener module
const ScreenerModule = (() => {
    let loaded = false;
    let templates = {};
    const DOM = {};

    const FILTER_DEFS = [
        { key: "roe_min", label: "ROE Min (%)", type: "num" },
        { key: "pe_max", label: "P/E Max", type: "num" },
        { key: "pb_max", label: "P/B Max", type: "num" },
        { key: "debt_equity_max", label: "Debt/Equity Max", type: "num" },
        { key: "market_cap_min", label: "Mkt Cap Min ($)", type: "num" },
        { key: "dividend_yield_min", label: "Div Yield Min (%)", type: "num" },
        { key: "payout_ratio_max", label: "Payout Max (%)", type: "num" },
        { key: "revenue_growth_min", label: "Rev Growth Min (%)", type: "num" },
        { key: "gross_margin_min", label: "Gross Margin Min (%)", type: "num" },
        { key: "52w_change_min", label: "52W Change Min (%)", type: "num" },
    ];

    function init() {
        DOM.template = document.getElementById("screener-template");
        DOM.runBtn = document.getElementById("screener-run");
        DOM.filters = document.getElementById("screener-filters");
        DOM.status = document.getElementById("screener-status");
        DOM.results = document.getElementById("screener-results");

        DOM.runBtn.addEventListener("click", runScreen);
        DOM.template.addEventListener("change", onTemplateChange);

        fetchTemplates();
        renderFilterGrid();
    }

    async function fetchTemplates() {
        try {
            const resp = await fetch("/api/screener/templates");
            if (!resp.ok) return;
            const data = await resp.json();
            templates = data.templates || {};
            Object.entries(templates).forEach(([key, tpl]) => {
                const opt = document.createElement("option");
                opt.value = key;
                opt.textContent = tpl.name || key;
                DOM.template.appendChild(opt);
            });
        } catch (_) {}
    }

    function renderFilterGrid() {
        let html = '<div class="filter-grid">';
        FILTER_DEFS.forEach(f => {
            html += `
                <div class="filter-item">
                    <label for="filter-${f.key}">${f.label}</label>
                    <input type="number" id="filter-${f.key}" data-filter="${f.key}" step="any">
                </div>
            `;
        });
        html += "</div>";
        DOM.filters.innerHTML = html;
    }

    function onTemplateChange() {
        const key = DOM.template.value;
        // Clear all
        FILTER_DEFS.forEach(f => {
            document.getElementById(`filter-${f.key}`).value = "";
        });

        if (key && templates[key]) {
            const filters = templates[key].filters || {};
            Object.entries(filters).forEach(([k, v]) => {
                const el = document.getElementById(`filter-${k}`);
                if (el) el.value = v;
            });
        }
    }

    async function runScreen() {
        const tplKey = DOM.template.value;
        DOM.status.innerHTML = '<span class="spinner"></span> Running screen...';
        DOM.results.innerHTML = "";

        let url;
        if (tplKey && templates[tplKey]) {
            url = `/api/screener/template/${encodeURIComponent(tplKey)}`;
        } else {
            const params = new URLSearchParams();
            FILTER_DEFS.forEach(f => {
                const el = document.getElementById(`filter-${f.key}`);
                if (el && el.value !== "") params.set(f.key, el.value);
            });
            url = `/api/screener/screen?${params}`;
        }

        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (data.error) throw new Error(data.error);
            renderResults(data);
            DOM.status.textContent = `${(data.results || []).length} stocks found`;
        } catch (err) {
            DOM.status.textContent = `Error: ${err.message}`;
        }
    }

    function renderResults(data) {
        if (data.status === "not_implemented") {
            DOM.results.innerHTML = `<div class="setup-box"><h3>Coming Soon</h3><p>${Utils.escapeHtml(data.message || "")}</p></div>`;
            return;
        }

        const rows = data.results || [];
        if (!rows.length) { DOM.results.innerHTML = '<p class="text-muted">No stocks match filters.</p>'; return; }

        const cols = [
            { key: "ticker", label: "Ticker", type: "str" },
            { key: "name", label: "Name", type: "str" },
            { key: "price", label: "Price", type: "num" },
            { key: "pe_ratio", label: "P/E", type: "num" },
            { key: "pb_ratio", label: "P/B", type: "num" },
            { key: "roe", label: "ROE%", type: "num" },
            { key: "dividend_yield", label: "Div%", type: "num" },
            { key: "market_cap", label: "Mkt Cap", type: "num" },
            { key: "52w_change", label: "52W%", type: "num" },
        ];

        let html = '<table class="data-table"><thead><tr>';
        cols.forEach(c => {
            html += `<th data-sort="${c.key}" data-type="${c.type}">${c.label}</th>`;
        });
        html += "</tr></thead><tbody>";

        rows.forEach(r => {
            html += "<tr>";
            cols.forEach(c => {
                let v = r[c.key];
                let display;
                if (c.key === "ticker") display = `<span class="text-accent">${Utils.escapeHtml(v || "")}</span>`;
                else if (c.key === "market_cap") display = Utils.formatUSD(v);
                else if (c.type === "num") display = `<span class="${Utils.colorClass(v)}">${Utils.formatNumber(v)}</span>`;
                else display = Utils.escapeHtml(String(v || ""));
                html += `<td data-key="${c.key}">${display}</td>`;
            });
            html += "</tr>";
        });

        html += "</tbody></table>";
        DOM.results.innerHTML = html;

        Utils.makeSortable(DOM.results.querySelector(".data-table"));
    }

    function onActivate() {
        if (!loaded) { init(); loaded = true; }
    }

    function onDeactivate() {}

    return { onActivate, onDeactivate };
})();
