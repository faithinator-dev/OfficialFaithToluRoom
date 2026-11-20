require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.use('/api', require('./routes/contact'));
app.use('/api', require('./routes/chat'));
app.use('/api', require('./routes/projects'));
app.use('/', require('./routes/pages'));

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Faith Toluwanimi — Software Engineer',
    description: 'I design and build thoughtful web, backend, and mobile products.',
    year: new Date().getFullYear()
  });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
app.use((req, res) => res.status(404).send('Page not found.'));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
}

module.exports = app;
