// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON data
app.use(express.json());

// Serve your frontend files (HTML, CSS, JS) from the 'public' folder
app.use(express.static('public'));

// Import your route files
const contactRoute = require('./routes/contact');
const projectsRoute = require('./routes/projects');
const chatRoute = require('./routes/chat');

// Mount the routes to the /api path
app.use('/api', contactRoute);
app.use('/api', chatRoute);
app.use('/api', projectsRoute);

// Catch-all route to serve your index.html for any unknown requests
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Portfolio server running smoothly at http://localhost:${PORT}`);
});