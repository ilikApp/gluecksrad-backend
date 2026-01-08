const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = "users.json";

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
  const id = req.params.id;
  const points = req.body.points;

  users[id] = { points };
  fs.writeFileSync(DATA_FILE, JSON.stringify(users));

  res.json({ success: true });
});

app.get("/leaderboard", (req, res) => {
  const users = JSON.parse(fs.readFileSync(DATA_FILE));

  const list = Object.entries(users)
    .map(([id, data]) => ({ id, points: data.points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  res.json(list);
});

app.listen(3000, () => {
  console.log("Server läuft auf Port 3000");
});
