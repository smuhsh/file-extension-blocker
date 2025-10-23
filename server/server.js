// server/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const extensionsRouter = require('./routes/extensions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// static front
app.use(express.static(path.join(__dirname, '..', 'public')));

// api
app.use('/api/extensions', extensionsRouter);

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
