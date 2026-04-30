import { describe, expect, it } from "vitest";
import {
  buildTrayAccountTooltip,
  summarizeTrayAccounts,
  type TrayAccountSummaryInput,
} from "../electron/tray-status.js";

function account(
  status: string,
  primaryUsed?: number | null,
  weeklyUsed?: number | null,
): TrayAccountSummaryInput {
  return {
    status,
    quota: {
      rate_limit: { used_percent: primaryUsed },
      secondary_rate_limit: { used_percent: weeklyUsed },
    },
  };
}

describe("tray account status summary", () => {
  it("formats active account count over total account count", () => {
    const summary = summarizeTrayAccounts([
      account("active", 20, 40),
      account("disabled", 0, 0),
      account("expired", 0, 0),
    ]);

    expect(summary.activeCount).toBe(1);
    expect(summary.totalCount).toBe(3);
    expect(summary.title).toBe("1/3 5h 80% 周 60%");
  });

  it("averages remaining quota across active accounts", () => {
    const summary = summarizeTrayAccounts([
      account("active", 20, 40),
      account("active", 60, 80),
      account("disabled", 100, 100),
    ]);

    expect(summary.primaryRemainingPct).toBe(60);
    expect(summary.weeklyRemainingPct).toBe(40);
    expect(summary.title).toBe("2/3 5h 60% 周 40%");
  });

  it("treats missing quota on active accounts as fully available", () => {
    const summary = summarizeTrayAccounts([
      account("active", 50, 50),
      { status: "active" },
    ]);

    expect(summary.primaryRemainingPct).toBe(75);
    expect(summary.weeklyRemainingPct).toBe(75);
    expect(summary.title).toBe("2/2 5h 75% 周 75%");
  });

  it("excludes inactive accounts from quota averages but includes them in total", () => {
    const summary = summarizeTrayAccounts([
      account("active", 25, 25),
      account("quota_exhausted", 100, 100),
      account("banned", 0, 0),
    ]);

    expect(summary.activeCount).toBe(1);
    expect(summary.totalCount).toBe(3);
    expect(summary.primaryRemainingPct).toBe(75);
    expect(summary.weeklyRemainingPct).toBe(75);
  });

  it("clamps out-of-range used_percent values", () => {
    const summary = summarizeTrayAccounts([
      account("active", -20, 140),
      account("active", null, Number.NaN),
    ]);

    expect(summary.primaryRemainingPct).toBe(100);
    expect(summary.weeklyRemainingPct).toBe(50);
    expect(summary.title).toBe("2/2 5h 100% 周 50%");
  });

  it("shows empty fallback title when there are no accounts", () => {
    const summary = summarizeTrayAccounts([]);

    expect(summary.activeCount).toBe(0);
    expect(summary.totalCount).toBe(0);
    expect(summary.primaryRemainingPct).toBeNull();
    expect(summary.weeklyRemainingPct).toBeNull();
    expect(summary.title).toBe("0/0 5h -- 周 --");
  });

  it("shows unknown quota when there are no active accounts", () => {
    const summary = summarizeTrayAccounts([
      account("disabled", 0, 0),
      account("expired", 0, 0),
    ]);

    expect(summary.title).toBe("0/2 5h -- 周 --");
  });

  it("builds a tooltip with account and quota details", () => {
    const summary = summarizeTrayAccounts([account("active", 20, 40)]);
    const tooltip = buildTrayAccountTooltip(summary, new Date("2026-04-30T10:20:30+08:00"));

    expect(tooltip).toContain("Codex Proxy");
    expect(tooltip).toContain("账户：1/1 活跃");
    expect(tooltip).toContain("5h 平均剩余：80%");
    expect(tooltip).toContain("周平均剩余：60%");
  });
});
