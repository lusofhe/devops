// utils/track-parser.js
class TrackParser {
  /**
   * Parst einen Track-String und gibt eine Sequenz von Anweisungen zurück
   * @param {string} trackString - Der zu parsende Track-String
   * @returns {Array} Array mit Anweisungen
   */
  static parseTrack(trackString) {
    const lines = trackString.split('\n').filter(line => line.trim() !== '');
    const instructions = [];

    for (const line of lines) {
      const lineInstructions = this.parseLine(line);
      instructions.push(...lineInstructions);
    }

    return instructions;
  }

  /**
   * Parst eine einzelne Zeile des Tracks
   * @param {string} line - Die zu parsende Zeile
   * @returns {Array} Array mit Anweisungen für diese Zeile
   */
  static parseLine(line) {
    const parts = line.split(' ');
    const instructions = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();

      if (part === 'Pause') {
        // Format: Pause (Xs)
        const durationMatch = parts[i+1].match(/\((\d+)s\)/);
        if (durationMatch) {
          const duration = parseInt(durationMatch[1], 10);
          instructions.push({ type: 'pause', duration: duration * 1000 }); // in ms
          i++; // Skip the duration part
        }
      } else if (part.startsWith('DE') || part.startsWith('VN')) {
        // Format: DE(speed) or VN(speed)
        const language = part.substring(0, 2);
        const speedMatch = part.match(/\(([\d\.]+)\)/);
        const speed = speedMatch ? parseFloat(speedMatch[1]) : 1.0;

        instructions.push({
          type: 'speech',
          language,
          speed: speed
        });
      }
    }

    return instructions;
  }
}

module.exports = TrackParser;
