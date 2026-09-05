import { AIProvider } from './aiProvider';
import { bedrockService } from './bedrockService';
import { grokService } from './grokService';

export type { AIMessage, AIProvider } from './aiProvider';

export const AI_PROVIDERS: Record<string, AIProvider> = {
  claude: bedrockService,
  bedrock: bedrockService,
  anthropic: bedrockService,
  grok: grokService,
  xai: grokService,
};

export const DEFAULT_AI_PROVIDER = 'claude';

/**
 * Resolve which AI provider to use. Selection order:
 *   1. explicit `name` argument (e.g. per-request override)
 *   2. `AI_PROVIDER` environment variable
 *   3. the default provider (Claude)
 *
 * Unknown names fall back to the default provider with a warning rather than
 * failing the request.
 */
export function getAIProvider(name?: string): AIProvider {
  const requested = (name || process.env.AI_PROVIDER || DEFAULT_AI_PROVIDER)
    .trim()
    .toLowerCase();

  const provider = AI_PROVIDERS[requested];
  if (!provider) {
    console.warn(
      `Unknown AI provider "${requested}". Falling back to "${DEFAULT_AI_PROVIDER}". ` +
        `Supported values: ${Object.keys(AI_PROVIDERS).join(', ')}.`
    );
    return AI_PROVIDERS[DEFAULT_AI_PROVIDER];
  }

  return provider;
}
