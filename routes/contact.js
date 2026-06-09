const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// POST /api/contact
router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // NOTE: For a real application, you'd configure nodemailer with an SMTP transport.
        // For now, we'll simulate a successful send to avoid dependency on external credentials.
        console.log(`New contact message from ${name} (${email}): ${message}`);
        
        // Simulating processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

module.exports = router;
