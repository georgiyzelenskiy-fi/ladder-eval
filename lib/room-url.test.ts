import { describe, expect, it } from "vitest";
import {
  buildEvalHref,
  buildInsightsHref,
  buildRoomHref,
} from "./room-url";

describe("buildRoomHref", () => {
  it("omits query for default session without manager key", () => {
    expect(buildRoomHref("/room/driver", "default")).toBe("/room/driver");
  });

  it("adds session when not default", () => {
    expect(buildRoomHref("/room/driver", "team-alpha")).toBe(
      "/room/driver?session=team-alpha",
    );
  });

  it("combines session and manager key", () => {
    expect(buildRoomHref("/room/live-evaluation", "x", "secret")).toBe(
      "/room/live-evaluation?session=x&k=secret",
    );
  });

  it("only k for default session", () => {
    expect(buildRoomHref("/room/driver", "default", "k1")).toBe(
      "/room/driver?k=k1",
    );
  });
});

describe("buildInsightsHref", () => {
  it("omits query for default session", () => {
    expect(buildInsightsHref("alice", "default")).toBe("/insights/alice");
  });

  it("adds session when not default", () => {
    expect(buildInsightsHref("bob", "round-2")).toBe(
      "/insights/bob?session=round-2",
    );
  });
});

describe("buildEvalHref", () => {
  it("adds session param for non-default", () => {
    expect(buildEvalHref("dev-1", "team-x")).toBe("/eval/dev-1?session=team-x");
  });
});
