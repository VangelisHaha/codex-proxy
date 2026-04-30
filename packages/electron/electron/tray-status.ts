interface TrayAccountQuotaWindow {
  used_percent?: number | null;
}

interface TrayAccountQuota {
  rate_limit?: TrayAccountQuotaWindow | null;
  secondary_rate_limit?: TrayAccountQuotaWindow | null;
}

export interface TrayAccountSummaryInput {
  status?: string | null;
  quota?: TrayAccountQuota | null;
}

export interface TrayAccountSummary {
  activeCount: number;
  totalCount: number;
  primaryRemainingPct: number | null;
  weeklyRemainingPct: number | null;
  title: string;
}

const DEFAULT_TITLE = "0/0 5h -- 周 --";

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function remainingFromUsedPercent(usedPercent: unknown): number {
  if (typeof usedPercent !== "number" || !Number.isFinite(usedPercent)) {
    return 100;
  }
  return 100 - clampPercent(usedPercent);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function formatRemaining(value: number | null): string {
  return value == null ? "--" : `${value}%`;
}

export function summarizeTrayAccounts(accounts: TrayAccountSummaryInput[]): TrayAccountSummary {
  const totalCount = accounts.length;
  const activeAccounts = accounts.filter((account) => account.status === "active");
  const activeCount = activeAccounts.length;

  if (totalCount === 0) {
    return {
      activeCount: 0,
      totalCount: 0,
      primaryRemainingPct: null,
      weeklyRemainingPct: null,
      title: DEFAULT_TITLE,
    };
  }

  const primaryRemainingPct = average(
    activeAccounts.map((account) =>
      remainingFromUsedPercent(account.quota?.rate_limit?.used_percent),
    ),
  );
  const weeklyRemainingPct = average(
    activeAccounts.map((account) =>
      remainingFromUsedPercent(account.quota?.secondary_rate_limit?.used_percent),
    ),
  );

  const title = `${activeCount}/${totalCount} 5h ${formatRemaining(primaryRemainingPct)} 周 ${formatRemaining(weeklyRemainingPct)}`;

  return {
    activeCount,
    totalCount,
    primaryRemainingPct,
    weeklyRemainingPct,
    title,
  };
}

export function buildTrayAccountTooltip(summary: TrayAccountSummary, updatedAt = new Date()): string {
  const time = updatedAt.toLocaleTimeString("zh-CN", { hour12: false });
  return [
    "Codex Proxy",
    `账户：${summary.activeCount}/${summary.totalCount} 活跃`,
    `5h 平均剩余：${formatRemaining(summary.primaryRemainingPct)}`,
    `周平均剩余：${formatRemaining(summary.weeklyRemainingPct)}`,
    `更新：${time}`,
  ].join("\n");
}
