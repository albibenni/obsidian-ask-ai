import type {
  App,
  Command,
  Editor,
  MarkdownFileInfo,
  PluginManifest,
} from "obsidian";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  commands: [] as unknown[],
  notices: [] as string[],
  loadedData: null as unknown,
}));

vi.mock("obsidian", () => ({
  Notice: class {
    constructor(message: string) {
      testState.notices.push(message);
    }
  },
  Plugin: class {
    app: unknown;

    constructor(app: unknown) {
      this.app = app;
    }

    addCommand(command: unknown): void {
      testState.commands.push(command);
    }

    addSettingTab(): void {}

    async loadData(): Promise<unknown> {
      return testState.loadedData;
    }

    async saveData(): Promise<void> {}
  },
  PluginSettingTab: class {},
  Setting: class {},
}));

import AskAiPlugin from "./main";

describe("AskAiPlugin commands", () => {
  beforeEach(() => {
    testState.commands.length = 0;
    testState.notices.length = 0;
    testState.loadedData = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses the editor callback file with its selected text", async () => {
    const open = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("window", { open });
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await loadPlugin({
      workspace: {
        getActiveFile: () => ({ name: "Different-pane.md" }),
      },
      vault: { cachedRead: vi.fn() },
    });
    const command = findCommand("open-selection-in-ai-chat");

    command.editorCallback?.(
      { getSelection: () => "Focused selection" } as Editor,
      { file: { name: "Focused-pane.md" } } as MarkdownFileInfo,
    );

    await vi.waitFor(() => expect(open).toHaveBeenCalledOnce());
    const openedUrl = String(open.mock.calls[0]?.[0]);
    expect(decodeURIComponent(openedUrl)).toContain("File: Focused-pane.md");
    expect(decodeURIComponent(openedUrl)).toContain("Focused selection");
  });

  it("puts the active selection in Request after the complete note", async () => {
    const open = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const file = { name: "Ideas.md" };
    vi.stubGlobal("window", { open });
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await loadPlugin({
      workspace: {
        getActiveFile: () => file,
      },
      vault: { cachedRead: vi.fn().mockResolvedValue("Complete note") },
    });

    findCommand("open-entire-note-in-ai-chat").editorCallback?.(
      { getSelection: () => "Focused passage" } as Editor,
      { file } as MarkdownFileInfo,
    );

    await vi.waitFor(() => expect(open).toHaveBeenCalledOnce());
    const openedUrl = decodeURIComponent(String(open.mock.calls[0]?.[0]));
    expect(openedUrl).toContain(
      "Context:\nComplete note\n\nRequest:\nFocused passage\n\n",
    );
  });

  it("warns when a note is too large and confirms the clipboard fallback", async () => {
    const open = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const file = { name: "Large.md" };
    vi.stubGlobal("window", { open });
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await loadPlugin({
      workspace: { getActiveFile: () => file },
      vault: { cachedRead: vi.fn().mockResolvedValue("x".repeat(6_001)) },
    });

    findCommand("open-entire-note-in-ai-chat").editorCallback?.(
      { getSelection: () => "Focused passage" } as Editor,
      { file } as MarkdownFileInfo,
    );

    await vi.waitFor(() => expect(open).toHaveBeenCalledOnce());
    expect(testState.notices).toContain(
      "This note is too large for automatic insertion. The full note and selected text will be copied; paste them manually in ChatGPT.",
    );
    expect(testState.notices).toContain(
      "Full note and selected text copied. Paste them into ChatGPT, add your question, then send.",
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("Request:\nFocused passage\n\n"),
    );
  });

  it("reports a vault read failure instead of rejecting silently", async () => {
    vi.stubGlobal("window", { open: vi.fn() });
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await loadPlugin({
      workspace: { getActiveFile: () => ({ name: "Unreadable.md" }) },
      vault: {
        cachedRead: vi.fn().mockRejectedValue(new Error("Read failed")),
      },
    });

    findCommand("open-entire-note-in-ai-chat").editorCallback?.(
      { getSelection: () => "Focused passage" } as Editor,
      { file: { name: "Unreadable.md" } } as MarkdownFileInfo,
    );

    await vi.waitFor(() =>
      expect(testState.notices).toContain(
        "Ask AI could not prepare the chat. Check the developer console for details.",
      ),
    );
  });
});

async function loadPlugin(app: object): Promise<AskAiPlugin> {
  const plugin = new AskAiPlugin(
    app as App,
    { id: "ask-ai" } as PluginManifest,
  );
  await plugin.onload();
  return plugin;
}

function findCommand(id: string): Command {
  const command = testState.commands.find(
    (candidate) => (candidate as Command).id === id,
  ) as Command | undefined;
  if (!command) {
    throw new Error(`Command not registered: ${id}`);
  }
  return command;
}
