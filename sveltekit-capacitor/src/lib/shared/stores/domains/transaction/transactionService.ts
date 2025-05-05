// Step 2: This file contains the logic for filtering transactions and calculating totals

import { PeriodFilter } from "./transactionConstants";
import { Transaction } from "./transactionModel";

export function filterTransactions(
  transactions: Transaction[],
  type: "all" | "income" | "expense",
  period: PeriodFilter
) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "thisMonth":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last3Months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    case "last12Months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      break;
    case "all":
    default:
      startDate = new Date(0);
      break;
  }

  return transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    const matchesType = type === "all" || tx.type === type;
    const matchesPeriod = txDate >= startDate;
    return matchesType && matchesPeriod;
  });
}

export const calculateTotals = (transactions: Transaction[]) => {
  const income = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = income - expense;
  return {
    income,
    expense,
    balance,
  };
};
