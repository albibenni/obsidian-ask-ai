import {
  type App,
  PluginSettingTab,
  type SettingDefinitionItem,
} from "obsidian";
import { type ChatProvider, isChatProvider } from "./chat-plan";
import type AskAiPlugin from "./main";
import { isValidCustomUrl } from "./settings-schema";

type SettingKey = "provider" | "customUrl";

const PROVIDER_LABELS: Record<ChatProvider, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  custom: "Custom URL",
};

export class AskAiSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: AskAiPlugin,
  ) {
    super(app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
    return [
      {
        name: "AI chat",
        desc: "Choose the consumer chat site opened by Ask AI.",
        control: {
          type: "dropdown",
          key: "provider",
          defaultValue: "chatgpt",
          options: PROVIDER_LABELS,
        },
      },
      {
        name: "Custom new-chat URL",
        desc: "Enter an HTTPS page that starts a new chat.",
        visible: () => this.plugin.settings.provider === "custom",
        control: {
          type: "text",
          key: "customUrl",
          defaultValue: "",
          placeholder: "https://example.com/new",
          validate: (value) =>
            isValidCustomUrl(value)
              ? undefined
              : "Enter a valid HTTPS new-chat URL.",
        },
      },
      {
        name: "How context is transferred",
        desc:
          "Short selections and notes are placed in the ChatGPT or Claude URL, so they are " +
          "transmitted when the page opens—before you press Send—and may remain " +
          "in browser history. Gemini, custom sites, and longer content use " +
          "the clipboard.",
      },
    ];
  }

  getControlValue(key: string): unknown {
    return isSettingKey(key) ? this.plugin.settings[key] : undefined;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key === "provider" && typeof value === "string") {
      if (!isChatProvider(value)) {
        return;
      }
      this.plugin.settings.provider = value;
      await this.plugin.saveSettings();
      return;
    }

    if (key === "customUrl" && typeof value === "string") {
      const customUrl = value.trim();
      if (!isValidCustomUrl(customUrl)) {
        return;
      }
      this.plugin.settings.customUrl = customUrl;
      await this.plugin.saveSettings();
    }
  }
}

function isSettingKey(value: string): value is SettingKey {
  return value === "provider" || value === "customUrl";
}
