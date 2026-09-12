import type { ChatPlan } from "./chat-plan";

export interface ChatBoundaries {
  openUrl: (url: string) => void;
  copyText: (text: string) => Promise<void>;
}

export interface OpenChatResult {
  clipboardCopied: boolean;
}

export async function openChat(
  plan: ChatPlan,
  boundaries: ChatBoundaries,
): Promise<OpenChatResult> {
  boundaries.openUrl(plan.url);

  try {
    await boundaries.copyText(plan.draft);
    return { clipboardCopied: true };
  } catch {
    return { clipboardCopied: false };
  }
}
