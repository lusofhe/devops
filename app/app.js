const express = require('express');
const path = require('path');
const vocabularyRoutes = require('./routes/vocabulary');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// API Routes
app.use('/api/vocabulary', vocabularyRoutes);

// Mock TTS route for tests
app.get('/api/tts/lists', (req, res) => {
  res.json({ lists: [] });
});

// HTML Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Deutsch-Vietnamesischer Vokabeltrainer</title>
    </head>
    <body>
      <h1>Deutsch-Vietnamesischer Vokabeltrainer</h1>
    </body>
    </html>
  `);
});

app.get('/vocabulary-lists', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Vokabellisten</title>
    </head>
    <body>
      <h1>Vokabellisten</h1>
    </body>
    </html>
  `);
});

app.get('/vocabulary-editor', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Vokabel-Editor</title>
    </head>
    <body>
      <h1>Vokabel-Editor</h1>
    </body>
    </html>
  `);
});

app.get('/vocab-trainer', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kartentrainer</title>
    </head>
    <body>
      <h1>Kartentrainer</h1>
    </body>
    </html>
  `);
});

app.get('/text-to-speech', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Freitext zu Sprache</title>
    </head>
    <body>
      <h1>Freitext zu Sprache</h1>
    </body>
    </html>
  `);
});

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;