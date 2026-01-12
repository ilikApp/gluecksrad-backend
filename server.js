const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

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

  if (!users[id]) {
    users[id] = { points: 50 };
    fs.writeFileSync(DATA_FILE, JSON.stringify(users));
  }

  res.json(users[id]);
});

app.post("/me/:id", (req, res) => {
  const users = JSON.parse(fs.readFileSync(DATA_FILE));
  users[req.params.id] = { points: req.body.points };
  fs.writeFileSync(DATA_FILE, JSON.stringify(users));
  res.json({ success: true });
});

app.get("/leaderboard", (req, res) => {
  const users = JSON.parse(fs.readFileSync(DATA_FILE));
  const list = Object.entries(users)
    .map(([id, d]) => ({ id, points: d.points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
  res.json(list);
});

app.get("/question/random", (req, res) => {
  const q = questions[Math.floor(Math.random() * questions.length)];
  res.json(q);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
