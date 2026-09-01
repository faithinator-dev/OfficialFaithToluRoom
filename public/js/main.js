/* =========================================================
   FAITH TOLU — CINEMATIC PORTFOLIO
   Production Frontend Controller
   HTML + CSS + Vanilla JavaScript
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
       ===================================================== */

    const CONFIG = Object.freeze({
        API_URL: "/api/projects",
        REQUEST_TIMEOUT: 10000,
        MAX_PROJECTS: 100,
        DEFAULT_FILTER: "All",
        SEARCH_DEBOUNCE: 250
    });

    /* =====================================================
       STATE
       ===================================================== */

    const state = {
        projects: [],
        filteredProjects: [],
        activeFilter: CONFIG.DEFAULT_FILTER,
        searchQuery: "",
        selectedProject: null,
        loading: false,
        error: null
    };

    /* =====================================================
       DOM
       ===================================================== */

    const DOM = {
        projectsGrid: document.querySelector("#projectsGrid"),
        filters: document.querySelector("#projectFilters"),
        search: document.querySelector("#projectSearch"),
        projectCount: document.querySelector("#projectCount"),

        modal: document.querySelector("#projectModal"),
        modalTitle: document.querySelector("#modalTitle"),
        modalBadge: document.querySelector("#modalBadge"),
        modalDescription: document.querySelector("#modalDescription"),
        modalGithub: document.querySelector("#modalGithub"),
        modalLive: document.querySelector("#modalLive"),
        modalClose: document.querySelector("#modalClose"),

        menuToggle: document.querySelector("#menuToggle"),
        navbar: document.querySelector(".navbar"),

        year: document.querySelector("#year")
    };

    /* =====================================================
       INITIALIZATION
       ===================================================== */

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        setupGlobalEvents();
        setupNavigation();
        setupRevealObserver();
        setupCinematicPointer();

        if (DOM.year) {
            DOM.year.textContent = new Date().getFullYear();
        }

        await loadProjects();
    }

    /* =====================================================
       API
       ===================================================== */

    async function loadProjects() {
        if (state.loading) return;

        state.loading = true;
        state.error = null;

        renderLoadingState();

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, CONFIG.REQUEST_TIMEOUT);

        try {
            const response = await fetch(CONFIG.API_URL, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                },
                signal: controller.signal,
                cache: "no-store"
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(
                    `Projects API returned HTTP ${response.status}`
                );
            }

            const data = await response.json();

            const projects = normalizeProjects(data);

            if (!projects.length) {
                state.projects = [];
                state.filteredProjects = [];

                renderEmptyState();

                return;
            }

            state.projects = projects;

            buildFilters();
            applyFilters();

            handleProjectDeepLink();

        } catch (error) {
            clearTimeout(timeout);

            console.error("[Portfolio] Failed to load projects:", error);

            state.error =
                error.name === "AbortError"
                    ? "The project request took too long."
                    : "We couldn't load the projects right now.";

            renderErrorState();

        } finally {
            state.loading = false;
        }
    }

    /* =====================================================
       NORMALIZATION
       ===================================================== */

    function normalizeProjects(payload) {

        /*
         * Supports:
         *
         * [
         *   {...},
         *   {...}
         * ]
         *
         * OR
         *
         * {
         *   projects: [...]
         * }
         *
         * OR
         *
         * {
         *   data: [...]
         * }
         */

        let rawProjects = [];

        if (Array.isArray(payload)) {
            rawProjects = payload;
        } else if (Array.isArray(payload?.projects)) {
            rawProjects = payload.projects;
        } else if (Array.isArray(payload?.data)) {
            rawProjects = payload.data;
        }

        return rawProjects
            .slice(0, CONFIG.MAX_PROJECTS)
            .map((project, index) => normalizeProject(project, index))
            .filter(Boolean);
    }

    function normalizeProject(project, index) {

        if (!project || typeof project !== "object") {
            return null;
        }

        const title =
            cleanText(project.title) ||
            cleanText(project.name) ||
            `Project ${index + 1}`;

        const id =
            cleanText(project.id) ||
            slugify(title) ||
            `project-${index + 1}`;

        const categories = Array.isArray(project.categories)
            ? project.categories
                .map(cleanText)
                .filter(Boolean)
            : [];

        return {
            id,
            title,

            badge:
                cleanText(project.badge) ||
                "PROJECT",

            badgeColor:
                cleanText(project.badgeColor) ||
                "",

            shortDescription:
                cleanText(project.short_description) ||
                cleanText(project.description) ||
                "A project built by Faith Tolu.",

            description:
                cleanText(project.full_description) ||
                cleanText(project.description) ||
                cleanText(project.short_description) ||
                "No description available.",

            liveLink:
                normalizeUrl(project.liveLink),

            githubLink:
                normalizeUrl(project.githubLink),

            categories,

            featured:
                Boolean(project.featured),

            image:
                normalizeUrl(project.image)
        };
    }

    /* =====================================================
       FILTERS
       ===================================================== */

    function buildFilters() {

        if (!DOM.filters) return;

        const categories = new Set();

        state.projects.forEach(project => {
            project.categories.forEach(category => {
                categories.add(category);
            });
        });

        const sortedCategories = [...categories].sort(
            (a, b) => a.localeCompare(b)
        );

        DOM.filters.replaceChildren();

        const allButton = createFilterButton(
            CONFIG.DEFAULT_FILTER,
            true
        );

        DOM.filters.appendChild(allButton);

        sortedCategories.forEach(category => {
            DOM.filters.appendChild(
                createFilterButton(category)
            );
        });
    }

    function createFilterButton(category, active = false) {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "filter-btn";

        if (active) {
            button.classList.add("active");
        }

        button.dataset.filter = category;

        button.textContent = category;

        button.setAttribute(
            "aria-pressed",
            String(active)
        );

        return button;
    }

    function applyFilters() {

        const query =
            state.searchQuery.trim().toLowerCase();

        state.filteredProjects =
            state.projects.filter(project => {

                const matchesCategory =
                    state.activeFilter === CONFIG.DEFAULT_FILTER ||
                    project.categories.some(
                        category =>
                            category.toLowerCase() ===
                            state.activeFilter.toLowerCase()
                    );

                if (!matchesCategory) {
                    return false;
                }

                if (!query) {
                    return true;
                }

                const searchableText = [
                    project.title,
                    project.badge,
                    project.shortDescription,
                    project.description,
                    ...project.categories
                ]
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(query);
            });

        renderProjects();

        updateProjectCount();
    }

    /* =====================================================
       PROJECT RENDERING
       ===================================================== */

    function renderProjects() {

        if (!DOM.projectsGrid) return;

        DOM.projectsGrid.replaceChildren();

        if (!state.filteredProjects.length) {
            renderNoResultsState();
            return;
        }

        const fragment = document.createDocumentFragment();

        state.filteredProjects.forEach(
            (project, index) => {

                const card =
                    createProjectCard(project, index);

                fragment.appendChild(card);
            }
        );

        DOM.projectsGrid.appendChild(fragment);

        requestAnimationFrame(() => {
            document
                .querySelectorAll(".project-card.reveal")
                .forEach(element => {

                    requestAnimationFrame(() => {
                        element.classList.add("visible");
                    });
                });
        });
    }

    function createProjectCard(project, index) {

        const article =
            document.createElement("article");

        article.className = "project-card reveal";

        if (project.featured) {
            article.classList.add("featured");
        }

        article.dataset.projectId = project.id;

        /* ---------- TOP ---------- */

        const top =
            document.createElement("div");

        top.className = "project-top";

        const number =
            document.createElement("span");

        number.className = "project-number";

        number.textContent =
            String(index + 1).padStart(2, "0");

        const badge =
            document.createElement("span");

        badge.className = "project-badge";

        badge.textContent = project.badge;

        if (project.badgeColor) {
            badge.style.color = project.badgeColor;
        }

        top.append(number, badge);

        /* ---------- CONTENT ---------- */

        const content =
            document.createElement("div");

        content.className = "project-content";

        const title =
            document.createElement("h3");

        title.className = "project-title";

        title.textContent = project.title;

        const description =
            document.createElement("p");

        description.className = "project-description";

        description.textContent =
            project.shortDescription;

        content.append(title, description);

        /* ---------- FOOTER ---------- */

        const footer =
            document.createElement("div");

        footer.className = "project-footer";

        const stack =
            document.createElement("div");

        stack.className = "project-stack";

        project.categories.forEach(category => {

            const tech =
                document.createElement("span");

            tech.className = "tech";

            tech.textContent = category;

            stack.appendChild(tech);
        });

        const links =
            document.createElement("div");

        links.className = "project-links";

        /* GitHub */

        if (isUsableUrl(project.githubLink)) {

            const github =
                createProjectLink(
                    project.githubLink,
                    "GitHub",
                    "↗"
                );

            github.dataset.action = "external";

            links.appendChild(github);
        }

        /* Live */

        if (isUsableUrl(project.liveLink)) {

            const live =
                createProjectLink(
                    project.liveLink,
                    "Live project",
                    "↗"
                );

            live.dataset.action = "external";

            links.appendChild(live);
        }

        /* Details */

        const details =
            document.createElement("button");

        details.type = "button";

        details.className = "project-link";

        details.dataset.action = "details";

        details.dataset.projectId = project.id;

        details.setAttribute(
            "aria-label",
            `View details for ${project.title}`
        );

        details.textContent = "→";

        links.appendChild(details);

        footer.append(stack, links);

        article.append(
            top,
            content,
            footer
        );

        return article;
    }

    function createProjectLink(url, label, symbol) {

        const anchor =
            document.createElement("a");

        anchor.className = "project-link";

        anchor.href = url;

        anchor.target = "_blank";

        anchor.rel = "noopener noreferrer";

        anchor.setAttribute(
            "aria-label",
            label
        );

        anchor.textContent = symbol;

        return anchor;
    }

    /* =====================================================
       PROJECT MODAL
       ===================================================== */

    function openProjectModal(projectId) {

        const project =
            state.projects.find(
                item => item.id === projectId
            );

        if (!project || !DOM.modal) return;

        state.selectedProject = project;

        if (DOM.modalTitle) {
            DOM.modalTitle.textContent =
                project.title;
        }

        if (DOM.modalBadge) {
            DOM.modalBadge.textContent =
                project.badge;

            if (project.badgeColor) {
                DOM.modalBadge.style.color =
                    project.badgeColor;
            }
        }

        if (DOM.modalDescription) {
            DOM.modalDescription.textContent =
                project.description;
        }

        updateModalLink(
            DOM.modalGithub,
            project.githubLink
        );

        updateModalLink(
            DOM.modalLive,
            project.liveLink
        );

        DOM.modal.hidden = false;

        document.body.style.overflow = "hidden";

        requestAnimationFrame(() => {
            DOM.modal.classList.add("open");
        });

        DOM.modalClose?.focus();

        history.replaceState(
            null,
            "",
            `#project-${encodeURIComponent(project.id)}`
        );
    }

    function closeProjectModal() {

        if (!DOM.modal) return;

        DOM.modal.classList.remove("open");

        setTimeout(() => {

            DOM.modal.hidden = true;

            document.body.style.overflow = "";

        }, 250);

        state.selectedProject = null;

        if (
            location.hash.startsWith("#project-")
        ) {
            history.replaceState(
                null,
                "",
                location.pathname + location.search
            );
        }
    }

    function updateModalLink(element, url) {

        if (!element) return;

        if (isUsableUrl(url)) {

            element.href = url;

            element.target = "_blank";

            element.rel =
                "noopener noreferrer";

            element.hidden = false;

        } else {

            element.removeAttribute("href");

            element.hidden = true;
        }
    }

    function handleProjectDeepLink() {

        const hash =
            decodeURIComponent(location.hash);

        if (!hash.startsWith("#project-")) {
            return;
        }

        const projectId =
            hash.replace("#project-", "");

        const exists =
            state.projects.some(
                project => project.id === projectId
            );

        if (exists) {
            openProjectModal(projectId);
        }
    }

    /* =====================================================
       EVENT DELEGATION
       ===================================================== */

    function setupGlobalEvents() {

        /* Project grid */

        DOM.projectsGrid?.addEventListener(
            "click",
            event => {

                const actionTarget =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!actionTarget) return;

                const action =
                    actionTarget.dataset.action;

                if (action === "details") {

                    const projectId =
                        actionTarget.dataset.projectId;

                    openProjectModal(projectId);
                }
            }
        );

        /* Filters */

        DOM.filters?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-filter]"
                    );

                if (!button) return;

                state.activeFilter =
                    button.dataset.filter;

                DOM.filters
                    .querySelectorAll(
                        "[data-filter]"
                    )
                    .forEach(filterButton => {

                        const active =
                            filterButton.dataset.filter ===
                            state.activeFilter;

                        filterButton.classList.toggle(
                            "active",
                            active
                        );

                        filterButton.setAttribute(
                            "aria-pressed",
                            String(active)
                        );
                    });

                applyFilters();
            }
        );

        /* Search */

        DOM.search?.addEventListener(
            "input",
            debounce(event => {

                state.searchQuery =
                    event.target.value;

                applyFilters();

            }, CONFIG.SEARCH_DEBOUNCE)
        );

        /* Modal */

        DOM.modalClose?.addEventListener(
            "click",
            closeProjectModal
        );

        DOM.modal?.addEventListener(
            "click",
            event => {

                if (
                    event.target === DOM.modal ||
                    event.target.closest(
                        "[data-close-modal]"
                    )
                ) {
                    closeProjectModal();
                }
            }
        );

        document.addEventListener(
            "keydown",
            event => {

                if (event.key === "Escape") {

                    if (
                        DOM.modal &&
                        !DOM.modal.hidden
                    ) {
                        closeProjectModal();
                    }

                    closeMobileMenu();
                }
            }
        );

        window.addEventListener(
            "hashchange",
            handleProjectDeepLink
        );
    }

    /* =====================================================
       NAVIGATION
       ===================================================== */

    function setupNavigation() {

        DOM.menuToggle?.addEventListener(
            "click",
            () => {

                if (!DOM.navbar) return;

                const open =
                    DOM.navbar.classList.toggle(
                        "mobile-open"
                    );

                DOM.menuToggle.setAttribute(
                    "aria-expanded",
                    String(open)
                );
            }
        );

        DOM.navbar?.addEventListener(
            "click",
            event => {

                const link =
                    event.target.closest(
                        ".nav-links a"
                    );

                if (!link) return;

                closeMobileMenu();
            }
        );
    }

    function closeMobileMenu() {

        if (!DOM.navbar) return;

        DOM.navbar.classList.remove(
            "mobile-open"
        );

        DOM.menuToggle?.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    /* =====================================================
       SCROLL REVEAL
       ===================================================== */

    function setupRevealObserver() {

        const elements =
            document.querySelectorAll(
                ".reveal"
            );

        if (!elements.length) return;

        if (
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            elements.forEach(
                element =>
                    element.classList.add("visible")
            );

            return;
        }

        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (!entry.isIntersecting) {
                            return;
                        }

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );
                    });

                },
                {
                    threshold: 0.12,
                    rootMargin: "0px 0px -50px"
                }
            );

        elements.forEach(
            element =>
                observer.observe(element)
        );
    }

    /* =====================================================
       CINEMATIC POINTER EFFECT
       ===================================================== */

    function setupCinematicPointer() {

        if (
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            return;
        }

        if (
            window.matchMedia(
                "(pointer: coarse)"
            ).matches
        ) {
            return;
        }

        let pointerX = 0;
        let pointerY = 0;

        let currentX = 0;
        let currentY = 0;

        let animationFrame = null;

        document.addEventListener(
            "pointermove",
            event => {

                pointerX = event.clientX;
                pointerY = event.clientY;

                if (!animationFrame) {
                    animationFrame =
                        requestAnimationFrame(
                            animatePointer
                        );
                }
            },
            {
                passive: true
            }
        );

        function animatePointer() {

            currentX +=
                (pointerX - currentX) * 0.08;

            currentY +=
                (pointerY - currentY) * 0.08;

            document.documentElement.style.setProperty(
                "--mouse-x",
                `${currentX}px`
            );

            document.documentElement.style.setProperty(
                "--mouse-y",
                `${currentY}px`
            );

            animationFrame = null;
        }
    }

    /* =====================================================
       LOADING
       ===================================================== */

    function renderLoadingState() {

        if (!DOM.projectsGrid) return;

        DOM.projectsGrid.replaceChildren();

        const fragment =
            document.createDocumentFragment();

        for (let i = 0; i < 6; i++) {

            const skeleton =
                document.createElement("div");

            skeleton.className =
                "project-card skeleton-card";

            skeleton.setAttribute(
                "aria-hidden",
                "true"
            );

            skeleton.innerHTML = `
                <div class="skeleton-line skeleton-small"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line skeleton-medium"></div>
                </div>
                <div class="skeleton-line skeleton-footer"></div>
            `;

            fragment.appendChild(skeleton);
        }

        DOM.projectsGrid.appendChild(fragment);
    }

    /* =====================================================
       ERROR
       ===================================================== */

    function renderErrorState() {

        if (!DOM.projectsGrid) return;

        DOM.projectsGrid.replaceChildren();

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "portfolio-state";

        const title =
            document.createElement("h3");

        title.textContent =
            "Projects temporarily unavailable";

        const message =
            document.createElement("p");

        message.textContent =
            state.error ||
            "Something went wrong while loading your projects.";

        const retry =
            document.createElement("button");

        retry.type = "button";

        retry.className =
            "btn btn-primary";

        retry.textContent =
            "Try again";

        retry.addEventListener(
            "click",
            loadProjects,
            {
                once: true
            }
        );

        wrapper.append(
            title,
            message,
            retry
        );

        DOM.projectsGrid.appendChild(
            wrapper
        );
    }

    /* =====================================================
       EMPTY
       ===================================================== */

    function renderEmptyState() {

        if (!DOM.projectsGrid) return;

        DOM.projectsGrid.replaceChildren();

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "portfolio-state";

        const title =
            document.createElement("h3");

        title.textContent =
            "No projects yet";

        const message =
            document.createElement("p");

        message.textContent =
            "Your project collection is currently empty.";

        wrapper.append(
            title,
            message
        );

        DOM.projectsGrid.appendChild(
            wrapper
        );
    }

    function renderNoResultsState() {

        if (!DOM.projectsGrid) return;

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "portfolio-state";

        const title =
            document.createElement("h3");

        title.textContent =
            "No matching projects";

        const message =
            document.createElement("p");

        message.textContent =
            "Try another search term or project category.";

        wrapper.append(
            title,
            message
        );

        DOM.projectsGrid.appendChild(
            wrapper
        );
    }

    /* =====================================================
       PROJECT COUNT
       ===================================================== */

    function updateProjectCount() {

        if (!DOM.projectCount) return;

        DOM.projectCount.textContent =
            state.filteredProjects.length;
    }

    /* =====================================================
       UTILITIES
       ===================================================== */

    function cleanText(value) {

        if (
            typeof value !== "string" &&
            typeof value !== "number"
        ) {
            return "";
        }

        return String(value).trim();
    }

    function normalizeUrl(value) {

        const url =
            cleanText(value);

        if (
            !url ||
            url === "#" ||
            url === "/"
        ) {
            return "";
        }

        try {

            const parsed =
                new URL(
                    url,
                    window.location.origin
                );

            if (
                parsed.protocol !== "http:" &&
                parsed.protocol !== "https:"
            ) {
                return "";
            }

            return parsed.href;

        } catch {
            return "";
        }
    }

    function isUsableUrl(url) {

        return (
            typeof url === "string" &&
            /^https?:\/\//i.test(url)
        );
    }

    function slugify(value) {

        return String(value)
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );
    }

    function debounce(
        callback,
        delay
    ) {

        let timeout;

        return (...args) => {

            clearTimeout(timeout);

            timeout =
                setTimeout(
                    () => callback(...args),
                    delay
                );
        };
    }

})();

