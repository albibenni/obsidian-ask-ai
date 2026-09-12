# Ask AI

Ask AI is a mobile- and desktop-compatible Obsidian plugin that opens note
context in a new consumer AI chat. It uses the chat websites you already use;
it does not require an API key or developer subscription.

## Commands

- **Open selection in AI chat** includes the active filename and selected text.
- **Open entire note in AI chat** includes the active filename and full Markdown
  content.

The draft always ends with `Request:`. Complete the request in the AI chat,
review it, and send it yourself. Ask AI never submits a message automatically.

## Providers and transfer behavior

Choose ChatGPT, Claude, Gemini, or a custom HTTPS new-chat URL in the plugin
settings.

- ChatGPT and Claude receive selections of up to 6,000 characters through an
  unsent URL-prefilled draft. The same draft is copied as a fallback.
- Gemini and custom chat sites use the clipboard because they do not offer a
  reliable external prefill contract.
- Longer selections and entire notes always use the clipboard, keeping large or
  sensitive note content out of browser history URLs.

Every command opens a new chat page in the system browser. For clipboard-only
transfers, paste the draft into the new chat before editing the `Request:` field.
Whole notes are transferred as Markdown text rather than automatic attachments,
which consumer chat sites do not expose reliably across desktop and mobile.

## Development

Requires Node.js 24 or newer and pnpm.

```sh
pnpm install
pnpm check
```

The project follows the validation and strictness conventions used by
`Todoist-Plug`: Zod validation at persisted-input boundaries, strict TypeScript,
Biome, Vitest, and an esbuild CommonJS bundle for Obsidian.
