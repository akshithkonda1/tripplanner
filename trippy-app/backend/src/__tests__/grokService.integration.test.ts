import http from 'node:http';
import { AddressInfo } from 'node:net';
import { getAIProvider } from '../services/aiService';

// End-to-end check of the Grok path using REAL axios (no mock) against a local
// HTTP server that mimics the xAI chat-completions endpoint. This exercises
// provider selection -> GrokService -> HTTP request/response parsing.
describe('Grok provider (integration over HTTP)', () => {
  const originalEnv = { ...process.env };
  let server: http.Server;
  let baseUrl: string;
  let lastRequest: { auth?: string; model?: string; messages?: any[] };

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', c => (body += c));
      req.on('end', () => {
        const parsed = JSON.parse(body || '{}');
        lastRequest = {
          auth: req.headers['authorization'] as string,
          model: parsed.model,
          messages: parsed.messages,
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            model: parsed.model,
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: `Grok reply via ${parsed.model}`,
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 20, completion_tokens: 14 },
          })
        );
      });
    });

    await new Promise<void>(resolve => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}/v1/chat/completions`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
    process.env = { ...originalEnv };
  });

  beforeEach(() => {
    process.env.GROK_API_KEY = 'integration-key';
    process.env.GROK_API_URL = baseUrl;
    process.env.GROK_MODEL = 'grok-4';
    process.env.AI_PROVIDER = 'grok';
    lastRequest = {};
  });

  it('routes chat() through Grok and returns the model reply', async () => {
    const ai = getAIProvider();
    expect(ai.name).toBe('grok');

    const reply = await ai.chat(
      [{ role: 'user', content: 'Hey Sam!' }],
      'You are Sam.'
    );

    expect(reply).toBe('Grok reply via grok-4');
    expect(lastRequest.auth).toBe('Bearer integration-key');
    expect(lastRequest.model).toBe('grok-4');
    expect(lastRequest.messages).toEqual([
      { role: 'system', content: 'You are Sam.' },
      { role: 'user', content: 'Hey Sam!' },
    ]);
  });

  it('routes plan() through Grok as well', async () => {
    const reply = await getAIProvider().plan([
      { role: 'user', content: 'Plan a 3-day trip.' },
    ]);
    expect(reply).toBe('Grok reply via grok-4');
  });
});
