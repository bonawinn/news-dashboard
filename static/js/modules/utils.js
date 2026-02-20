// Shared utilities for Alpha Terminal
const Utils = (() => {
    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function escapeAttr(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function formatNumber(n, decimals = 2) {
        if (n === null || n === undefined || isNaN(n)) return "—";
        if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(1) + "T";
        if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + "B";
        if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
        if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
        return Number(n).toFixed(decimals);
    }

    function formatPct(n) {
        if (n === null || n === undefined || isNaN(n)) return "—";
        return Number(n).toFixed(2) + "%";
    }

    function formatUSD(n) {
        if (n === null || n === undefined || isNaN(n)) return "—";
        return "$" + formatNumber(n);
    }

    function colorClass(val) {
        if (val > 0) return "num-pos";
        if (val < 0) return "num-neg";
        return "";
    }

    // Generate inline SVG sparkline from an array of numbers
    function sparklineSVG(data, opts = {}) {
        const w = opts.width || 80;
        const h = opts.height || 24;
        const color = opts.color || "#6c8cff";

        if (!data || data.length < 2) {
            return `<svg width="${w}" height="${h}"></svg>`;
        }

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const step = w / (data.length - 1);

        const points = data.map((v, i) => {
            const x = (i * step).toFixed(1);
            const y = (h - 2 - ((v - min) / range) * (h - 4)).toFixed(1);
            return `${x},${y}`;
        }).join(" ");

        return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="vertical-align:middle">
            <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>`;
    }

    // Generate inline SVG gauge (semicircle) for 0-100 value
    function gaugeSVG(value, opts = {}) {
        const size = opts.size || 120;
        const r = size * 0.38;
        const cx = size / 2;
        const cy = size * 0.55;
        const strokeW = size * 0.08;

        const pct = Math.max(0, Math.min(100, value || 0));
        const angle = (pct / 100) * 180;

        // Background arc (full semicircle)
        const bgArc = describeArc(cx, cy, r, 180, 360);
        // Value arc
        const valArc = describeArc(cx, cy, r, 180, 180 + angle);

        // Color gradient: green -> yellow -> red
        let color;
        if (pct < 30) color = "#34d399";
        else if (pct < 60) color = "#fbbf24";
        else color = "#f87171";

        return `<svg width="${size}" height="${size * 0.65}" viewBox="0 0 ${size} ${size * 0.65}">
            <path d="${bgArc}" fill="none" stroke="#2a2e45" stroke-width="${strokeW}" stroke-linecap="round"/>
            <path d="${valArc}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round"/>
        </svg>`;
    }

    function describeArc(cx, cy, r, startAngle, endAngle) {
        const start = polarToCartesian(cx, cy, r, endAngle);
        const end = polarToCartesian(cx, cy, r, startAngle);
        const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
    }

    function polarToCartesian(cx, cy, r, angleDeg) {
        const rad = (angleDeg - 90) * Math.PI / 180;
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad),
        };
    }

    // Sortable table helper
    function makeSortable(table) {
        const headers = table.querySelectorAll("th[data-sort]");
        headers.forEach(th => {
            th.addEventListener("click", () => {
                const key = th.dataset.sort;
                const tbody = table.querySelector("tbody");
                const rows = Array.from(tbody.querySelectorAll("tr"));
                const isNum = th.dataset.type === "num";
                const asc = th.classList.contains("sort-asc");

                headers.forEach(h => h.classList.remove("sort-asc", "sort-desc"));
                th.classList.add(asc ? "sort-desc" : "sort-asc");

                rows.sort((a, b) => {
                    let va = a.querySelector(`td[data-key="${key}"]`)?.textContent.trim() || "";
                    let vb = b.querySelector(`td[data-key="${key}"]`)?.textContent.trim() || "";
                    if (isNum) {
                        va = parseFloat(va.replace(/[^0-9.\-]/g, "")) || 0;
                        vb = parseFloat(vb.replace(/[^0-9.\-]/g, "")) || 0;
                    }
                    const cmp = isNum ? va - vb : va.localeCompare(vb);
                    return asc ? -cmp : cmp;
                });

                rows.forEach(r => tbody.appendChild(r));
            });
        });
    }

    return {
        escapeHtml,
        escapeAttr,
        formatNumber,
        formatPct,
        formatUSD,
        colorClass,
        sparklineSVG,
        gaugeSVG,
        makeSortable,
    };
})();
