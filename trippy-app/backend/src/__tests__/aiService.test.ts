import { getAIProvider } from '../services/aiService';

describe('AI provider selection', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AI_PROVIDER;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults to Claude when nothing is configured', () => {
    expect(getAIProvider().name).toBe('claude');
  });

  it('selects Grok via the AI_PROVIDER env var', () => {
    process.env.AI_PROVIDER = 'grok';
    expect(getAIProvider().name).toBe('grok');
  });

  it('selects Grok via an explicit argument (case-insensitive)', () => {
    expect(getAIProvider('GROK').name).toBe('grok');
    expect(getAIProvider('xai').name).toBe('grok');
  });

  it('treats claude aliases as Claude', () => {
    expect(getAIProvider('anthropic').name).toBe('claude');
    expect(getAIProvider('bedrock').name).toBe('claude');
  });

  it('falls back to Claude for unknown providers', () => {
    expect(getAIProvider('llama-9000').name).toBe('claude');
  });

  it('lets an explicit argument override the env var', () => {
    process.env.AI_PROVIDER = 'grok';
    expect(getAIProvider('claude').name).toBe('claude');
  });
});
