const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// POST /api/contact
router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check for SMTP configuration in environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_TO) {
        console.error('SMTP configuration is missing. Please check your .env file.');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    try {
        // Create a transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Set up email data
        let mailOptions = {
            from: `"${name}" <${email}>`, // sender address
            to: process.env.EMAIL_TO, // list of receivers
            subject: `New Contact Form Submission from ${name}`, // Subject line
            text: message, // plain text body
            html: `<p>You have a new contact form submission from:</p>
                   <ul>
                     <li><strong>Name:</strong> ${name}</li>
                     <li><strong>Email:</strong> ${email}</li>
                   </ul>
                   <p><strong>Message:</strong></p>
                   <p>${message}</p>`, // html body
        };

        // Send mail with defined transport object
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

module.exports = router;
