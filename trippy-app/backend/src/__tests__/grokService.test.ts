import axios from 'axios';
import { GrokService } from '../services/grokService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Grok Service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GROK_API_KEY = 'test-xai-key';
    delete process.env.GROK_MODEL;
    delete process.env.GROK_PLANNING_MODEL;
    delete process.env.GROK_API_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function mockGrokReply(content: string) {
    mockedAxios.post.mockResolvedValue({
      data: {
        model: 'grok-4',
        choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 12, completion_tokens: 7 },
      },
    });
  }

  describe('chat', () => {
    it('returns the assistant content from the xAI response', async () => {
      mockGrokReply('Hello from Grok!');

      const grok = new GrokService();
      const result = await grok.chat(
        [{ role: 'user', content: 'Hi Sam' }],
        'You are Sam.'
      );

      expect(result).toBe('Hello from Grok!');
    });

    it('sends the system prompt first and includes auth + model', async () => {
      mockGrokReply('ok');

      const grok = new GrokService();
      await grok.chat([{ role: 'user', content: 'Plan my trip' }], 'You are Sam.');

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      const [url, body, config] = mockedAxios.post.mock.calls[0];

      expect(url).toBe('https://api.x.ai/v1/chat/completions');
      expect(body).toMatchObject({
        model: 'grok-4',
        messages: [
          { role: 'system', content: 'You are Sam.' },
          { role: 'user', content: 'Plan my trip' },
        ],
      });
      expect((config as any).headers.Authorization).toBe('Bearer test-xai-key');
    });

    it('omits the system message when no system prompt is given', async () => {
      mockGrokReply('ok');

      const grok = new GrokService();
      await grok.chat([{ role: 'user', content: 'Hi' }]);

      const [, body] = mockedAxios.post.mock.calls[0];
      expect((body as any).messages).toEqual([{ role: 'user', content: 'Hi' }]);
    });

    it('honors GROK_MODEL and GROK_API_URL overrides', async () => {
      process.env.GROK_MODEL = 'grok-4.6';
      process.env.GROK_API_URL = 'https://proxy.internal/v1/chat/completions';
      mockGrokReply('ok');

      const grok = new GrokService();
      await grok.chat([{ role: 'user', content: 'Hi' }]);

      const [url, body] = mockedAxios.post.mock.calls[0];
      expect(url).toBe('https://proxy.internal/v1/chat/completions');
      expect((body as any).model).toBe('grok-4.6');
    });
  });

  describe('plan', () => {
    it('uses GROK_PLANNING_MODEL when set', async () => {
      process.env.GROK_MODEL = 'grok-4';
      process.env.GROK_PLANNING_MODEL = 'grok-4-heavy';
      mockGrokReply('{"overview":"trip"}');

      const grok = new GrokService();
      const result = await grok.plan([{ role: 'user', content: 'Plan it' }]);

      expect(result).toBe('{"overview":"trip"}');
      const [, body] = mockedAxios.post.mock.calls[0];
      expect((body as any).model).toBe('grok-4-heavy');
    });
  });

  describe('errors', () => {
    it('throws when GROK_API_KEY is missing', async () => {
      delete process.env.GROK_API_KEY;

      const grok = new GrokService();
      await expect(
        grok.chat([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow('GROK_API_KEY is not set');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('wraps xAI API errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const grok = new GrokService();
      await expect(
        grok.chat([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow('Failed to invoke Grok via xAI API');
    });
  });
});
