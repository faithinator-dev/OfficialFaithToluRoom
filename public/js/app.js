const $ = selector => document.querySelector(selector);
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  setupMenu(); setupAssistant(); setupContactForm(); loadProjects();
  const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('visible')), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  const navLinks = document.querySelectorAll('.nav-links a');
  new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)); }), { rootMargin: '-35% 0px -55%' }).observe($('#home'));
});

function setupMenu() {
  const toggle = $('.menu-toggle'), nav = $('.nav-links');
  toggle.addEventListener('click', () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', open); toggle.textContent = open ? '×' : '☰'; });
  nav.addEventListener('click', event => { if (event.target.matches('a')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = '☰'; } });
}

function setupAssistant() {
  const launcher = $('#assistantLauncher'), panel = $('#assistantPanel'), close = $('#assistantClose'), form = $('#chatForm'), input = $('#aiInput'), box = $('#chatBox');
  const setOpen = open => { panel.classList.toggle('open', open); panel.setAttribute('aria-hidden', !open); launcher.setAttribute('aria-expanded', open); if (open) input.focus(); };
  launcher.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
  document.querySelector('.suggestions').addEventListener('click', event => { if (event.target.tagName === 'BUTTON') { input.value = event.target.textContent; form.requestSubmit(); } });
  form.addEventListener('submit', async event => {
    event.preventDefault(); const prompt = input.value.trim(); if (!prompt) return;
    addMessage(prompt, 'user'); input.value = ''; const loader = addMessage('Thinking…', 'ai');
    try { const response = await fetch('/api/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ prompt }) }); const result = await response.json(); loader.remove(); addMessage(response.ok ? (result.reply || 'I could not generate a response.') : 'Sorry, I could not connect right now. Please try again shortly.', response.ok ? 'ai' : 'ai error'); }
    catch { loader.remove(); addMessage('Network error. Please check your connection and try again.', 'ai error'); }
  });
  function addMessage(message, type) { const messageEl = document.createElement('div'); messageEl.className = `chat-message ${type}`; messageEl.innerHTML = escapeHtml(message).replace(/\n/g, '<br>'); box.appendChild(messageEl); box.scrollTop = box.scrollHeight; return messageEl; }
}

function setupContactForm() {
  const form = $('#contactForm'), button = $('#submitBtn'), status = $('#formStatus');
  form.addEventListener('submit', async event => { event.preventDefault(); const data = { name: $('#name').value.trim(), email: $('#email').value.trim(), message: $('#message').value.trim() }; button.disabled = true; button.textContent = 'Sending…'; status.textContent = ''; try { const response = await fetch('/api/contact', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); status.textContent = 'Message sent — thank you! I’ll be in touch soon.'; form.reset(); } catch (error) { status.textContent = error.message || 'Could not send your message. Please email me directly.'; } finally { button.disabled = false; button.innerHTML = 'Send message <span>→</span>'; } });
}

async function loadProjects() {
  const grid = $('#project-grid'), filters = $('#project-filters'), moreButton = $('#showMoreProjects');
  try {
    const response = await fetch('/api/projects'); if (!response.ok) throw new Error();
    const projects = await response.json(), categories = ['All', ...new Set(projects.flatMap(project => project.categories || []))];
    let selected = 'All', expanded = false;
    const render = () => {
      const filtered = projects.filter(project => selected === 'All' || project.categories.includes(selected));
      const visible = expanded ? filtered : filtered.slice(0, 9);
      filters.innerHTML = categories.map(category => `<button class="${category === selected ? 'active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
      grid.innerHTML = visible.map(project => projectCard(project)).join('');
      const hasMore = filtered.length > 9; moreButton.hidden = !hasMore; moreButton.innerHTML = expanded ? 'Show fewer projects <span>↑</span>' : `See all ${filtered.length} projects <span>↓</span>`;
    };
    filters.addEventListener('click', event => { if (event.target.matches('button')) { selected = event.target.dataset.category; expanded = false; render(); } });
    moreButton.addEventListener('click', () => { expanded = !expanded; render(); if (!expanded) $('#portfolio').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    render();
  } catch { grid.innerHTML = '<p>Projects are unavailable right now. Please visit my GitHub to see more.</p>'; }
}

function projectCard(project) {
  const hasLivePreview = project.liveLink && project.liveLink !== '#';
  const liveUrl = hasLivePreview ? project.liveLink.replace(/"/g, '%22') : '';
  return `<article class="project-card"><div class="project-art ${hasLivePreview ? 'has-preview' : ''}">${hasLivePreview ? `<iframe class="project-preview" title="Preview of ${escapeHtml(project.title)}" src="${liveUrl}" loading="lazy" tabindex="-1"></iframe>` : ''}<i>${escapeHtml(project.badge)}</i><span>${escapeHtml(project.title.charAt(0))}</span></div><div class="project-body"><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.short_description || project.description || '')}</p><div class="project-links">${hasLivePreview ? `<a href="${liveUrl}" target="_blank" rel="noopener">Live ↗</a>` : ''}${project.githubLink && project.githubLink !== '#' ? `<a href="${project.githubLink.trim()}" target="_blank" rel="noopener">Code ↗</a>` : ''}</div></div></article>`;
}

const previewStyle = document.createElement('style');
previewStyle.textContent = '.portfolio-more{display:flex;justify-content:center;margin-top:28px}.portfolio-more .button{min-width:170px}.project-art{height:145px;position:relative;overflow:hidden}.project-preview{position:absolute;inset:0;width:312.5%;height:312.5%;border:0;background:#0b1c48;pointer-events:none;transform:scale(.32);transform-origin:top left;opacity:.75}.project-art.has-preview:after{content:"Live preview";position:absolute;bottom:9px;left:11px;padding:4px 7px;border-radius:99px;background:rgba(4,13,32,.72);color:#dceeff;font:500 .52rem "DM Mono",monospace;z-index:2}.project-art.has-preview:before{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(4,13,32,.45),transparent 55%);z-index:1}.project-art i,.project-art span{z-index:2}';
document.head.appendChild(previewStyle);
