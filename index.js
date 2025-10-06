const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Middleware setup
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [
    {
      description: String,
      duration: Number,
      date: String // ✅ store as string instead of Date
    }
  ]
});

const User = mongoose.model('User', userSchema);

// Root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create and get users
app.route('/api/users')
  .get(async (req, res) => {
    const users = await User.find({}, 'username _id');
    res.json(users);
  })
  .post(async (req, res) => {
    const newUser = new User({ username: req.body.username });
    await newUser.save();
    res.json({ username: newUser.username, _id: newUser._id });
  });

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const user = await User.findById(req.params._id);
  if (!user) return res.json({ error: 'User not found' });

  const exerciseDate = date ? new Date(date).toDateString() : new Date().toDateString();

  const exercise = {
    description,
    duration: Number(duration),
    date: exerciseDate
  };

  user.log.push(exercise);
  await user.save();

  res.json({
    username: user.username,
    description,
    duration: Number(duration),
    date: exerciseDate,
    _id: user._id
  });
});

// Get logs
// Get logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const user = await User.findById(req.params._id);
  if (!user) return res.json({ error: 'User not found' });

  let logs = [...user.log];

  // filter by date range
  if (from || to) {
    const fromDate = from ? new Date(from) : new Date(0);
    const toDate = to ? new Date(to) : new Date();
    logs = logs.filter(ex => {
      const exDate = new Date(ex.date);
      return exDate >= fromDate && exDate <= toDate;
    });
  }

  // limit logs
  if (limit) logs = logs.slice(0, parseInt(limit));

  // ✅ ensure date is in toDateString format
  const formattedLogs = logs.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: new Date(ex.date).toDateString()
  }));

  res.json({
    username: user.username,
    count: formattedLogs.length,
    _id: user._id,
    log: formattedLogs
  });
});

// Handle not found
app.all('*', (req, res) => {
  res.status(404).send('Error 404: Path or Route Not Found');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
