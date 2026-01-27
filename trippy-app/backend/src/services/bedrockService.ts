import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Claude model IDs in Bedrock
export const CLAUDE_MODELS = {
  SONNET: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  OPUS: 'anthropic.claude-3-opus-20240229-v1:0',
  HAIKU: 'anthropic.claude-3-5-haiku-20241022-v1:0',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BedrockResponse {
  content: Array<{
    type: string;
    text?: string;
  }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class BedrockService {
  /**
   * Call Claude via Bedrock - Conversational (Sonnet)
   */
  async chatWithSonnet(
    messages: Message[],
    systemPrompt?: string,
    maxTokens: number = 1000
  ): Promise<string> {
    return this.invokeClaude(CLAUDE_MODELS.SONNET, messages, systemPrompt, maxTokens);
  }

  /**
   * Call Claude via Bedrock - Deep Planning (Opus/Sonnet)
   * Note: Opus might not be available in all regions yet
   */
  async planWithOpus(
    messages: Message[],
    systemPrompt?: string,
    maxTokens: number = 4000
  ): Promise<string> {
    // Use Sonnet for now since it's widely available
    // Switch to Opus when available in your region
    return this.invokeClaude(CLAUDE_MODELS.SONNET, messages, systemPrompt, maxTokens);
  }

  /**
   * Generic Claude invocation via Bedrock
   */
  private async invokeClaude(
    modelId: string,
    messages: Message[],
    systemPrompt?: string,
    maxTokens: number = 1000
  ): Promise<string> {
    const payload: any = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    // Add system prompt if provided
    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const input: InvokeModelCommandInput = {
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    };

    try {
      const command = new InvokeModelCommand(input);
      const response = await bedrockClient.send(command);

      // Parse response
      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body)
      ) as BedrockResponse;

      // Log token usage for monitoring
      console.log('Bedrock Usage:', {
        model: modelId,
        inputTokens: responseBody.usage.input_tokens,
        outputTokens: responseBody.usage.output_tokens,
        totalCost: this.calculateCost(
          modelId,
          responseBody.usage.input_tokens,
          responseBody.usage.output_tokens
        ),
      });

      // Extract text from response
      const textContent = responseBody.content.find(c => c.type === 'text');
      return textContent?.text || '';
    } catch (error) {
      console.error('Bedrock invocation error:', error);
      throw new Error(`Failed to invoke Claude via Bedrock: ${error}`);
    }
  }

  /**
   * Calculate cost for monitoring
   */
  private calculateCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    // Bedrock pricing (as of Jan 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      [CLAUDE_MODELS.SONNET]: { input: 3.0, output: 15.0 }, // per 1M tokens
      [CLAUDE_MODELS.OPUS]: { input: 15.0, output: 75.0 },
      [CLAUDE_MODELS.HAIKU]: { input: 0.25, output: 1.25 },
    };

    const rates = pricing[modelId] || pricing[CLAUDE_MODELS.SONNET];
    const inputCost = (inputTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;

    return inputCost + outputCost;
  }

  /**
   * Streaming response (for real-time chat)
   */
  async streamChatWithSonnet(
    messages: Message[],
    systemPrompt?: string,
    onChunk?: (text: string) => void
  ): Promise<string> {
    // Bedrock supports streaming via InvokeModelWithResponseStream
    // For now, using regular invoke - can add streaming later
    return this.chatWithSonnet(messages, systemPrompt);
  }
}

export const bedrockService = new BedrockService();
