(() => {
  const panel = document.querySelector('#assistant-panel');
  const launcher = document.querySelector('#assistant-launcher');
  const close = document.querySelector('#assistant-close');
  const form = document.querySelector('#assistant-form');
  const input = document.querySelector('#assistant-input');
  const send = document.querySelector('#assistant-send');
  const messages = document.querySelector('#assistant-messages');
  const intro = document.querySelector('#assistant-intro');
  if (!panel || !launcher || !form || !input || !messages) return;

  let busy = false;
  const open = () => {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    window.setTimeout(() => input.focus(), 40);
  };
  const shut = () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  };
  const addMessage = (text, role) => {
    const item = document.createElement('div');
    item.className = 'assistant-message assistant-message-' + role;
    const label = document.createElement('span');
    label.className = 'assistant-message-label';
    label.textContent = role === 'user' ? 'YOU' : 'FAITH AI';
    const body = document.createElement('p');
    body.textContent = text;
    item.append(label, body);
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  };
  const setBusy = value => {
    busy = value;
    if (send) send.disabled = value;
    input.disabled = value;
    if (send) send.textContent = value ? '…' : '↑';
  };

  launcher.addEventListener('click', () => panel.hidden ? open() : shut());
  if (close) close.addEventListener('click', shut);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) shut();
  });

  panel.querySelectorAll('[data-question]').forEach(button => {
    button.addEventListener('click', () => {
      input.value = button.dataset.question || '';
      open();
      form.requestSubmit();
    });
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 112) + 'px';
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const prompt = input.value.trim();
    if (!prompt || busy) return;
    if (intro) intro.hidden = true;
    addMessage(prompt, 'user');
    input.value = '';
    input.style.height = 'auto';
    const pending = addMessage('Thinking about the portfolio information…', 'assistant assistant-pending');
    setBusy(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The assistant is temporarily unavailable.');
      pending.querySelector('p').textContent = data.reply || 'I could not prepare an answer. Please try again.';
      pending.classList.remove('assistant-pending');
    } catch (error) {
      pending.querySelector('p').textContent = error.message || 'Something went wrong. Please try again.';
      pending.classList.add('assistant-error');
      pending.classList.remove('assistant-pending');
    } finally {
      setBusy(false);
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  });
})();