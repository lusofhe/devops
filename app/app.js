// app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const dbConnection = require('./database/db-connection');
const ttsRoutes = require('./routes/tts');
const vocabularyRoutes = require('./routes/vocabulary');

// App initialization
const app = express();
const port = process.env.PORT || 3000;

// Graceful Shutdown
process.on('SIGINT', async () => {
    await dbConnection.close();
    process.exit(0);
});

// EJS configuration - WICHTIG: Für .html Dateien konfigurieren!
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Unbehandelte Ausnahme:', err);
    // Bei Dateisystemfehlern versuchen wir nicht, die Anwendung zu beenden
    if (err.code !== 'ENOENT' && err.code !== 'EACCES') {
        process.exit(1);
    }
});

// Connect to database first, then start app
dbConnection.connect().then(async () => {

    // Automatische Datenbank-Initialisierung beim ersten Start
    if (process.env.AUTO_INIT === 'true' ||
        process.env.NODE_ENV === 'development') {
        try {
            const { checkDatabaseStatus, initDatabase } =
                require('./scripts/init-database');

            // Überprüfe ob Datenbank leer ist
            const existingLists = await checkDatabaseStatus();

            if (existingLists === 0) {
                console.log(
                    '🌱 Datenbank ist leer, starte automatische Initialisierung...'
                );
                await initDatabase();
                console.log('✅ Automatische Initialisierung abgeschlossen\n');
            } else {
                console.log(
                    `📚 Datenbank enthält bereits ${existingLists} Vokabellisten\n`
                );
            }
        } catch (error) {
            console.warn(
                '⚠️ Automatische Initialisierung fehlgeschlagen:',
                error.message
            );
            console.log(
                '💡 Sie können die Datenbank manuell mit "npm run init" ' +
                'initialisieren\n'
            );
        }
    }

    // API routes
    app.use('/api/tts', ttsRoutes);
    app.use('/api/vocabulary', vocabularyRoutes);

    // Render function for HTML pages with layout
    function renderPage(req, res, page, title, extraScripts = '') {
        // Diese Skripte sollten immer geladen werden
        let scripts =
            '<script src="js/api-client.js"></script>' +
            '<script src="js/ui-manager.js"></script>' +
            '<script src="js/audio-player.js"></script>';

        // Füge extraScripts nur hinzu, wenn es kein Skript ist,
        // das bereits in baseScripts enthalten ist
        if (extraScripts && !scripts.includes(extraScripts)) {
            scripts += extraScripts;
        }

        res.render('layouts/main', {
            body: fs.readFileSync(
                path.join(__dirname, 'views/pages', page),
                'utf8'
            ),
            title: title,
            script: scripts
        });
    }

    // Main page routes
    app.get('/', (req, res) => {
        renderPage(
            req,
            res,
            'index.html',
            'Deutsch-Vietnamesischer Vokabeltrainer'
        );
    });

    app.get('/vocab-trainer', (req, res) => {
        renderPage(req, res, 'vocab-trainer.html', 'Kartentrainer');
    });

    app.get('/text-to-speech', (req, res) => {
        renderPage(req, res, 'text-to-speech.html', 'Freitext zu Sprache');
    });

    app.get('/vocabulary-editor', (req, res) => {
        renderPage(
            req,
            res,
            'vocabulary-editor.html',
            'Vokabel-Editor',
            '<script src="js/editor.js"></script>'
        );
    });

    app.get('/vocabulary-lists', (req, res) => {
        renderPage(req, res, 'vocabulary-lists.html', 'Vokabellisten');
    });

    // 404 Handler
    app.use((req, res) => {
        res.status(404).render('layouts/main', {
            body:
                '<div style="text-align: center; padding: 50px;">' +
                '<h1>404 - Seite nicht gefunden</h1>' +
                '<p>Die angeforderte Seite konnte nicht gefunden werden.</p>' +
                '<a href="/" class="play-button">Zurück zur Startseite</a>' +
                '</div>',
            title: '404 - Seite nicht gefunden',
            script: ''
        });
    });

    // Error Handler
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).render('layouts/main', {
            body:
                '<div style="text-align: center; padding: 50px;">' +
                '<h1>500 - Serverfehler</h1>' +
                '<p>Es ist ein unerwarteter Fehler aufgetreten.</p>' +
                '<a href="/" class="play-button">Zurück zur Startseite</a>' +
                '</div>',
            title: '500 - Serverfehler',
            script: ''
        });
    });

    // Start server
    if (process.env.NODE_ENV !== 'test') {
        app.listen(port, () => {
            console.log(`Server läuft auf http://localhost:${port}`);
        });
    }
}).catch(err => {
    console.error('Failed to connect to database:', err);
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
    }
});

module.exports = app;
