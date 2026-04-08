export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface LlmMessage {
  role: ChatRole;
  content: string;
  name?: string;
  reasoning_details?: unknown;
}

export interface CompletionOptions {
  model?: string;
  reasoningEnabled?: boolean;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

export interface CompletionResult {
  model: string;
  message: LlmMessage;
  usage?: Record<string, unknown>;
  raw: Record<string, unknown>;
}

interface OpenRouterMessage {
  role: ChatRole;
  content: string;
  name?: string;
  reasoning_details?: unknown;
}

interface OpenRouterCompletionResponse {
  id?: string;
  model?: string;
  usage?: Record<string, unknown>;
  choices?: Array<{
    message?: {
      role?: ChatRole;
      content?: string;
      reasoning_details?: unknown;
    };
  }>;
}

const DEFAULT_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b:free";

export class OpenRouterLlmService {
  private readonly apiUrl: string;
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly reasoningEnabled: boolean;
  private readonly appName: string;
  private readonly referer?: string;

  constructor(config?: {
    apiUrl?: string;
    apiKey?: string;
    model?: string;
    reasoningEnabled?: boolean;
    appName?: string;
    referer?: string;
  }) {
    this.apiUrl = config?.apiUrl ?? process.env.OPENROUTER_API_URL ?? DEFAULT_API_URL;
    this.apiKey = config?.apiKey ?? process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
    this.model = config?.model ?? process.env.OPENROUTER_MODEL ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
    this.reasoningEnabled =
      config?.reasoningEnabled ??
      parseBoolean(process.env.OPENROUTER_REASONING_ENABLED, true);
    this.appName = config?.appName ?? process.env.OPENROUTER_APP_NAME ?? "Direct";
    this.referer = config?.referer ?? process.env.OPENROUTER_REFERER;
  }

  async complete(
    messages: LlmMessage[],
    options?: CompletionOptions
  ): Promise<CompletionResult> {
    const apiKey = options?.apiKey ?? this.apiKey;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is missing");
    }

    const requestBody: Record<string, unknown> = {
      model: options?.model ?? this.model,
      messages: messages.map((message) => this.serializeMessage(message)),
      reasoning: {
        enabled: options?.reasoningEnabled ?? this.reasoningEnabled
      }
    };

    if (typeof options?.temperature === "number") {
      requestBody.temperature = options.temperature;
    }
    if (typeof options?.maxTokens === "number") {
      requestBody.max_tokens = options.maxTokens;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-OpenRouter-Title": this.appName
    };

    if (this.referer) {
      headers["HTTP-Referer"] = this.referer;
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenRouter request failed with status ${response.status}: ${errorBody}`
      );
    }

    const payload = (await response.json()) as OpenRouterCompletionResponse;
    const message = payload.choices?.[0]?.message;

    if (!message) {
      throw new Error("OpenRouter response did not include a message");
    }

    return {
      model: payload.model ?? String(requestBody.model),
      message: {
        role: message.role ?? "assistant",
        content: message.content ?? "",
        reasoning_details: message.reasoning_details
      },
      usage: payload.usage,
      raw: payload as unknown as Record<string, unknown>
    };
  }

  async continueReasoning(
    messages: LlmMessage[],
    followUpPrompt: string,
    options?: CompletionOptions
  ) {
    const firstPass = await this.complete(messages, options);
    const chainedMessages: LlmMessage[] = [
      ...messages,
      {
        role: "assistant",
        content: firstPass.message.content,
        reasoning_details: firstPass.message.reasoning_details
      },
      {
        role: "user",
        content: followUpPrompt
      }
    ];

    const secondPass = await this.complete(chainedMessages, options);

    return {
      firstPass,
      secondPass,
      chainedMessages
    };
  }

  private serializeMessage(message: LlmMessage): OpenRouterMessage {
    const serialized: OpenRouterMessage = {
      role: message.role,
      content: message.content
    };

    if (message.name) {
      serialized.name = message.name;
    }
    if (typeof message.reasoning_details !== "undefined") {
      serialized.reasoning_details = message.reasoning_details;
    }

    return serialized;
  }
}

export function createOpenRouterLlmService() {
  return new OpenRouterLlmService();
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}
