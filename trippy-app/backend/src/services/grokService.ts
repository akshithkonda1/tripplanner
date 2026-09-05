import axios from 'axios';
import { AIMessage, AIProvider } from './aiProvider';

// xAI (Grok) is OpenAI-compatible. Endpoint + model are configurable so this
// works against api.x.ai or any compatible gateway, and can track new Grok
// releases without a code change.
const DEFAULT_GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const DEFAULT_GROK_MODEL = 'grok-4';

interface GrokChoice {
  message?: { role: string; content: string };
  finish_reason?: string;
}

interface GrokResponse {
  model?: string;
  choices?: GrokChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

/**
 * Grok (xAI) implementation of AIProvider. Uses the OpenAI-compatible
 * chat-completions endpoint with a bearer API key.
 */
export class GrokService implements AIProvider {
  readonly name = 'grok';

  async chat(
    messages: AIMessage[],
    systemPrompt?: string,
    maxTokens: number = 1000
  ): Promise<string> {
    return this.invokeGrok(this.chatModel(), messages, systemPrompt, maxTokens);
  }

  async plan(
    messages: AIMessage[],
    systemPrompt?: string,
    maxTokens: number = 4000
  ): Promise<string> {
    return this.invokeGrok(
      this.planningModel(),
      messages,
      systemPrompt,
      maxTokens
    );
  }

  private chatModel(): string {
    return process.env.GROK_MODEL || DEFAULT_GROK_MODEL;
  }

  private planningModel(): string {
    // Fall back to the chat model when a dedicated planning model is unset.
    return process.env.GROK_PLANNING_MODEL || this.chatModel();
  }

  private async invokeGrok(
    model: string,
    messages: AIMessage[],
    systemPrompt: string | undefined,
    maxTokens: number
  ): Promise<string> {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GROK_API_KEY is not set. Provide it to use the Grok AI provider.'
      );
    }

    const apiUrl = process.env.GROK_API_URL || DEFAULT_GROK_API_URL;

    // Grok/OpenAI put the system prompt as the first message rather than a
    // separate field like Anthropic does.
    const payloadMessages = [
      ...(systemPrompt
        ? [{ role: 'system' as const, content: systemPrompt }]
        : []),
      ...messages.map(msg => ({ role: msg.role, content: msg.content })),
    ];

    try {
      const response = await axios.post<GrokResponse>(
        apiUrl,
        {
          model,
          messages: payloadMessages,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      console.log('Grok Usage:', {
        model: data.model || model,
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      });

      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Grok invocation error:', error);
      throw new Error(`Failed to invoke Grok via xAI API: ${error}`);
    }
  }
}

export const grokService = new GrokService();
