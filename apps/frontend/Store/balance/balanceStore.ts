import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "../storage/mmkv-storage";
import {
    normalizeTransaction,
    normalizePersistedTransactions,
    normalizeTransactionCategory,
    PersistedTransaction,
    TransactionInput,
} from "./transactionUtils";
import { timeSync } from "@/utils/metrics";

// This file defines a Zustand store for managing user transactions and balance in the app.
// - Uses Zustand's persist middleware with MMKV storage to ensure all transaction data is saved to device storage and restored on app restart.
// - The store provides:
//   - An array of transactions
//   - A method to add new transactions (runTransaction)
//   - A method to clear all transactions (clearTansactions)
//   - A method to calculate the balance (balance)
// This setup ensures that user transaction history and balance are reliably persisted across app sessions, providing a seamless and consistent user experience.

export type Transaction = PersistedTransaction;

export interface BalanceState{
    transactions:  Array<Transaction>;
    runTransaction: (transaction: TransactionInput) => void;
    updateTransactionCategory: (transactionId: string, category: string) => void;
    balance: () => number;
    clearTansactions: () => void;
}

export const useBalanceStore = create<BalanceState>()(
    persist(
        (set, get) => ({
            transactions: [],
            runTransaction: (transaction: TransactionInput) => {
                timeSync(
                    'home.transaction.add',
                    () => {
                        set((state) => ({
                            transactions: [...state.transactions, normalizeTransaction(transaction)],
                        }));
                    },
                    {
                        amountDirection: transaction.amount >= 0 ? 'positive' : 'negative',
                    }
                );
            },
            updateTransactionCategory: (transactionId: string, category: string) => {
                set((state) => ({
                    transactions: state.transactions.map((transaction) =>
                        transaction.id === transactionId
                            ? {
                                ...transaction,
                                category: normalizeTransactionCategory(category),
                            }
                            : transaction
                    ),
                }));
            },
            balance: () => get().transactions.reduce((acc, transaction) => acc + transaction.amount, 0),
            clearTansactions: () => {
                set({transactions: []});
            },
        }), 
        {
            name: 'balance',
            version: 1,
            storage: createJSONStorage(() => zustandStorage),
            migrate: (persistedState) => {
                const state = persistedState as Partial<BalanceState>;

                return {
                    ...state,
                    transactions: normalizePersistedTransactions(state.transactions ?? []),
                };
            },
        }
    )
)
