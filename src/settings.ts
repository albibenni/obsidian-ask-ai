import { type App, PluginSettingTab, Setting } from "obsidian";
import { type ChatProvider, isChatProvider } from "./chat-plan";
import type AskAiPlugin from "./main";
import { isValidCustomUrl } from "./settings-schema";

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

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("AI chat")
      .setDesc("Choose the consumer chat site opened by Ask AI.")
      .addDropdown((dropdown) => {
        for (const [value, label] of Object.entries(PROVIDER_LABELS)) {
          dropdown.addOption(value, label);
        }

        dropdown
          .setValue(this.plugin.settings.provider)
          .onChange(async (value) => {
            if (!isChatProvider(value)) {
              return;
            }
            this.plugin.settings.provider = value;
            await this.plugin.saveSettings();
            this.display();
          });
      });

    if (this.plugin.settings.provider === "custom") {
      this.displayCustomUrl(containerEl);
    }

    new Setting(containerEl)
      .setName("How context is transferred")
      .setDesc(
        "Short selections and notes are placed in the ChatGPT or Claude URL, so they are " +
          "transmitted when the page opens—before you press Send—and may remain " +
          "in browser history. Gemini, custom sites, and longer content use " +
          "the clipboard.",
      );
  }

  private displayCustomUrl(containerEl: HTMLElement): void {
    const setting = new Setting(containerEl)
      .setName("Custom new-chat URL")
      .setDesc("Enter an HTTPS page that starts a new chat.");

    setting.addText((text) => {
      text
        .setPlaceholder("https://example.com/new")
        .setValue(this.plugin.settings.customUrl)
        .onChange(async (value) => {
          const trimmedValue = value.trim();
          if (!isValidCustomUrl(trimmedValue)) {
            setting.setDesc("Enter a valid HTTPS new-chat URL.");
            return;
          }

          this.plugin.settings.customUrl = trimmedValue;
          await this.plugin.saveSettings();
          setting.setDesc("Custom new-chat URL saved.");
        });
    });
  }
}
