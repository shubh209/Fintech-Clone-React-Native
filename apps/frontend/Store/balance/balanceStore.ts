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
import {
    transactionRepository,
    TransactionRepository,
} from "@/utils/transactionRepository";

// This file defines a Zustand store for managing user transactions and balance in the app.
// - Hydrates and syncs transaction snapshots through the Cloudflare repository.
// - Uses Zustand's persist middleware with MMKV storage as a local cache/fallback.
// - The store provides:
//   - An array of transactions
//   - A method to add new transactions (runTransaction)
//   - A method to clear all transactions (clearTansactions)
//   - A method to calculate the balance (balance)
// This setup ensures that user transaction history and balance are reliably persisted across app sessions, providing a seamless and consistent user experience.

export type Transaction = PersistedTransaction;
export type BalanceSyncStatus = 'idle' | 'syncing' | 'synced' | 'fallback' | 'error';

let repository: TransactionRepository = transactionRepository;

export function setTransactionRepository(nextRepository: TransactionRepository) {
    repository = nextRepository;
}

export interface BalanceState{
    transactions:  Array<Transaction>;
    syncStatus: BalanceSyncStatus;
    hydrateTransactions: () => Promise<void>;
    runTransaction: (transaction: TransactionInput) => Promise<void>;
    updateTransactionCategory: (transactionId: string, category: string) => Promise<void>;
    balance: () => number;
    clearTansactions: () => Promise<void>;
}

async function syncTransactions(
    set: (partial: Partial<BalanceState>) => void,
    transactions: Transaction[]
) {
    set({ syncStatus: 'syncing' });

    try {
        const result = await repository.saveTransactions(transactions);
        set({
            transactions: result.transactions,
            syncStatus: result.source === 'cloud' ? 'synced' : 'fallback',
        });
    } catch {
        set({ syncStatus: 'fallback' });
    }
}

export const useBalanceStore = create<BalanceState>()(
    persist(
        (set, get) => ({
            transactions: [],
            syncStatus: 'idle',
            hydrateTransactions: async () => {
                set({ syncStatus: 'syncing' });

                try {
                    const result = await repository.loadTransactions();
                    set({
                        transactions: result.transactions,
                        syncStatus: result.source === 'cloud' ? 'synced' : 'fallback',
                    });
                } catch {
                    set({ syncStatus: 'fallback' });
                }
            },
            runTransaction: async (transaction: TransactionInput) => {
                let nextTransactions: Transaction[] = [];

                timeSync(
                    'home.transaction.add',
                    () => {
                        set((state) => ({
                            transactions: [
                                ...state.transactions,
                                normalizeTransaction(transaction),
                            ],
                        }));
                        nextTransactions = get().transactions;
                    },
                    {
                        amountDirection: transaction.amount >= 0 ? 'positive' : 'negative',
                    }
                );

                await syncTransactions(set, nextTransactions);
            },
            updateTransactionCategory: async (transactionId: string, category: string) => {
                let nextTransactions: Transaction[] = [];

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

                nextTransactions = get().transactions;
                await syncTransactions(set, nextTransactions);
            },
            balance: () => get().transactions.reduce((acc, transaction) => acc + transaction.amount, 0),
            clearTansactions: async () => {
                set({transactions: []});
                await syncTransactions(set, []);
            },
        }), 
        {
            name: 'balance',
            version: 1,
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                transactions: state.transactions,
            }),
            migrate: (persistedState) => {
                const state = persistedState as Partial<BalanceState>;

                return {
                    ...state,
                    transactions: normalizePersistedTransactions(state.transactions ?? []),
                    syncStatus: 'idle',
                };
            },
        }
    )
)
