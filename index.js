require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// In-memory storage
const users = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const _id = Date.now().toString();
  const newUser = { username, _id, log: [] };
  users.push(newUser);
  res.json({ username, _id });
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json(users.map(u => ({ username: u.username, _id: u._id })));
});

// Add exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const user = users.find(u => u._id === req.params._id);
  if (!user) return res.json({ error: 'User not found' });

  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date();

  const exercise = {
    description,
    duration,
    date: date.toDateString() // ✅ string format required by FCC
  };

  user.log.push(exercise);

  res.json({
    username: user.username,
    description,
    duration,
    date: exercise.date,
    _id: user._id
  });
});

// Get logs
app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  const user = users.find(u => u._id === req.params._id);
  if (!user) return res.json({ error: 'User not found' });

  let logs = [...user.log];

  if (from) {
    const fromDate = new Date(from);
    logs = logs.filter(l => new Date(l.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    logs = logs.filter(l => new Date(l.date) <= toDate);
  }

  if (limit) {
    logs = logs.slice(0, parseInt(limit));
  }

  res.json({
    username: user.username,
    count: logs.length,
    _id: user._id,
    log: logs.map(l => ({
      description: l.description,
      duration: l.duration,
      date: l.date // ✅ already in toDateString() format
    }))
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
