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

  const projectGrid = document.querySelector('#project-grid');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const safeUrl = value => {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  };

  async function loadProjects() {
    if (!projectGrid) return;
    try {
      const response = await fetch('/api/projects', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Projects request failed');
      const projects = await response.json();
      const featured = projects.filter(project => project && project.featured === true && project.title && project.short_description)
        .slice(0, 6);
      if (!featured.length) throw new Error('No projects available');
      projectGrid.innerHTML = featured.map(project => {
        const live = safeUrl(project.liveLink);
        const code = safeUrl((project.githubLink || '').trim());
        const caseStudy = project.caseStudySlug ? `<a href="/work/${encodeURIComponent(project.caseStudySlug)}">Case study ↗</a>` : '';
        const links = [caseStudy, live ? `<a href="${live}" target="_blank" rel="noopener noreferrer">Live ↗</a>` : '', code ? `<a href="${code}" target="_blank" rel="noopener noreferrer">Code ↗</a>` : ''].filter(Boolean).join('');
        const tags = (Array.isArray(project.categories) ? project.categories : []).slice(0, 4).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
        return `<article class="project-card"><div class="project-top"><span class="folder-icon" aria-hidden="true">▱</span><div class="project-links">${links}</div></div><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.short_description)}</p><div class="project-tags">${tags}</div></article>`;
      }).join('');
    } catch {
      projectGrid.innerHTML = '<article class="project-placeholder">Projects could not be loaded right now. You can explore the repositories directly on GitHub.</article>';
    }
  }
  loadProjects();
})();
