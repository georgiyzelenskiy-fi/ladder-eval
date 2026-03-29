import { describe, expect, it } from "vitest";
import { buildRoomHref } from "./room-url";

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
