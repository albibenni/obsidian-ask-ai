import { describe, expect, it } from "vitest";
import {
  buildChatPlan,
  buildDraft,
  MAX_URL_CONTEXT_CHARACTERS,
} from "./chat-plan";

describe("buildDraft", () => {
  it("leaves an unsent request placeholder after the note context", () => {
    expect(buildDraft("Ideas.md", "Selected words")).toBe(
      "File: Ideas.md\n\nContext:\nSelected words\n\nRequest:\n",
    );
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
      expect(plan.copyToClipboard).toBe(true);
      expect(plan.url).toBe(
        provider === "gemini"
          ? "https://gemini.google.com/app"
          : "https://example.com/new",
      );
    },
  );

  it.each([
    { source: "note" as const, context: "short" },
    {
      source: "selection" as const,
      context: "x".repeat(MAX_URL_CONTEXT_CHARACTERS + 1),
    },
  ])("keeps $source content out of the URL", ({ source, context }) => {
    const plan = buildChatPlan({
      provider: "chatgpt",
      source,
      fileName: "Private.md",
      context,
    });

    expect(plan.url).toBe("https://chatgpt.com/");
    expect(plan.prefilled).toBe(false);
    expect(plan.draft).toContain(context);
  });
});
