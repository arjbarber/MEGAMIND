import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/cerebellum", async (req, res) => {
  try {
    const { accuracy } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `Noir Report: Subject motor coordination measured at ${accuracy}%. Give a 1-sentence detective-style analysis.`;

    const result = await model.generateContent(prompt);

    res.json({ report: result.response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gemini failed." });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
