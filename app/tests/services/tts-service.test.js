const TTSService = require('../../services/tts-service');
const axios = require('axios');
const fs = require('fs');

jest.mock('axios');
jest.mock('fs');

describe('TTSService', () => {
  let ttsService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    // Mock environment variable
    process.env.GOOGLE_TTS_API_KEY = mockApiKey;

    // Mock fs methods
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    fs.copyFileSync.mockImplementation(() => {});

    // Reset axios mock
    axios.post.mockReset();

    ttsService = new TTSService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.GOOGLE_TTS_API_KEY;
  });

  describe('constructor', () => {
    it('should initialize with default settings', () => {
      expect(ttsService.language).toBe('de-DE');
      expect(ttsService.speakingRate).toBe(1.0);
      expect(ttsService.voice).toBe('NEUTRAL');
    });

    it('should create audio directory if not exists', () => {
      fs.existsSync.mockReturnValue(false);
      new TTSService();
      expect(fs.mkdirSync).toHaveBeenCalled();
    });
  });

  describe('setLanguage', () => {
    it('should set German language', () => {
      ttsService.setLanguage('DE');
      expect(ttsService.language).toBe('de-DE');
    });

    it('should set Vietnamese language', () => {
      ttsService.setLanguage('VN');
      expect(ttsService.language).toBe('vi-VN');
    });

    it('should handle legacy language codes', () => {
      ttsService.setLanguage('deutsch');
      expect(ttsService.language).toBe('de-DE');

      ttsService.setLanguage('vietnamesisch');
      expect(ttsService.language).toBe('vi-VN');
    });

    it('should keep default for unknown language', () => {
      // Mock console.warn to prevent output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      ttsService.setLanguage('unknown');
      expect(ttsService.language).toBe('de-DE');

      consoleSpy.mockRestore();
    });
  });

  describe('setSpeed', () => {
    it('should set valid speed', () => {
      ttsService.setSpeed(1.5);
      expect(ttsService.speakingRate).toBe(1.5);
    });

    it('should limit minimum speed', () => {
      ttsService.setSpeed(0.1);
      expect(ttsService.speakingRate).toBe(0.25);
    });

    it('should limit maximum speed', () => {
      ttsService.setSpeed(5.0);
      expect(ttsService.speakingRate).toBe(4.0);
    });
  });

  describe('setVoice', () => {
    it('should set valid voice types', () => {
      ttsService.setVoice('MALE');
      expect(ttsService.voice).toBe('MALE');

      ttsService.setVoice('female');
      expect(ttsService.voice).toBe('FEMALE');
    });

    it('should ignore invalid voice types', () => {
      ttsService.setVoice('INVALID');
      expect(ttsService.voice).toBe('NEUTRAL');
    });
  });

  describe('generateSpeech', () => {
    const mockText = 'Hallo Welt';
    const mockAudioContent = 'base64-encoded-audio';
    const mockResponse = {
      data: { audioContent: mockAudioContent }
    };

    it('should generate speech successfully', async () => {
      // Mock that file doesn't exist (cache miss)
      fs.existsSync.mockReturnValue(false);
      axios.post.mockResolvedValue(mockResponse);

      const result = await ttsService.generateSpeech(mockText);

      expect(axios.post).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(result).toContain('.mp3');
    });

    it('should use cache for repeated requests', async () => {
      // First call - cache miss
      fs.existsSync.mockReturnValueOnce(false);
      axios.post.mockResolvedValue(mockResponse);
      await ttsService.generateSpeech(mockText);

      // Second call - cache hit
      fs.existsSync.mockReturnValueOnce(true);
      await ttsService.generateSpeech(mockText);

      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      fs.existsSync.mockReturnValue(false);
      const apiError = new Error('API Error');
      apiError.response = { data: 'API Error Details' };
      axios.post.mockRejectedValue(apiError);

      await expect(ttsService.generateSpeech(mockText)).rejects.toThrow('API Error');
    });

    it('should send correct API request', async () => {
      fs.existsSync.mockReturnValue(false);
      axios.post.mockResolvedValue(mockResponse);

      await ttsService.generateSpeech(mockText);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('texttospeech.googleapis.com'),
        expect.objectContaining({
          input: { text: mockText },
          voice: {
            languageCode: 'de-DE',
            ssmlGender: 'NEUTRAL'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0
          }
        })
      );
    });
  });

  describe('generateParameterHash', () => {
    it('should generate consistent hash for same parameters', () => {
      const hash1 = ttsService.generateParameterHash('test');
      const hash2 = ttsService.generateParameterHash('test');

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(32); // MD5 hash length
    });

    it('should generate different hash for different parameters', () => {
      const hash1 = ttsService.generateParameterHash('test1');
      const hash2 = ttsService.generateParameterHash('test2');

      expect(hash1).not.toBe(hash2);
    });
  });
});
