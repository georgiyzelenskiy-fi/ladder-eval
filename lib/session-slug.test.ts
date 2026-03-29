import { describe, expect, it } from "vitest";
import { normalizeSessionSlug } from "./session-slug";

describe("normalizeSessionSlug", () => {
  it("trims and lowercases", () => {
    expect(normalizeSessionSlug("  Team-Alpha  ")).toBe("team-alpha");
  });

  it("accepts default", () => {
    expect(normalizeSessionSlug("default")).toBe("default");
  });

  it("rejects empty", () => {
    expect(() => normalizeSessionSlug("")).toThrow(/required/);
    expect(() => normalizeSessionSlug("   ")).toThrow(/required/);
  });

  it("rejects invalid characters", () => {
    expect(() => normalizeSessionSlug("team_1")).toThrow();
    expect(() => normalizeSessionSlug("a b")).toThrow();
    expect(() => normalizeSessionSlug("-a")).toThrow();
    expect(() => normalizeSessionSlug("a-")).toThrow();
  });
});
