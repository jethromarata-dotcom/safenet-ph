const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/persons', require('./routes/persons'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/agencies', require('./routes/agencies'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/links', require('./routes/links'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

app.listen(PORT, () => {
  console.log(`SafeNet PH running at http://localhost:${PORT}`);
});