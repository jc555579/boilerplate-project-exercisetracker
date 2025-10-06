const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Setup Express
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Create Schema
const userSchema = new Schema({
  username: { type: String, required: true },
  log: [
    {
      description: String,
      duration: Number,
      date: Date
    }
  ]
});

const User = mongoose.model('User', userSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create and get users
app.route('/api/users')
  .get(async (req, res) => {
    try {
      const users = await User.find({}, 'username _id');
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  })
  .post(async (req, res) => {
    try {
      const newUser = new User({ username: req.body.username });
      const savedUser = await newUser.save();
      res.json(savedUser);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let date = req.body.date ? new Date(req.body.date) : new Date();

    const newExercise = {
      description: req.body.description,
      duration: Number(req.body.duration),
      date
    };

    user.log.push(newExercise);
    await user.save();

    res.json({
      username: user.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(),
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add exercise' });
  }
});

// Get logs (✅ Fixed)
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let log = [...user.log];

    // Filter by date
    if (from) {
      const fromDate = new Date(from);
      log = log.filter((e) => e.date >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      log = log.filter((e) => e.date <= toDate);
    }

    // Limit
    if (limit) {
      log = log.slice(0, Number(limit));
    }

    // ✅ Convert date to string safely
    const formattedLog = log.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date ? new Date(e.date).toDateString() : new Date().toDateString()
    }));

    res.json({
      username: user.username,
      count: formattedLog.length,
      _id: user._id,
      log: formattedLog
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// 404 fallback
app.all('*', (req, res) => {
  res.status(404).send('Error 404: Path or Route Not Found');
});

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
