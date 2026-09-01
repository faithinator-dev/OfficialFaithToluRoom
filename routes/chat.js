const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Initialize the Gemini API using your hidden key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load projects data
let projectsData = [];
try {
  const projectsPath = path.join(__dirname, '../data/projects.json');
  const projectsContent = fs.readFileSync(projectsPath, 'utf-8');
  projectsData = JSON.parse(projectsContent);
} catch (error) {
  console.error('Error loading projects.json:', error);
}

// Format projects for AI context
const projectsContext = projectsData.map(p => 
  `- ${p.title} (${p.badge}): ${p.full_description} GitHub: ${p.githubLink}`
).join('\n');

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
- Role: Software Engineer with 4+ years of hands-on experience.
- Skills: Node.js, Express, JavaScript, HTML/CSS, Bootstrap, WordPress, Flutter, Dart, MongoDB.
- Education: NCE in Computer Science and Mathematics from Best Legacy College of Education (3.80/5.0 CGPA).
- Experience: Former Secretary/Computer Operator and Computer Science Teacher at Best Legacy College of Education.
- Availability: Open to full-time work and freelance opportunities.
- Contact/Pricing: Email at faithinator.faithanic@gmail.com or use the website contact form, WhatsApp at 07046111023.

Faith's Notable Projects:
${projectsContext}

Guidelines:
1. Be concise, natural, and conversational—never robotic.
2. When asked about projects, use the detailed information provided above.
3. If asked for tech advice, recommend tools based on Faith's documented skills.
4. Refer all pricing, negotiation, or unknown questions to his contact email, form, or WhatsApp.
5. If a fact is not listed, say: "I'm sorry, I don't have that information."
6. Encourage visitors to check the Projects tab to see live demos and GitHub repositories.`,
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
