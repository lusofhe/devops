// Jest Setup-Datei für globale Test-Konfiguration

// Globale Test-Timeouts für langsamere CI-Umgebungen
jest.setTimeout(10000);

// Umgebungsvariablen für Tests setzen
process.env.NODE_ENV = 'test';
process.env.GOOGLE_TTS_API_KEY = 'test-api-key';
process.env.MONGODB_URL = 'mongodb://localhost:27017/test';

// Console-Logs in Tests unterdrücken (außer Errors)
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: console.error // Errors weiterhin anzeigen
};

// Automatisches Cleanup von Timers und Mocks
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// Error Handling für unbehandelte Promise Rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Warnung für Memory Leaks unterdrücken (common in Test-Umgebungen)
process.setMaxListeners(0);

// Global beforeEach für alle Tests
beforeEach(() => {
  // Reset environment für jeden Test
  process.env.NODE_ENV = 'test';
  process.env.GOOGLE_TTS_API_KEY = 'test-api-key';
});
