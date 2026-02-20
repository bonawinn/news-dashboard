// Alpha Terminal — Section Router / Orchestrator
(() => {
    const SECTIONS = {
        news:       { title: "News & Sentiment",    module: NewsModule },
        financials: { title: "Financial Statements", module: FinancialsModule },
        screener:   { title: "Equity Screener",      module: ScreenerModule },
        insiders:   { title: "Insider Trading",      module: InsidersModule },
        macro:      { title: "Macro Dashboard",      module: MacroModule },
        alerts:     { title: "Alerts",               module: AlertsModule },
    };

    let currentSection = "news";

    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sectionTitle = document.getElementById("section-title");

    // Sidebar toggle
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        sidebar.classList.toggle("mobile-open");
    });

    // Nav button clicks
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            switchSection(btn.dataset.section);
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove("mobile-open");
            }
        });
    });

    function switchSection(name) {
        if (!SECTIONS[name]) return;

        // Deactivate current
        if (currentSection && SECTIONS[currentSection]) {
            SECTIONS[currentSection].module.onDeactivate();
        }

        currentSection = name;

        // Update nav buttons
        document.querySelectorAll(".nav-btn").forEach(b => {
            b.classList.toggle("active", b.dataset.section === name);
        });

        // Update section visibility
        document.querySelectorAll(".section").forEach(s => {
            s.classList.toggle("active", s.id === `section-${name}`);
        });

        // Update header title
        sectionTitle.textContent = SECTIONS[name].title;

        // Activate new section (lazy-loads on first visit)
        SECTIONS[name].module.onActivate();
    }

    // Initialize with the news section
    switchSection("news");
})();
