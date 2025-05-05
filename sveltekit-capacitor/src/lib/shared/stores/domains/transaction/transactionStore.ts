// import { create } from "zustand";
import { createStore } from "zustand/vanilla";

import {
  PeriodFilter,
  TRANSACTION_FILTER_PERIODS,
} from "./transactionConstants";
import { dummyTransactions } from "./transactionDummy";
import { Transaction } from "./transactionModel";

type filterType = "all" | Transaction["type"];

interface TransactionState {
  transactions: Transaction[];
  filterType: filterType;
  period: PeriodFilter;
}
interface TransactionActions {
  setFilterType: (type: filterType) => void;
  setPeriodFilter: (period: PeriodFilter) => void;
  addTransaction: (transaction: Transaction) => void;
  reset: () => void;
}

const initialState: TransactionState = {
  transactions: dummyTransactions,
  filterType: "all",
  period: TRANSACTION_FILTER_PERIODS.THIS_MONTH,
};

export const createTransactionStore = () =>
  // create<TransactionState & TransactionActions>((set) => ({
  createStore<TransactionState & TransactionActions>((set) => ({
    ...initialState,
    setFilterType: (type) => set({ filterType: type }),
    setPeriodFilter: (period) => set({ period }),
    addTransaction: (tx) =>
      set((state) => ({
        transactions: [tx, ...state.transactions],
      })),
    reset: () => set(initialState),
  }));

 export const transactionStoreSchema = (set) => ({
  ...initialState,
  setFilterType: (type) => set({ filterType: type }),
  setPeriodFilter: (period) => set({ period }),
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions],
    })),
  reset: () => set(initialState),
})

export const useTransactionStore = createTransactionStore();
