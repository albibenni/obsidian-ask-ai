import type { App } from "obsidian";
import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  PluginSettingTab: class {},
}));

import type AskAiPlugin from "./main";
import { AskAiSettingTab } from "./settings";

describe("AskAiSettingTab", () => {
  it("declares searchable provider, custom URL, and transfer settings", () => {
    const plugin = {
      settings: { provider: "chatgpt", customUrl: "" },
    } as AskAiPlugin;
    const tab = new AskAiSettingTab({} as App, plugin);

    expect(tab.getSettingDefinitions()).toMatchObject([
      {
        name: "AI chat",
        control: { type: "dropdown", key: "provider" },
      },
      {
        name: "Custom new-chat URL",
        control: { type: "text", key: "customUrl" },
      },
      {
        name: "How context is transferred",
      },
    ]);
  });

  it("shows and validates the custom URL only for the custom provider", () => {
    const plugin = {
      settings: { provider: "chatgpt", customUrl: "" },
    } as AskAiPlugin;
    const tab = new AskAiSettingTab({} as App, plugin);
    const customUrl = tab.getSettingDefinitions()[1];

    const visible = customUrl?.visible;
    if (typeof visible !== "function") {
      throw new Error("Expected conditional custom URL visibility");
    }
    expect(visible()).toBe(false);
    plugin.settings.provider = "custom";
    expect(visible()).toBe(true);

    if (
      !customUrl ||
      !("control" in customUrl) ||
      customUrl.control?.type !== "text"
    ) {
      throw new Error("Expected a declarative custom URL control");
    }
    expect(customUrl.control.validate?.("http://example.com")).toBe(
      "Enter a valid HTTPS new-chat URL.",
    );
    expect(customUrl.control.validate?.("https://example.com/new")).toBe(
      undefined,
    );
  });
});
