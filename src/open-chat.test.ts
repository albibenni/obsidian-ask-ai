import { describe, expect, it, vi } from "vitest";
import type { ChatPlan } from "./chat-plan";
import { openChat } from "./open-chat";

const PLAN: ChatPlan = {
  url: "https://chatgpt.com/",
  draft: "File: Note.md\n\nContext:\nText\n\nRequest:\n",
  prefilled: false,
  copyToClipboard: true,
};

describe("openChat", () => {
  it("opens the browser destination and copies the unsent draft", async () => {
    const openUrl = vi.fn();
    const copyText = vi.fn().mockResolvedValue(undefined);

    const result = await openChat(PLAN, { openUrl, copyText });

    expect(openUrl).toHaveBeenCalledOnce();
    expect(openUrl).toHaveBeenCalledWith(PLAN.url);
    expect(copyText).toHaveBeenCalledWith(PLAN.draft);
    expect(result).toEqual({ clipboardCopied: true });
  });

  it("still opens the browser when clipboard permission is denied", async () => {
    const openUrl = vi.fn();
    const copyText = vi.fn().mockRejectedValue(new Error("Permission denied"));

    const result = await openChat(PLAN, { openUrl, copyText });

    expect(openUrl).toHaveBeenCalledWith(PLAN.url);
    expect(result).toEqual({ clipboardCopied: false });
  });
});
