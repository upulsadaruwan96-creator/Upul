import express from "express";
import multer from "multer";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Please upload an image."));
  }
});

app.use(express.static(__dirname));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/scan", upload.single("screenshot"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Server API key is not configured." });
    }
    if (!req.file) return res.status(400).json({ error: "Screenshot is required." });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const market = String(req.body.market || "OTC").slice(0, 40);
    const timeframe = String(req.body.timeframe || "5 seconds").slice(0, 40);
    const expiry = String(req.body.expiry || "AI choose").slice(0, 80);
    const pair = String(req.body.pair || "Read from screenshot").slice(0, 50);

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text:
`Analyze this Pocket Option chart screenshot as a cautious visual chart review.
User settings: market=${market}; chart timeframe=${timeframe}; pair=${pair}; expiry preference=${expiry}.

Inspect only what is visibly readable: recent candle direction and shapes, visible indicators (MACD, RSI, ADX, EMA if present), and approximate support/resistance. Do not claim to know hidden indicator values or future prices. Distinguish chart timeframe from trade expiry. Do not assume the screenshot is live/current.

Return concise JSON with these keys:
pair, direction (BUY, SELL, WAIT), short_term_bias (UP, DOWN, SIDEWAYS, UNCLEAR),
expiry_suggestion (string or "NONE"), evidence_confidence (integer 0-100),
confidence_note, candle_observation, indicator_observation, support_resistance,
entry_confirmation, reason, no_trade_reason.
Important: evidence_confidence is confidence in the visual interpretation, NOT probability of winning. If the chart is unclear, cropped, sideways, contradictory, or lacks sufficient evidence, direction must be WAIT and expiry_suggestion must be NONE. Never promise accuracy or guaranteed profit. Do not recommend increasing stake or recovering losses.` },
          { type: "input_image", image_url: imageData, detail: "high" }
        ]
      }],
      max_output_tokens: 700
    });

    const text = response.output_text || "";
    let result;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      result = JSON.parse(match[0]);
    } catch {
      result = {
        pair, direction: "WAIT", short_term_bias: "UNCLEAR",
        expiry_suggestion: "NONE", evidence_confidence: 0,
        confidence_note: "The analysis could not be parsed safely.",
        candle_observation: text.slice(0, 1200),
        indicator_observation: "Not reliably extracted.",
        support_resistance: "Not reliably extracted.",
        entry_confirmation: "Do not enter based on this result.",
        reason: "Could not produce a structured result.",
        no_trade_reason: "Please upload a clearer screenshot."
      };
    }
    res.json(result);
  } catch (err) {
    console.error("Scan error:", err.message);
    res.status(500).json({ error: "AI scan failed. Check server setup, API billing, and try again." });
  }
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || "Upload error." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`Scanner running on port ${port}`));
