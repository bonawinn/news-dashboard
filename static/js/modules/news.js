// News & Sentiment module
const NewsModule = (() => {
    let articles = [];
    let activeSource = null;
    let autoRefreshTimer = null;
    const AUTO_REFRESH_MS = 5 * 60 * 1000;
    let loaded = false;

    const DOM = {};

    function init() {
        DOM.search = document.getElementById("news-search");
        DOM.freshness = document.getElementById("news-freshness");
        DOM.refreshBtn = document.getElementById("news-refresh");
        DOM.autoRefreshCb = document.getElementById("news-auto-refresh");
        DOM.sentimentBar = document.getElementById("news-sentiment-bar");
        DOM.sourceFilters = document.getElementById("news-source-filters");
        DOM.status = document.getElementById("news-status");
        DOM.list = document.getElementById("news-list");

        DOM.refreshBtn.addEventListener("click", fetchNews);
        DOM.freshness.addEventListener("change", fetchNews);

        let filterTimeout;
        DOM.search.addEventListener("input", () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(() => renderNews(getVisible()), 250);
        });

        DOM.search.addEventListener("keydown", (e) => {
            if (e.key === "Enter") { e.preventDefault(); fetchNews(); }
        });

        DOM.autoRefreshCb.addEventListener("change", () => {
            stopAutoRefresh();
            if (DOM.autoRefreshCb.checked) {
                autoRefreshTimer = setInterval(fetchNews, AUTO_REFRESH_MS);
            }
        });

        DOM.sourceFilters.addEventListener("click", (e) => {
            const btn = e.target.closest(".source-btn");
            if (!btn) return;
            activeSource = btn.dataset.source || null;
            renderSourceFilters();
            renderNews(getVisible());
        });
    }

    async function fetchNews() {
        const q = DOM.search.value.trim();
        const freshness = DOM.freshness.value;
        const params = new URLSearchParams({ freshness });
        if (q) params.set("q", q);

        DOM.status.innerHTML = '<span class="spinner"></span> Loading headlines...';
        DOM.refreshBtn.disabled = true;

        try {
            const resp = await fetch(`/api/news?${params}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            articles = data.articles || [];
            activeSource = null;
            renderSourceFilters();
            renderSentimentBar();
            renderNews(getVisible());
            DOM.status.textContent = `${articles.length} headlines loaded`;
        } catch (err) {
            DOM.status.textContent = `Error: ${err.message}`;
        } finally {
            DOM.refreshBtn.disabled = false;
        }
    }

    function stopAutoRefresh() {
        if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
    }

    function getVisible() {
        let list = articles;
        if (activeSource) {
            list = list.filter(a => (a.source || "") === activeSource);
        }
        const q = DOM.search.value.trim().toLowerCase();
        if (q) {
            list = list.filter(a => {
                const hay = `${a.title} ${a.description} ${(a.tickers || []).join(" ")}`.toLowerCase();
                return hay.includes(q);
            });
        }
        return list;
    }

    function renderSourceFilters() {
        const counts = {};
        articles.forEach(a => {
            const s = a.source || "";
            if (s) counts[s] = (counts[s] || 0) + 1;
        });
        const sources = Object.keys(counts).sort();

        if (!sources.length) { DOM.sourceFilters.innerHTML = ""; return; }

        const allBtn = `<button class="source-btn ${!activeSource ? "active" : ""}" data-source="">All <span class="count">(${articles.length})</span></button>`;
        const btns = sources.map(s =>
            `<button class="source-btn ${activeSource === s ? "active" : ""}" data-source="${Utils.escapeAttr(s)}">${Utils.escapeHtml(s)} <span class="count">(${counts[s]})</span></button>`
        ).join("");

        DOM.sourceFilters.innerHTML =
            `<span class="source-label">Filter by source</span>` +
            `<div class="source-list">${allBtn}${btns}</div>`;
    }

    function renderSentimentBar() {
        let bull = 0, bear = 0, neut = 0;
        articles.forEach(a => {
            const s = a.sentiment;
            if (s === "bullish") bull++;
            else if (s === "bearish") bear++;
            else neut++;
        });
        const total = articles.length || 1;
        const bp = ((bull / total) * 100).toFixed(1);
        const np = ((neut / total) * 100).toFixed(1);
        const rp = ((bear / total) * 100).toFixed(1);

        if (!articles.length || (!bull && !bear)) {
            DOM.sentimentBar.innerHTML = "";
            return;
        }

        DOM.sentimentBar.innerHTML = `
            <div class="sentiment-summary">
                <div class="sentiment-counts">
                    <span class="text-green">${bull} Bull</span>
                    <span class="text-muted">${neut} Neutral</span>
                    <span class="text-red">${bear} Bear</span>
                </div>
                <div class="sentiment-meter">
                    <div class="bar-bull" style="width:${bp}%"></div>
                    <div class="bar-neutral" style="width:${np}%"></div>
                    <div class="bar-bear" style="width:${rp}%"></div>
                </div>
            </div>
        `;
    }

    function renderNews(list) {
        if (!list.length) {
            DOM.list.innerHTML = '<li class="status-msg">No headlines found.</li>';
            return;
        }

        DOM.list.innerHTML = list.map((art) => {
            const source = art.source || "";
            const desc = art.description || "";
            const tooltipHtml = desc ? `<div class="tooltip">${Utils.escapeHtml(desc)}</div>` : "";
            const sentBadge = art.sentiment
                ? `<span class="sentiment-badge ${art.sentiment}">${art.sentiment}</span>`
                : "";

            return `
                <li class="news-row">
                    <span class="source">${Utils.escapeHtml(source)}</span>
                    <span class="headline">
                        <a href="${Utils.escapeAttr(art.url)}" target="_blank" rel="noopener">${Utils.escapeHtml(art.title)}</a>
                    </span>
                    ${sentBadge}
                    ${art.age ? `<span class="age">${Utils.escapeHtml(art.age)}</span>` : ""}
                    ${tooltipHtml}
                </li>
            `;
        }).join("");
    }

    function onActivate() {
        if (!loaded) {
            init();
            loaded = true;
            fetchNews();
        }
    }

    function onDeactivate() {
        // No-op; auto-refresh continues if enabled
    }

    return { onActivate, onDeactivate };
})();
