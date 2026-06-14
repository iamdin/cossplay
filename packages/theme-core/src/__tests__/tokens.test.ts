import { describe, it, expect } from "vitest";
import { groupTokens, COLOR_TOKENS, TOKEN_GROUPS } from "../tokens";

describe("groupTokens", () => {
  it("places known tokens into their group", () => {
    const groups = groupTokens(["primary", "sidebar-ring", "chart-2"]);
    const byId = Object.fromEntries(groups.map((g) => [g.id, g.tokens]));
    expect(byId["primary"]).toContain("primary");
    expect(byId["sidebar"]).toContain("sidebar-ring");
    expect(byId["chart"]).toContain("chart-2");
  });

  it("puts unknown tokens into the 'other' group", () => {
    const groups = groupTokens(["xyz-unknown"]);
    const other = groups.find((g) => g.id === "other");
    expect(other?.tokens).toEqual(["xyz-unknown"]);
  });

  it("omits empty groups and keeps group order stable", () => {
    const groups = groupTokens(["primary", "background"]);
    expect(groups.map((g) => g.id)).toEqual(["base", "primary"]);
  });

  it("COLOR_TOKENS contains coss extras", () => {
    for (const t of ["info", "success", "warning", "code", "code-highlight"]) {
      expect(COLOR_TOKENS.has(t)).toBe(true);
    }
    expect(TOKEN_GROUPS.length).toBeGreaterThan(0);
  });
});
