import { describe, expect, it, vi } from "vitest";
import type { ChatPlan } from "./chat-plan";
import { openChat } from "./open-chat";

const PLAN: ChatPlan = {
  url: "https://chatgpt.com/",
  draft: "File: Note.md\n\nContext:\nText\n\nRequest:\n",
  prefilled: false,
  transfer: "clipboard-size",
  copyToClipboard: true,
};

describe("openChat", () => {
  it("opens the browser destination and copies the unsent draft", async () => {
    const callOrder: string[] = [];
    const openUrl = vi.fn(() => {
      callOrder.push("open");
    });
    const copyText = vi.fn(async () => {
      callOrder.push("copy");
    });

    const result = await openChat(PLAN, { openUrl, copyText });

    expect(openUrl).toHaveBeenCalledOnce();
    expect(openUrl).toHaveBeenCalledWith(PLAN.url);
    expect(copyText).toHaveBeenCalledWith(PLAN.draft);
    expect(callOrder).toEqual(["copy", "open"]);
    expect(result).toEqual({ browserOpened: true, clipboardCopied: true });
  });

  it("still opens the browser when clipboard permission is denied", async () => {
    const openUrl = vi.fn();
    const copyText = vi.fn().mockRejectedValue(new Error("Permission denied"));

    const result = await openChat(PLAN, { openUrl, copyText });

    expect(openUrl).toHaveBeenCalledWith(PLAN.url);
    expect(result).toEqual({ browserOpened: true, clipboardCopied: false });
  });

  it("still opens the browser when clipboard access throws synchronously", async () => {
    const openUrl = vi.fn();
    const copyText = vi.fn(() => {
      throw new Error("Clipboard unavailable");
    });

    const result = await openChat(PLAN, { openUrl, copyText });

    expect(openUrl).toHaveBeenCalledWith(PLAN.url);
    expect(result).toEqual({ browserOpened: true, clipboardCopied: false });
  });

  it("finishes copying when opening the browser throws", async () => {
    const openUrl = vi.fn(() => {
      throw new Error("Browser unavailable");
    });
    const copyText = vi.fn().mockResolvedValue(undefined);

    const result = await openChat(PLAN, { openUrl, copyText });

    expect(copyText).toHaveBeenCalledWith(PLAN.draft);
    expect(result).toEqual({ browserOpened: false, clipboardCopied: true });
  });
});
