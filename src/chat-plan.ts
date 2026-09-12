export const MAX_PREFILL_URL_LENGTH = 6_000;

const CHAT_PROVIDERS = ["chatgpt", "claude", "gemini", "custom"] as const;

export type ChatProvider = (typeof CHAT_PROVIDERS)[number];
export type ContextSource = "selection" | "note";

export interface ChatPlanInput {
  provider: ChatProvider;
  source: ContextSource;
  fileName: string;
  context: string;
  customUrl?: string;
}

export interface ChatPlan {
  url: string;
  draft: string;
  prefilled: boolean;
  copyToClipboard: true;
}

export function isChatProvider(value: string): value is ChatProvider {
  return CHAT_PROVIDERS.some((provider) => provider === value);
}

const NEW_CHAT_URLS = {
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/new",
  gemini: "https://gemini.google.com/app",
} as const;

export function buildDraft(fileName: string, context: string): string {
  return `File: ${fileName}\n\nContext:\n${context}\n\nRequest:\n`;
}

export function buildChatPlan(input: ChatPlanInput): ChatPlan {
  const draft = buildDraft(input.fileName, input.context);
  const encodedDraft = encodeURIComponent(draft);
  const canPrefill =
    input.source === "selection" &&
    encodedDraft.length <= MAX_PREFILL_URL_LENGTH;

  if (canPrefill && input.provider === "chatgpt") {
    return clipboardPlan(
      `${NEW_CHAT_URLS.chatgpt}?prompt=${encodedDraft}`,
      draft,
      true,
    );
  }

  if (canPrefill && input.provider === "claude") {
    return clipboardPlan(
      `${NEW_CHAT_URLS.claude}?q=${encodedDraft}`,
      draft,
      true,
    );
  }

  return clipboardPlan(resolveBaseUrl(input), draft, false);
}

function resolveBaseUrl(input: ChatPlanInput): string {
  if (input.provider === "custom") {
    if (!input.customUrl) {
      throw new Error("A custom chat URL is required");
    }
    return input.customUrl;
  }

  return NEW_CHAT_URLS[input.provider];
}

function clipboardPlan(
  url: string,
  draft: string,
  prefilled: boolean,
): ChatPlan {
  return {
    url,
    draft,
    prefilled,
    copyToClipboard: true,
  };
}
