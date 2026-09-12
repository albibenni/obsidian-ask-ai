import { z } from "zod";
import type { ChatProvider } from "./chat-plan";

export interface AskAiSettings {
  provider: ChatProvider;
  customUrl: string;
}

export const DEFAULT_SETTINGS: AskAiSettings = {
  provider: "chatgpt",
  customUrl: "",
};

const SettingsSchema = z.object({
  provider: z
    .enum(["chatgpt", "claude", "gemini", "custom"])
    .default(DEFAULT_SETTINGS.provider),
  customUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || isHttpsUrl(value), {
      message: "Enter a valid HTTPS new-chat URL",
    })
    .default(DEFAULT_SETTINGS.customUrl),
});

export function parseSettings(input: unknown): AskAiSettings {
  const result = SettingsSchema.safeParse(input ?? {});
  return result.success ? result.data : { ...DEFAULT_SETTINGS };
}

export function isValidCustomUrl(value: string): boolean {
  return value.trim() !== "" && isHttpsUrl(value);
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
