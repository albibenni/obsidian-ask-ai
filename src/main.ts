import { type Editor, Notice, Plugin } from "obsidian";
import { buildChatPlan, type ContextSource } from "./chat-plan";
import { openChat } from "./open-chat";
import { AskAiSettingTab } from "./settings";
import {
  type AskAiSettings,
  DEFAULT_SETTINGS,
  isValidCustomUrl,
  parseSettings,
} from "./settings-schema";

export default class AskAiPlugin extends Plugin {
  settings: AskAiSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    this.settings = parseSettings(await this.loadData());
    this.addSettingTab(new AskAiSettingTab(this.app, this));

    this.addCommand({
      id: "open-selection-in-ai-chat",
      name: "Open selection in AI chat",
      editorCallback: (editor: Editor) => {
        const fileName =
          this.app.workspace.getActiveFile()?.name ?? "Untitled.md";
        void this.openContext("selection", fileName, editor.getSelection());
      },
    });

    this.addCommand({
      id: "open-entire-note-in-ai-chat",
      name: "Open entire note in AI chat",
      callback: () => void this.openEntireNote(),
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async openEntireNote(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      await this.openContext("note", "Untitled.md", "");
      return;
    }

    const context = await this.app.vault.cachedRead(file);
    await this.openContext("note", file.name, context);
  }

  private async openContext(
    source: ContextSource,
    fileName: string,
    context: string,
  ): Promise<void> {
    const settings = this.validRuntimeSettings();
    const plan = buildChatPlan({
      provider: settings.provider,
      customUrl: settings.customUrl,
      source,
      fileName,
      context,
    });

    const result = await openChat(plan, {
      openUrl: (url) => {
        window.open(url);
      },
      copyText: (text) => navigator.clipboard.writeText(text),
    });

    const providerName = providerDisplayName(settings.provider);
    if (!result.clipboardCopied) {
      new Notice(
        `Opened a new ${providerName} chat, but clipboard access failed.`,
      );
      return;
    }

    if (plan.prefilled) {
      new Notice(
        `Opened a new ${providerName} chat with context prefilled. ` +
          "A clipboard fallback is ready.",
      );
      return;
    }

    new Notice(
      `Opened a new ${providerName} chat. Paste the copied context, add your ` +
        "request, then send.",
    );
  }

  private validRuntimeSettings(): AskAiSettings {
    if (
      this.settings.provider === "custom" &&
      !isValidCustomUrl(this.settings.customUrl)
    ) {
      new Notice(
        "The custom chat URL is invalid. Opened ChatGPT as a safe fallback.",
      );
      return { ...DEFAULT_SETTINGS };
    }
    return this.settings;
  }
}

function providerDisplayName(provider: AskAiSettings["provider"]): string {
  switch (provider) {
    case "chatgpt":
      return "ChatGPT";
    case "claude":
      return "Claude";
    case "gemini":
      return "Gemini";
    case "custom":
      return "AI";
  }
}
