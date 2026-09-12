export const MAX_URL_CONTEXT_CHARACTERS = 6_000;

export type ChatProvider = "chatgpt" | "claude" | "gemini" | "custom";
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
  const canPrefill =
    input.source === "selection" &&
    input.context.length <= MAX_URL_CONTEXT_CHARACTERS;

  if (canPrefill && input.provider === "chatgpt") {
    return clipboardPlan(
      `${NEW_CHAT_URLS.chatgpt}?prompt=${encodeURIComponent(draft)}`,
      draft,
      true,
    );
  }

  if (canPrefill && input.provider === "claude") {
    return clipboardPlan(
      `${NEW_CHAT_URLS.claude}?q=${encodeURIComponent(draft)}`,
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
