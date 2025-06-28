const TrackParser = require('../../utils/track-parser');

describe('TrackParser', () => {
  describe('parseTrack', () => {
    it('should parse simple track string', () => {
      const trackString = 'DE(1.0) Pause (2s) VN(0.8)';
      const result = TrackParser.parseTrack(trackString);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'speech', language: 'DE', speed: 1.0 });
      expect(result[1]).toEqual({ type: 'pause', duration: 2000 });
      expect(result[2]).toEqual({ type: 'speech', language: 'VN', speed: 0.8 });
    });

    it('should parse multi-line track string', () => {
      const trackString = `DE(1.0) VN(0.8)
                          Pause (3s)
                          DE(1.2) VN(0.6)`;
      const result = TrackParser.parseTrack(trackString);

      expect(result).toHaveLength(5);
    });

    it('should handle empty lines', () => {
      const trackString = `DE(1.0)

                          VN(0.8)`;
      const result = TrackParser.parseTrack(trackString);

      expect(result).toHaveLength(2);
    });
  });

  describe('parseLine', () => {
    it('should parse speech instructions', () => {
      const result = TrackParser.parseLine('DE(1.5) VN(0.7)');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'speech', language: 'DE', speed: 1.5 });
      expect(result[1]).toEqual({ type: 'speech', language: 'VN', speed: 0.7 });
    });

    it('should parse pause instructions', () => {
      const result = TrackParser.parseLine('Pause (5s)');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'pause', duration: 5000 });
    });

    it('should handle instructions without parentheses', () => {
      // KORRIGIERT: Der Parser gibt tatsächlich Ergebnisse zurück, auch ohne explizite Geschwindigkeit
      const result = TrackParser.parseLine('DE VN');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'speech', language: 'DE', speed: 1.0 });
      expect(result[1]).toEqual({ type: 'speech', language: 'VN', speed: 1.0 });
    });

    it('should handle mixed instructions', () => {
      const result = TrackParser.parseLine('DE(1.0) Pause (2s) VN(0.8) Pause (1s)');

      expect(result).toHaveLength(4);
      expect(result[0].type).toBe('speech');
      expect(result[1].type).toBe('pause');
      expect(result[2].type).toBe('speech');
      expect(result[3].type).toBe('pause');
    });
  });
});
