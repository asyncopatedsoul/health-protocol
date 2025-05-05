export const TRANSACTION_FILTER_TYPES = {
  ALL: "all",
  INCOME: "income",
  EXPENSE: "expense",
} as const;

export type FilterType =
  (typeof TRANSACTION_FILTER_TYPES)[keyof typeof TRANSACTION_FILTER_TYPES];

export const TRANSACTION_FILTER_OPTIONS = [
  { label: "All", value: TRANSACTION_FILTER_TYPES.ALL },
  { label: "Income", value: TRANSACTION_FILTER_TYPES.INCOME },
  { label: "Expense", value: TRANSACTION_FILTER_TYPES.EXPENSE },
];

// If we didn't use as const, TypeScript would interpret it as string
// instead of 'all' | 'income' | 'expense'.

export const TRANSACTION_FILTER_PERIODS = {
  THIS_MONTH: "thisMonth",
  LAST_3_MONTHS: "last3Months",
  LAST_12_MONTHS: "last12Months",
  ALL: "all",
} as const;

export type PeriodFilter =
  (typeof TRANSACTION_FILTER_PERIODS)[keyof typeof TRANSACTION_FILTER_PERIODS];

export const TRANSACTION_PERIOD_OPTIONS = [
  { label: "This Month", value: TRANSACTION_FILTER_PERIODS.THIS_MONTH },
  { label: "Last 3 Months", value: TRANSACTION_FILTER_PERIODS.LAST_3_MONTHS },
  { label: "Last 12 Months", value: TRANSACTION_FILTER_PERIODS.LAST_12_MONTHS },
  { label: "All", value: TRANSACTION_FILTER_PERIODS.ALL },
];
