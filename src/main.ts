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
      editorCallback: (editor: Editor, context) => {
        const fileName = context.file?.name ?? "Untitled.md";
        this.runSafely(() =>
          this.openContext("selection", fileName, editor.getSelection()),
        );
      },
    });

    this.addCommand({
      id: "open-entire-note-in-ai-chat",
      name: "Open entire note in AI chat",
      callback: () => this.runSafely(() => this.openEntireNote()),
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async openEntireNote(): Promise<void> {
    const activeEditor = this.app.workspace.activeEditor;
    const file = activeEditor?.file ?? this.app.workspace.getActiveFile();
    const selectedText = activeEditor?.editor?.getSelection() ?? "";
    if (!file) {
      await this.openContext("note", "Untitled.md", "", selectedText);
      return;
    }

    const context = await this.app.vault.cachedRead(file);
    await this.openContext("note", file.name, context, selectedText);
  }

  private async openContext(
    source: ContextSource,
    fileName: string,
    context: string,
    requestContext = "",
  ): Promise<void> {
    const settings = this.validRuntimeSettings();
    const plan = buildChatPlan({
      provider: settings.provider,
      customUrl: settings.customUrl,
      source,
      fileName,
      context,
      requestContext,
    });

    const result = await openChat(plan, {
      openUrl: (url) => {
        window.open(url, "_blank", "noopener,noreferrer");
      },
      copyText: (text) => navigator.clipboard.writeText(text),
    });

    const providerName = providerDisplayName(settings.provider);
    if (!result.browserOpened) {
      new Notice(
        result.clipboardCopied
          ? `Could not open ${providerName}. The context was copied.`
          : `Could not open ${providerName}, and clipboard access failed.`,
      );
      return;
    }

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
        "The custom chat URL is invalid. Using ChatGPT as a safe fallback.",
      );
      return { ...DEFAULT_SETTINGS };
    }
    return this.settings;
  }

  private runSafely(operation: () => Promise<void>): void {
    void operation().catch((error: unknown) => {
      console.error("Ask AI failed to prepare the chat:", error);
      new Notice(
        "Ask AI could not prepare the chat. " +
          "Check the developer console for details.",
      );
    });
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
