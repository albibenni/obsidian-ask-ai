import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  isValidCustomUrl,
  parseSettings,
} from "./settings-schema";

describe("parseSettings", () => {
  it("uses safe defaults when no settings have been saved", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("accepts a supported provider", () => {
    expect(parseSettings({ provider: "claude" })).toEqual({
      provider: "claude",
      customUrl: "",
    });
  });

  it("preserves custom provider selection while its URL is being configured", () => {
    expect(parseSettings({ provider: "custom", customUrl: "" })).toEqual({
      provider: "custom",
      customUrl: "",
    });
  });

  it("does not treat an empty custom URL as ready to open", () => {
    expect(isValidCustomUrl("")).toBe(false);
  });

  it.each(["javascript:alert(1)", "http://example.com/new", "not a url"])(
    "rejects an unsafe custom destination: %s",
    (customUrl) => {
      expect(parseSettings({ provider: "custom", customUrl })).toEqual(
        DEFAULT_SETTINGS,
      );
    },
  );

  it("accepts an HTTPS custom new-chat destination", () => {
    expect(
      parseSettings({
        provider: "custom",
        customUrl: "https://example.com/new",
      }),
    ).toEqual({
      provider: "custom",
      customUrl: "https://example.com/new",
    });
  });
});
