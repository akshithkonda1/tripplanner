export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Common interface implemented by every AI backend (Claude via Bedrock, Grok
 * via the xAI API, ...). Handlers depend on this interface rather than a
 * specific vendor so the provider can be swapped via configuration.
 */
export interface AIProvider {
  /** Stable identifier for the provider, e.g. "claude" or "grok". */
  readonly name: string;

  /** Conversational response, tuned for short back-and-forth chat. */
  chat(
    messages: AIMessage[],
    systemPrompt?: string,
    maxTokens?: number
  ): Promise<string>;

  /** Deeper reasoning response, tuned for itinerary planning. */
  plan(
    messages: AIMessage[],
    systemPrompt?: string,
    maxTokens?: number
  ): Promise<string>;
}
