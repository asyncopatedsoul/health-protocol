//Step 1: Create a model for the transaction domain
export type TransactionType = "income" | "expense";
export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: Date | string;
  note: string;
}
