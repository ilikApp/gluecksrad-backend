const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ADMIN_KEY = process.env.ADMIN_KEY || "MEIN_GEHEIMES_PASSWORT";

const app = express();
app.use(cors());
app.use(express.json());

const QUESTIONS_FILE = path.join(__dirname, "questions.json");
const DATA_FILE = path.join(__dirname, "users.json");

const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf8"));

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

app.get("/me/:id", (req, res) => {
  const users = JSON.parse(fs.readFileSync(DATA_FILE));
  const id = req.params.id;
  const name = req.query.name || "Unbekannt";

  if (!users[id]) {
    users[id] = { points: 50, name };
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  }

  res.json(users[id]);
});

app.post("/me/:id", (req, res) => {
  const users = JSON.parse(fs.readFileSync(DATA_FILE));
  const { points, name } = req.body;

  users[req.params.id] = {
    points,
    name: name || users[req.params.id]?.name || "Unbekannt"
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.get("/leaderboard", (req, res) => {
  const users = JSON.parse(fs.readFileSync(DATA_FILE));
  const list = Object.entries(users)
   .map(([id, d]) => ({ id, name: d.name || id, points: d.points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
  res.json(list);
});
// 🔐 Admin: alle Fragen holen
app.get("/admin/questions", (req, res) => {
const key = req.headers["x-admin-key"];
if (key !== ADMIN_KEY) {
  return res.status(403).json({ error: "Kein Zugriff" });
}  
const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf8"));
  res.json(questions);
});

// 🔐 Admin: Frage löschen
app.delete("/admin/question/:id", (req, res) => {
const key = req.headers["x-admin-key"];
if (key !== ADMIN_KEY) {
  return res.status(403).json({ error: "Kein Zugriff" });
}
  
const id = req.params.id;

  let questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf8"));
  questions = questions.filter(q => q.id !== id);

  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
  res.json({ success: true });
});

app.get("/question/random", (req, res) => {
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf8"));
  const q = questions[Math.floor(Math.random() * questions.length)];
  res.json(q);
});

const PORT = process.env.PORT || 3000;
app.post("/admin/question", (req, res) => {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: "Kein Zugriff" });
  }

  const { question, answers, correct, points } = req.body;

  if (
    !question ||
    !Array.isArray(answers) ||
    answers.length < 2 ||
    correct === undefined
  ) {
    return res.status(400).json({ error: "Ungültige Frage" });
  }

  const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE));

  const newQuestion = {
    id: "q" + Date.now(),
    question,
    answers,
    correct,
    points: points ?? 5
  };

  questions.push(newQuestion);
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));

  res.json({ success: true, question: newQuestion });
});
// 🔐 Admin: Frage für eine spezifische Kachel hinzufügen
app.post("/admin/kachel/:id/question", (req, res) => {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: "Kein Zugriff" });
  }

  const { question, answers, correct } = req.body;
  const kachelId = req.params.id; // Tagesrad, Risiko oder Endlos

  if (!question || !Array.isArray(answers) || answers.length < 2 || correct === undefined) {
    return res.status(400).json({ error: "Ungültige Frage" });
  }

  // Lade die bestehenden Fragen aus der JSON-Datei
  let questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf8"));

  const newQuestion = {
    id: `${kachelId}_q${Date.now()}`,  // Eindeutige ID für jede Frage
    question,
    answers,
    correct,
    kachelId  // Kachel ID wird hinzugefügt
  };

  questions.push(newQuestion);
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));

  res.json({ success: true, question: newQuestion });
});
// 🔐 Admin: Frage für eine spezifische Kachel löschen
app.delete("/admin/kachel/:kachelId/question/:id", (req, res) => {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: "Kein Zugriff" });
  }

  const { kachelId, id } = req.params; // Kachel-ID und Frage-ID

  // Lade alle Fragen
  let questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf8"));

  // Filtere die Fragen, um die Frage für diese Kachel zu löschen
  questions = questions.filter(q => q.id !== id || q.kachelId !== kachelId);

  // Schreibe die geänderte Liste wieder in die JSON-Datei
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
