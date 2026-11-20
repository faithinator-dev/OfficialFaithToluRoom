(() => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const revealTargets = document.querySelectorAll('.section, .hero');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealTargets.forEach(element => element.classList.add('reveal'));
    revealTargets.forEach(element => revealObserver.observe(element));
  }

  const grid = document.querySelector('#project-grid');
  const search = document.querySelector('#project-search');
  const filters = document.querySelector('#project-filters');
  const count = document.querySelector('#project-count');
  if (!grid) return;

  const state = { projects: [], category: 'All', query: '' };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const safeUrl = value => {
    try {
      const url = new URL(String(value || '').trim());
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  };
  const slugClass = value => String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 60);

  function buildFilters() {
    if (!filters) return;
    const categories = [...new Set(state.projects.flatMap(project => project.categories || []))]
      .filter(Boolean).sort((a, b) => a.localeCompare(b));
    filters.innerHTML = ['All', ...categories].map(category =>
      `<button type="button" class="project-filter${category === state.category ? ' is-active' : ''}" data-category="${escapeHtml(category)}" aria-pressed="${category === state.category}">${escapeHtml(category)}</button>`
    ).join('');
  }

  function render() {
    const query = state.query.trim().toLowerCase();
    const visible = state.projects.filter(project => {
      const categories = Array.isArray(project.categories) ? project.categories : [];
      const matchesCategory = state.category === 'All' || categories.includes(state.category);
      const searchable = [project.title, project.short_description, project.badge, ...categories].join(' ').toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });
    if (count) count.textContent = `Showing ${visible.length} of ${state.projects.length} projects`;
    if (!visible.length) {
      grid.innerHTML = '<article class="project-placeholder">No projects match that search. Try another keyword or category.</article>';
      return;
    }
    grid.innerHTML = visible.map((project, index) => {
      const live = safeUrl(project.liveLink);
      const code = safeUrl(project.githubLink);
      const caseStudy = project.caseStudySlug
        ? `<a href="/work/${encodeURIComponent(project.caseStudySlug)}">Case study ↗</a>` : '';
      const links = [caseStudy, live ? `<a href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer">Live ↗</a>` : '',
        code ? `<a href="${escapeHtml(code)}" target="_blank" rel="noopener noreferrer">Source ↗</a>` : ''].filter(Boolean).join('');
      const tags = (Array.isArray(project.categories) ? project.categories : []).slice(0, 4)
        .map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
      const visualKey = slugClass(project.id || project.title);
      const visualLabel = escapeHtml((project.badge || project.categories?.[0] || 'DIGITAL PRODUCT').toUpperCase());
      const indexLabel = String(index + 1).padStart(2, '0');
      return `<article class="project-card">
        <div class="project-visual visual-${visualKey}">
          <div class="visual-toolbar"><span><i></i><i></i><i></i></span><small>${visualLabel}</small><b>↗</b></div>
          <div class="visual-content"><span class="visual-kicker">CODEWITHFAITH / ${indexLabel}</span><strong>${escapeHtml(project.title)}</strong><span class="visual-line"></span><span class="visual-line short"></span><div class="visual-pills"><i></i><i></i><i></i></div></div>
          <span class="visual-index">${indexLabel}</span>
        </div>
        <div class="project-card-content"><div class="project-top"><span class="folder-icon" aria-hidden="true">⌘</span><div class="project-links">${links}</div></div>
          <h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.short_description || project.description || 'Project details coming soon.')}</p>
          <div class="project-tags">${tags}</div>
        </div>
      </article>`;
    }).join('');
  }

  async function loadProjects() {
    grid.innerHTML = '<article class="project-placeholder">Loading the complete project catalogue…</article>';
    try {
      const response = await fetch('/api/projects', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Projects request failed: ${response.status}`);
      const payload = await response.json();
      const projects = Array.isArray(payload) ? payload : payload.projects;
      if (!Array.isArray(projects)) throw new Error('Unexpected projects response');
      state.projects = projects.filter(project => project && project.title);
      buildFilters();
      render();
    } catch (error) {
      console.error('[Portfolio] Project catalogue failed:', error);
      if (count) count.textContent = 'Project catalogue unavailable';
      grid.innerHTML = '<article class="project-placeholder">The project catalogue could not load. You can still <a href="https://github.com/faithinator-dev?tab=repositories" target="_blank" rel="noopener noreferrer">browse every GitHub repository ↗</a>.</article>';
    }
  }

  if (search) search.addEventListener('input', () => { state.query = search.value; render(); });
  if (filters) filters.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    buildFilters();
    render();
  });
  loadProjects();
})();
