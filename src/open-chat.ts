import type { ChatPlan } from "./chat-plan";

export interface ChatBoundaries {
  openUrl: (url: string) => void;
  copyText: (text: string) => Promise<void>;
}

export interface OpenChatResult {
  browserOpened: boolean;
  clipboardCopied: boolean;
}

export async function openChat(
  plan: ChatPlan,
  boundaries: ChatBoundaries,
): Promise<OpenChatResult> {
  let clipboardResult: Promise<boolean>;
  try {
    clipboardResult = boundaries.copyText(plan.draft).then(
      () => true,
      () => false,
    );
  } catch {
    clipboardResult = Promise.resolve(false);
  }

  let browserOpened = true;
  try {
    boundaries.openUrl(plan.url);
  } catch {
    browserOpened = false;
  }

  return {
    browserOpened,
    clipboardCopied: await clipboardResult,
  };
}
