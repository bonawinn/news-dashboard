// Macro Dashboard module
const MacroModule = (() => {
    let loaded = false;
    let initialized = false;
    const DOM = {};

    function init() {
        DOM.status = document.getElementById("macro-status");
        DOM.content = document.getElementById("macro-content");
    }

    async function loadDashboard() {
        DOM.status.innerHTML = '<span class="spinner"></span> Checking FRED configuration...';
        DOM.content.innerHTML = "";

        try {
            // Check if FRED is configured
            const statusResp = await fetch("/api/macro/status");
            const statusData = await statusResp.json();

            if (statusData.status === "not_implemented") {
                DOM.content.innerHTML = `<div class="setup-box"><h3>Coming Soon</h3><p>${Utils.escapeHtml(statusData.message || "")}</p></div>`;
                DOM.status.textContent = "";
                return;
            }

            if (!statusData.configured) {
                DOM.content.innerHTML = `
                    <div class="setup-box">
                        <h3>FRED API Key Required</h3>
                        <p>The macro dashboard needs a free FRED API key.</p>
                        <p>1. Sign up at <code>https://fred.stlouisfed.org/docs/api/api_key.html</code></p>
                        <p>2. Add to your <code>.env</code> file:</p>
                        <p><code>FRED_API_KEY=your_key_here</code></p>
                        <p>3. Restart the server.</p>
                    </div>
                `;
                DOM.status.textContent = "";
                return;
            }

            // Fetch overview
            DOM.status.innerHTML = '<span class="spinner"></span> Loading macro indicators...';
            const overResp = await fetch("/api/macro/overview");
            const overData = await overResp.json();
            if (overData.error) throw new Error(overData.error);

            // Fetch recession gauge
            let recession = null;
            try {
                const recResp = await fetch("/api/macro/recession");
                recession = await recResp.json();
            } catch (_) {}

            renderDashboard(overData, recession);
            DOM.status.textContent = "";
        } catch (err) {
            DOM.status.textContent = `Error: ${err.message}`;
        }
    }

    function renderDashboard(overData, recession) {
        let html = "";

        // Recession gauge
        if (recession && recession.probability !== undefined) {
            const pct = recession.probability;
            html += `
                <div class="gauge-container">
                    <div class="gauge-label">Recession Probability</div>
                    ${Utils.gaugeSVG(pct, { size: 140 })}
                    <div class="gauge-value ${pct > 50 ? "text-red" : pct > 30 ? "text-yellow" : "text-green"}">${pct.toFixed(1)}%</div>
                </div>
            `;
        }

        // Categories grid
        const categories = overData.categories || {};
        html += '<div class="macro-grid">';

        Object.entries(categories).forEach(([catKey, cat]) => {
            html += `<div class="macro-category"><div class="macro-cat-title">${Utils.escapeHtml(cat.name || catKey)}</div>`;

            (cat.indicators || []).forEach(ind => {
                const sparkline = ind.history && ind.history.length > 1
                    ? `<span class="macro-ind-sparkline">${Utils.sparklineSVG(ind.history, { width: 60, height: 18 })}</span>`
                    : "";

                const changeHtml = ind.change !== undefined
                    ? `<span class="${Utils.colorClass(ind.change)}" style="font-size:0.72rem;margin-left:6px">${ind.change > 0 ? "+" : ""}${Utils.formatNumber(ind.change)}</span>`
                    : "";

                html += `
                    <div class="macro-indicator">
                        <span class="macro-ind-name">${Utils.escapeHtml(ind.name)}</span>
                        <span>
                            <span class="macro-ind-value">${Utils.formatNumber(ind.value)}</span>
                            ${changeHtml}
                            ${sparkline}
                        </span>
                    </div>
                `;
            });

            html += "</div>";
        });

        html += "</div>";
        DOM.content.innerHTML = html;
    }

    function onActivate() {
        if (!loaded) {
            init();
            loaded = true;
        }
        if (!initialized) {
            initialized = true;
            loadDashboard();
        }
    }

    function onDeactivate() {}

    return { onActivate, onDeactivate };
})();
