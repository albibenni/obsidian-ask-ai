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

- ChatGPT and Claude receive short selections through an unsent URL-prefilled
  draft when the resulting encoded prompt is no longer than 6,000 URL
  characters. The same draft is copied as a fallback.
- Gemini and custom chat sites use the clipboard because they do not offer a
  reliable external prefill contract.
- Longer selections and entire notes always use the clipboard, keeping large or
  sensitive note content out of browser history URLs.

URL-prefilled text is transmitted to ChatGPT or Claude as soon as the browser
opens, before you press Send, and may remain in browser or synchronized history.
Use the clipboard-only providers for sensitive selections.

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

## Releasing and updates

The release command follows `Todoist-Plug` and accepts `patch` by default:

```sh
pnpm release
pnpm release minor
pnpm release major
```

It runs all checks, updates `package.json`, synchronizes `manifest.json` and
`versions.json`, creates a version commit and tag, and pushes both. The tag
triggers the GitHub release workflow, which builds and publishes `main.js` and
`manifest.json` for Obsidian updates.

The repository must have a clean committed worktree and a configured Git remote
before running a release. Publishing the repository as an Obsidian community
plugin is a separate registration step.
