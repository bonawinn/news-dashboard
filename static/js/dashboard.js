(() => {
    const DOM = {
        searchBox: document.getElementById("search-box"),
        freshnessSelect: document.getElementById("freshness-select"),
        refreshBtn: document.getElementById("refresh-btn"),
        autoRefreshCb: document.getElementById("auto-refresh-cb"),
        tickerBar: document.getElementById("ticker-bar"),
        status: document.getElementById("status"),
        newsGrid: document.getElementById("news-grid"),
    };

    let articles = [];
    let stockData = {};
    let autoRefreshTimer = null;
    const AUTO_REFRESH_MS = 5 * 60 * 1000;

    // --- API calls ---

    async function fetchNews() {
        const q = DOM.searchBox.value.trim();
        const freshness = DOM.freshnessSelect.value;
        const params = new URLSearchParams({ freshness });
        if (q) params.set("q", q);

        DOM.status.innerHTML = '<span class="spinner"></span> Loading headlines...';
        DOM.refreshBtn.disabled = true;

        try {
            const resp = await fetch(`/api/news?${params}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            articles = data.articles || [];
            renderNews(articles);
            DOM.status.textContent = `${articles.length} headlines loaded`;

            // Fetch stock data for extracted tickers
            const tickers = data.tickers || [];
            if (tickers.length > 0) {
                fetchStocks(tickers.slice(0, 25));
            }
        } catch (err) {
            DOM.status.textContent = `Error loading news: ${err.message}`;
        } finally {
            DOM.refreshBtn.disabled = false;
        }
    }

    async function fetchStocks(tickers) {
        if (!tickers.length) return;
        try {
            const resp = await fetch(`/api/stocks?tickers=${tickers.join(",")}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            stockData = await resp.json();
            patchStockData();
            renderTickerBar();
        } catch (err) {
            console.error("Failed to fetch stock data:", err);
        }
    }

    // --- Rendering ---

    function renderNews(list) {
        if (!list.length) {
            DOM.newsGrid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;">No headlines found.</p>';
            return;
        }

        DOM.newsGrid.innerHTML = list.map((art, i) => {
            const tickers = (art.tickers || []).map(t => {
                const sd = stockData[t];
                const cls = sd ? (sd.change >= 0 ? "up" : "down") : "";
                const priceStr = sd ? `$${sd.price} ${sd.change >= 0 ? "+" : ""}${sd.change_pct}%` : "";
                return `<span class="chip ${cls}" data-ticker="${t}">${t}${priceStr ? " " + priceStr : ""}</span>`;
            }).join("");

            const source = art.source || "";
            const desc = art.description || "";

            return `
                <div class="news-card" data-index="${i}">
                    <a href="${escapeAttr(art.url)}" target="_blank" rel="noopener">${escapeHtml(art.title)}</a>
                    <div class="news-meta">
                        <span class="source">${escapeHtml(source)}</span>
                        ${art.age ? `<span>${escapeHtml(art.age)}</span>` : ""}
                    </div>
                    ${desc ? `<p class="news-desc">${escapeHtml(desc)}</p>` : ""}
                    ${tickers ? `<div class="news-tickers">${tickers}</div>` : ""}
                </div>
            `;
        }).join("");
    }

    function patchStockData() {
        document.querySelectorAll(".chip[data-ticker]").forEach(chip => {
            const t = chip.dataset.ticker;
            const sd = stockData[t];
            if (!sd || sd.price == null) return;
            chip.className = `chip ${sd.change >= 0 ? "up" : "down"}`;
            const sign = sd.change >= 0 ? "+" : "";
            chip.textContent = `${t} $${sd.price} ${sign}${sd.change_pct}%`;
        });
    }

    function renderTickerBar() {
        const entries = Object.values(stockData).filter(s => s.price != null);
        entries.sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct));

        DOM.tickerBar.innerHTML = entries.map(s => {
            const cls = s.change >= 0 ? "up" : "down";
            const sign = s.change >= 0 ? "+" : "";
            return `<div class="ticker-badge ${cls}">
                <span class="sym">${s.ticker}</span>
                $${s.price}
                <span>${sign}${s.change_pct}%</span>
            </div>`;
        }).join("");
    }

    // --- Client-side filtering ---

    function filterNews() {
        const q = DOM.searchBox.value.trim().toLowerCase();
        if (!q) {
            renderNews(articles);
            patchStockData();
            return;
        }
        const filtered = articles.filter(art => {
            const haystack = `${art.title} ${art.description} ${(art.tickers || []).join(" ")}`.toLowerCase();
            return haystack.includes(q);
        });
        renderNews(filtered);
        patchStockData();
    }

    // --- Auto-refresh ---

    function startAutoRefresh() {
        stopAutoRefresh();
        if (DOM.autoRefreshCb.checked) {
            autoRefreshTimer = setInterval(fetchNews, AUTO_REFRESH_MS);
        }
    }

    function stopAutoRefresh() {
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
    }

    // --- Event listeners ---

    DOM.refreshBtn.addEventListener("click", () => {
        fetchNews();
    });

    DOM.freshnessSelect.addEventListener("change", () => {
        fetchNews();
    });

    let filterTimeout;
    DOM.searchBox.addEventListener("input", () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            // If search looks like a query (long text), filter client-side
            // Press Enter to do a server search
            filterNews();
        }, 250);
    });

    DOM.searchBox.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            fetchNews();
        }
    });

    DOM.autoRefreshCb.addEventListener("change", () => {
        startAutoRefresh();
    });

    // --- Helpers ---

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function escapeAttr(str) {
        return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // --- Init ---

    fetchNews();
})();
