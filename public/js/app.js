// Antigravity Portfolio Logic

let projectData = []; // Global store for projects

// Tab navigation logic with improved transitions
function switchTab(tabId, element) {
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');
    
    // Deactivate all screens
    screens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    // Deactivate all nav items
    navItems.forEach(n => n.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (!target) return;

    // Show target screen
    target.style.display = 'block';
    
    // Small delay to allow display: block to take effect before adding active class for transition
    setTimeout(() => {
        target.classList.add('active');
    }, 10);

    if (element) element.classList.add('active');
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    // Navigation setup
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const target = item.getAttribute('data-tab') || item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (target) switchTab(target, item);
        });
    });

    // Load projects from API
    loadProjects();

    // Contact form handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        const statusText = document.getElementById('formStatus');
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.style.opacity = '0.7';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });

            const result = await response.json();

            if (response.ok) {
                btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
                btn.style.background = 'var(--accent-secondary)';
                contactForm.reset();
            } else {
                btn.innerHTML = 'Send Message';
                btn.style.opacity = '1';
                statusText.hidden = false;
                statusText.style.color = '#ef4444';
                statusText.textContent = result.error || 'Failed to send.';
            }
        } catch (error) {
            btn.innerHTML = 'Send Message';
            btn.style.opacity = '1';
            statusText.hidden = false;
            statusText.style.color = '#ef4444';
            statusText.textContent = 'Network error. Please try again.';
        }

        setTimeout(() => {
            btn.innerHTML = 'Send Message';
            btn.style.background = '';
            btn.style.opacity = '1';
            if (statusText) statusText.hidden = true;
        }, 4000);
    });

    // Chat input handling
    const aiInput = document.getElementById('aiInput');
    if (aiInput) {
        aiInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') handleAiChat();
        });
    }

    // Modal Close on backdrop click
    const modalOverlay = document.getElementById('projectModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
});

// AI Chat logic
async function handleAiChat() {
    const inputField = document.getElementById('aiInput');
    if (!inputField) return;
    const text = inputField.value.trim();
    if (!text) return;

    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML += `<div class="msg user">${escapeHtml(text)}</div>`;
    inputField.value = '';

    const loadingId = 'load-' + Date.now();
    chatBox.innerHTML += `<div class="msg ai" id="${loadingId}"><i class="fas fa-ellipsis-h"></i></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });

        const result = await response.json();
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();

        if (response.ok) {
            chatBox.innerHTML += `<div class="msg ai">${escapeHtml(result.reply || 'No reply')}</div>`;
        } else {
            chatBox.innerHTML += `<div class="msg ai" style="color: #ef4444;">Sorry, I encountered an error connecting to the brain.</div>`;
        }
    } catch (error) {
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();
        chatBox.innerHTML += `<div class="msg ai" style="color: #ef4444;">Network error. Cannot connect to the server.</div>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// Function to load and render projects from your Node API
async function loadProjects() {
    const projectGrid = document.getElementById('project-grid');
    if (!projectGrid) return;

    try {
        const response = await fetch('/api/projects'); 
        projectData = await response.json();

        projectGrid.innerHTML = '';

        projectData.forEach((project, index) => {
            const floatClass = `float-${(index % 3) + 1}`;
            const displayDesc = project.short_description || project.description || "";

            const cardHTML = `
                <div class="glass-card glass ${floatClass}" style="cursor: pointer;" onclick="showProjectDetails('${project.id}')">
                    <h3>${project.title}</h3>
                    <p style="color: ${project.badgeColor || 'var(--accent-primary)'}; font-size: 0.8rem; font-weight: 700; margin-bottom: 12px;">
                        ${project.badge || 'PROJECT'}
                    </p>
                    <p>${displayDesc.length > 100 ? displayDesc.substring(0, 100) + '...' : displayDesc}</p>
                </div>
            `;
            projectGrid.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Error loading projects:", error);
        projectGrid.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Projects currently unavailable.</p>`;
    }
}

// Modal Logic
function showProjectDetails(id) {
    const project = projectData.find(p => p.id === id);
    if (!project) return;

    document.getElementById('modalTitle').textContent = project.title;
    document.getElementById('modalBadge').textContent = project.badge;
    document.getElementById('modalBadge').style.color = project.badgeColor;
    document.getElementById('modalDescription').textContent = project.full_description || project.description;

    const liveBtn = document.getElementById('modalLive');
    const githubBtn = document.getElementById('modalGithub');

    if (project.liveLink && project.liveLink !== '#') {
        liveBtn.style.display = 'flex';
        liveBtn.href = project.liveLink;
    } else {
        liveBtn.style.display = 'none';
    }

    if (project.githubLink && project.githubLink !== '#') {
        githubBtn.style.display = 'flex';
        githubBtn.href = project.githubLink;
    } else {
        githubBtn.style.display = 'none';
    }

    document.getElementById('projectModal').classList.add('active');
}

function closeModal() {
    document.getElementById('projectModal').classList.remove('active');
}
