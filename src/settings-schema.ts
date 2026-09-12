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

const SettingsSchema = z
  .object({
    provider: z
      .enum(["chatgpt", "claude", "gemini", "custom"])
      .default(DEFAULT_SETTINGS.provider),
    customUrl: z.string().trim().default(DEFAULT_SETTINGS.customUrl),
  })
  .superRefine((settings, context) => {
    if (settings.provider !== "custom") {
      return;
    }

    try {
      const url = new URL(settings.customUrl);
      if (url.protocol !== "https:") {
        throw new Error("Custom AI chat URLs must use HTTPS");
      }
    } catch {
      context.addIssue({
        code: "custom",
        path: ["customUrl"],
        message: "Enter a valid HTTPS new-chat URL",
      });
    }
  });

export function parseSettings(input: unknown): AskAiSettings {
  const result = SettingsSchema.safeParse(input ?? {});
  return result.success ? result.data : { ...DEFAULT_SETTINGS };
}

export function isValidCustomUrl(value: string): boolean {
  return SettingsSchema.safeParse({
    provider: "custom",
    customUrl: value,
  }).success;
}
