const express = require('express');
const path = require('path');
const router = express.Router();

const readData = (name) => require(path.join(__dirname, '../data', name));

router.get('/work/:slug', (req, res) => {
  const project = readData('case-studies.json').find(item => item.slug === req.params.slug);
  if (!project) return res.status(404).render('not-found', { title: 'Project not found', description: 'The requested project could not be found.' });
  res.render('case-study', {
    title: `${project.title} — Faith Toluwanimi`,
    description: project.summary,
    project
  });
});

router.get('/mobile', (req, res) => {
  res.render('mobile', {
    title: 'Mobile development — Faith Toluwanimi',
    description: 'Flutter and Dart projects, prototypes and mobile engineering work.',
    projects: readData('mobile-projects.json')
  });
});

router.get('/journal', (req, res) => {
  res.render('journal', {
    title: 'Engineering journal — Faith Toluwanimi',
    description: 'Notes on backend engineering, product decisions and learning through building.',
    articles: readData('journal.json')
  });
});

router.get('/journal/:slug', (req, res) => {
  const article = readData('journal.json').find(item => item.slug === req.params.slug);
  if (!article) return res.status(404).render('not-found', { title: 'Article not found', description: 'The requested article could not be found.' });
  res.render('article', {
    title: `${article.title} — Engineering journal`,
    description: article.excerpt,
    article
  });
});

module.exports = router;
