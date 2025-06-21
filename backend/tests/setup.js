// backend/tests/setup.js
// Jest Setup-Datei für globale Test-Konfiguration

// Globale Test-Timeouts für langsamere CI-Umgebungen
jest.setTimeout(10000);

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