/* One important HTML requirement

For that JS to work cleanly, your HTML needs these IDs:

<div id="projectFilters" class="project-filters"></div>

<div class="project-search">
    <input
        id="projectSearch"
        type="search"
        placeholder="Search projects..."
        autocomplete="off"
    >
</div>

<span id="projectCount">0</span>

<div
    id="projectsGrid"
    class="projects-grid"
    aria-live="polite"
></div>

<div
    id="projectModal"
    class="project-modal"
    hidden
>
    <div class="modal-content">

        <button
            id="modalClose"
            type="button"
            aria-label="Close project details"
        >
            ×
        </button>

        <span id="modalBadge"></span>

        <h2 id="modalTitle"></h2>

        <p id="modalDescription"></p>

        <div class="modal-actions">

            <a
                id="modalGithub"
                class="btn btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
            >
                GitHub
            </a>

            <a
                id="modalLive"
                class="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
            >
                View Live
            </a>

        </div>

    </div>
</div>

And your navbar menu button should be:

<button
    id="menuToggle"
    class="menu-toggle"
    type="button"
    aria-label="Toggle navigation"
    aria-expanded="false"
>
    ☰
</button>

Why this is much stronger

Your backend can now remain the source of truth.

So when you add:

Co-op Lend — Cooperative lending infrastructure powered by Nomba
UNIOS — AI-powered productivity OS
Skoolify — School management system
Collaboratory
Flutter Calculator
Heritage Library
Decagenius
Visionaire Academy
Niyassakh Real Estate
Imperial Heritage Hotel

you don't need to manually build another card in the frontend. Your API supplies the data → JS normalizes it → filters/search work automatically → cards are generated → modal details work automatically.

One thing I deliberately did not do is put your project data inside this JS. That would defeat the purpose of the backend you've already built.

Next upgrade: the CSS I gave you needs a small addition for the skeleton loader, modal, and cinematic cursor glow. Without those styles, those production features technically work but won't look complete. */