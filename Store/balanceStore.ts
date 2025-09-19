import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "./mmkv-storage";

// This file defines a Zustand store for managing user transactions and balance in the app.
// - Uses Zustand's persist middleware with MMKV storage to ensure all transaction data is saved to device storage and restored on app restart.
// - The store provides:
//   - An array of transactions
//   - A method to add new transactions (runTransaction)
//   - A method to clear all transactions (clearTansactions)
//   - A method to calculate the balance (balance)
// This setup ensures that user transaction history and balance are reliably persisted across app sessions, providing a seamless and consistent user experience.

export interface Transaction {
    id: string,
    amount: number,
    date: Date,
    title: string,
}

export interface BalanceState{
    transactions:  Array<Transaction>;
    runTransaction: (transaction: Transaction) => void;
    balance: () => number;
    clearTansactions: () => void;
}

export const useBalanceStore = create<BalanceState>()(
    persist(
        (set, get) => ({
            transactions: [],
            runTransaction: (transaction: Transaction) => {
                set((state) => ({ transactions: [...state.transactions, transaction] }));
            },
            balance: () => get().transactions.reduce((acc, transaction) => acc + transaction.amount, 0),
            clearTansactions: () => {
                set({transactions: []});
            },
        }), 
        {
            name: 'balance',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)