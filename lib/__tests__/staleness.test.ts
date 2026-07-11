import { describe, expect, test } from "bun:test";
import { classifyStaleness } from "@/lib/staleness";

const NOW = new Date("2026-07-11T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe("classifyStaleness", () => {
  test("same-day snapshot is fresh/today", () => {
    const s = classifyStaleness(NOW, NOW);
    expect(s).toEqual({ level: "fresh", days: 0, label: "today" });
  });

  test("yesterday and recent days are fresh", () => {
    expect(classifyStaleness(daysAgo(1), NOW).label).toBe("yesterday");
    expect(classifyStaleness(daysAgo(5), NOW)).toEqual({
      level: "fresh",
      days: 5,
      label: "5 days ago",
    });
  });

  test("14+ days is aging, 30+ is stale", () => {
    expect(classifyStaleness(daysAgo(13), NOW).level).toBe("fresh");
    expect(classifyStaleness(daysAgo(14), NOW).level).toBe("aging");
    expect(classifyStaleness(daysAgo(29), NOW).level).toBe("aging");
    expect(classifyStaleness(daysAgo(30), NOW).level).toBe("stale");
  });

  test("labels switch to weeks then months", () => {
    expect(classifyStaleness(daysAgo(21), NOW).label).toBe("3 weeks ago");
    expect(classifyStaleness(daysAgo(90), NOW).label).toBe("3 months ago");
  });

  test("accepts ISO strings and clamps future dates to zero", () => {
    expect(classifyStaleness(daysAgo(2).toISOString(), NOW).days).toBe(2);
    expect(classifyStaleness(daysAgo(-3), NOW).days).toBe(0);
  });
});
