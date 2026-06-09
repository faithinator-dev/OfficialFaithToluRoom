const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// GET /api/projects
router.get('/projects', (req, res) => {
    // Safely locate the JSON file in your server directory
    const filePath = path.join(__dirname, '../data/projects.json');

    // Read the file asynchronously
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Failed to read projects file:", err);
            return res.status(500).json({ error: "Could not load projects data" });
        }
        
        // Parse the stringified JSON and send it as a proper API response
        res.status(200).json(JSON.parse(data));
    });
});

module.exports = router;