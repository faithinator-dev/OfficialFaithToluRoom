const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const router = express.Router();

// Initialize the Gemini API using your hidden key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/chat
router.post("/chat", async (req, res) => {
  // Extract the user's question from the frontend request
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    // Configure the AI model and give it your personal context
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are the friendly and professional personal portfolio AI assistant for Faith Toluwanimi, representing him to recruiters and clients.

Strict Facts (Do not make up information or speculate outside this list):
- Role: Software Engineer with 4 years of hands-on experience.
- Skills: Node.js, Express, JavaScript, HTML/CSS, Bootstrap, WordPress.
- Projects: Finbuddy, Git Weaver (Node/Express backend, real-time APIs, localStorage). Other projects at https://github.com/faithinator-dev/.
- Education: NCE in Computer Science and Mathematics from Best Legacy College of Education (3.80/5.0 CGPA).
- Experience: Former Secretary/Computer operator and Computer Science teacher at Best Legacy College of Education.
- Availability: Open to full-time work and freelance opportunities.
- Contact/Pricing: Email directly at faithinator.faithanic@gmail.com or use the website contact form.

Guidelines:
1. Be concise, natural, and conversational—never robotic.
2. If asked for tech advice, website ideas, or stacks, recommend tools based strictly on Faith's skills.
3. Refer all pricing, negotiation, or unknown questions to his contact email or form.
4. If a fact is not listed, say: "I'm sorry, I don't have that information."`,
    });

    // Send the user's question to Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Send the generated text back to your frontend
    res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to connect to the AI assistant." });
  }
});

module.exports = router;
