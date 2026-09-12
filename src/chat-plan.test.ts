import { describe, expect, it } from "vitest";
import {
  buildChatPlan,
  buildDraft,
  isChatProvider,
  MAX_PREFILL_URL_LENGTH,
} from "./chat-plan";

describe("buildDraft", () => {
  it("leaves an unsent request placeholder after the note context", () => {
    expect(buildDraft("Ideas.md", "Selected words")).toBe(
      "File: Ideas.md\n\nContext:\nSelected words\n\nRequest:\n",
    );
  });

  it("repeats the focused selection in the request after the full note", () => {
    expect(buildDraft("Ideas.md", "Complete note", "Focused passage")).toBe(
      "File: Ideas.md\n\nContext:\nComplete note\n\nRequest:\nFocused passage\n\n",
    );
  });
});

describe("isChatProvider", () => {
  it("rejects inherited object property names", () => {
    expect(isChatProvider("toString")).toBe(false);
  });
});

describe("buildChatPlan", () => {
  it("prefills a short selection in a new ChatGPT chat and keeps a clipboard fallback", () => {
    const plan = buildChatPlan({
      provider: "chatgpt",
      source: "selection",
      fileName: "Ideas.md",
      context: "Selected words",
    });

    expect(plan.url).toBe(
      `https://chatgpt.com/?prompt=${encodeURIComponent(plan.draft)}`,
    );
    expect(plan.prefilled).toBe(true);
    expect(plan.transfer).toBe("url-prefill");
    expect(plan.copyToClipboard).toBe(true);
  });

  it("prefills a short selection in a new Claude chat", () => {
    const plan = buildChatPlan({
      provider: "claude",
      source: "selection",
      fileName: "Ideas.md",
      context: "Selected words",
    });

    expect(plan.url).toBe(
      `https://claude.ai/new?q=${encodeURIComponent(plan.draft)}`,
    );
    expect(plan.prefilled).toBe(true);
  });

  it("prefills a whole note when it fits in a ChatGPT URL", () => {
    const plan = buildChatPlan({
      provider: "chatgpt",
      source: "note",
      fileName: "Ideas.md",
      context: "A short complete note",
    });

    expect(plan.url).toBe(
      `https://chatgpt.com/?prompt=${encodeURIComponent(plan.draft)}`,
    );
    expect(plan.prefilled).toBe(true);
  });

  it("prefills a whole note when it fits in a Claude URL", () => {
    const plan = buildChatPlan({
      provider: "claude",
      source: "note",
      fileName: "Ideas.md",
      context: "A short complete note",
    });

    expect(plan.url).toBe(
      `https://claude.ai/new?q=${encodeURIComponent(plan.draft)}`,
    );
    expect(plan.prefilled).toBe(true);
  });

  it.each(["gemini", "custom"] as const)(
    "uses clipboard-only transfer for %s",
    (provider) => {
      const plan = buildChatPlan({
        provider,
        customUrl: "https://example.com/new",
        source: "selection",
        fileName: "Ideas.md",
        context: "Selected words",
      });

      expect(plan.prefilled).toBe(false);
      expect(plan.transfer).toBe("clipboard-provider");
      expect(plan.copyToClipboard).toBe(true);
      expect(plan.url).toBe(
        provider === "gemini"
          ? "https://gemini.google.com/app"
          : "https://example.com/new",
      );
    },
  );

  it("keeps oversized content out of the URL", () => {
    const context = "x".repeat(MAX_PREFILL_URL_LENGTH + 1);
    const plan = buildChatPlan({
      provider: "chatgpt",
      source: "note",
      fileName: "Private.md",
      context,
    });

    expect(plan.url).toBe("https://chatgpt.com/?prompt=");
    expect(plan.prefilled).toBe(false);
    expect(plan.transfer).toBe("clipboard-size");
    expect(plan.draft).toContain(context);
  });

  it("uses the clipboard when URL encoding pushes a selection over the limit", () => {
    const plan = buildChatPlan({
      provider: "claude",
      source: "selection",
      fileName: "Emoji.md",
      context: "😀".repeat(MAX_PREFILL_URL_LENGTH / 2),
    });

    expect(plan.url).toBe("https://claude.ai/new?q=");
    expect(plan.prefilled).toBe(false);
  });
});
