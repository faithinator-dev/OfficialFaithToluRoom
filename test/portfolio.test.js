const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

async function withServer(run) {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('homepage renders the portfolio', async () => {
  await withServer(async base => {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Faith/);
    assert.match(html, /engineering journal/i);
  });
});

test('project case studies render known slugs and reject unknown slugs', async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/work/gitweaver`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Gitweaver/);
    const missing = await fetch(`${base}/work/not-a-real-project`);
    assert.equal(missing.status, 404);
  });
});

test('mobile and journal pages render', async () => {
  await withServer(async base => {
    const mobile = await fetch(`${base}/mobile`);
    assert.equal(mobile.status, 200);
    assert.match(await mobile.text(), /FitLife Gym Management/);
    const journal = await fetch(`${base}/journal`);
    assert.equal(journal.status, 200);
    assert.match(await journal.text(), /engineering journal/i);
    const article = await fetch(`${base}/journal/thinking-about-payment-states`);
    assert.equal(article.status, 200);
    assert.match(await article.text(), /payment states/i);
  });
});

test('projects API returns a JSON array', async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/api/projects`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application/);
    const projects = await response.json();
    assert.ok(Array.isArray(projects));
    assert.ok(projects.some(project => project.id === 'asopay'));
  });
});

test('complete project catalogue includes the expanded projects', async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/api/projects`);
    assert.equal(response.status, 200);
    const projects = await response.json();
    assert.ok(projects.length >= 50, 'expected the expanded project catalogue');
    assert.ok(projects.some(project => project.id === 'cwf-chess-engine'));
    assert.ok(projects.some(project => project.id === 'unios'));
    assert.ok(projects.some(project => project.id === 'fitlife'));
  });
});

test('AI assistant validates empty questions without requiring an API key', async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '   ' })
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /question/i);
  });
});
