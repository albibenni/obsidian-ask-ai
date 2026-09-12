export const MAX_PREFILL_URL_LENGTH = 6_000;

const CHAT_PROVIDERS = ["chatgpt", "claude", "gemini", "custom"] as const;

export type ChatProvider = (typeof CHAT_PROVIDERS)[number];
export type ContextSource = "selection" | "note";
export type ChatTransfer =
  | "url-prefill"
  | "clipboard-size"
  | "clipboard-provider";

export interface ChatPlanInput {
  provider: ChatProvider;
  source: ContextSource;
  fileName: string;
  context: string;
  requestContext?: string;
  customUrl?: string;
}

export interface ChatPlan {
  url: string;
  draft: string;
  prefilled: boolean;
  transfer: ChatTransfer;
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

export function buildDraft(
  fileName: string,
  context: string,
  requestContext = "",
): string {
  const request = requestContext === "" ? "" : `${requestContext}\n\n`;
  return `File: ${fileName}\n\nContext:\n${context}\n\nRequest:\n${request}`;
}

export function buildChatPlan(input: ChatPlanInput): ChatPlan {
  const draft = buildDraft(input.fileName, input.context, input.requestContext);
  const encodedDraft = encodeURIComponent(draft);
  const canPrefill = encodedDraft.length <= MAX_PREFILL_URL_LENGTH;

  if (canPrefill && input.provider === "chatgpt") {
    return clipboardPlan(
      `${NEW_CHAT_URLS.chatgpt}?prompt=${encodedDraft}`,
      draft,
      true,
      "url-prefill",
    );
  }

  if (canPrefill && input.provider === "claude") {
    return clipboardPlan(
      `${NEW_CHAT_URLS.claude}?q=${encodedDraft}`,
      draft,
      true,
      "url-prefill",
    );
  }

  const supportsUrlPrefill =
    input.provider === "chatgpt" || input.provider === "claude";
  return clipboardPlan(
    supportsUrlPrefill
      ? resolveEmptyPrefillUrl(input.provider)
      : resolveBaseUrl(input),
    draft,
    false,
    supportsUrlPrefill ? "clipboard-size" : "clipboard-provider",
  );
}

function resolveEmptyPrefillUrl(provider: ChatProvider): string {
  if (provider === "chatgpt") {
    return `${NEW_CHAT_URLS.chatgpt}?prompt=`;
  }
  if (provider === "claude") {
    return `${NEW_CHAT_URLS.claude}?q=`;
  }
  throw new Error("The provider does not support URL prefilling");
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
  transfer: ChatTransfer,
): ChatPlan {
  return {
    url,
    draft,
    prefilled,
    transfer,
    copyToClipboard: true,
  };
}
