import { create } from 'zustand';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import uuid from 'react-native-uuid';
import { changeLanguage } from '../i18n';

export type TransactionType = 'expense' | 'income';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank' | 'paypal' | 'wise' | 'stripe';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  via: PaymentMethod;
  note: string;
  date: string; // ISO string
  createdAt: number;
}

interface AppState {
  transactions: Transaction[];
  theme: 'light' | 'dark';
  language: 'en' | 'bn';
  expenseLimit: number;
  isLoaded: boolean;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteTransaction: (id: string) => void;
  importTransactions: (transactions: Transaction[]) => void;
  loadInitialData: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'bn') => void;
  setExpenseLimit: (limit: number) => void;
}

const THEME_KEY = '@cashdrift_theme';
const LANG_KEY = '@language_pref';
const LIMIT_KEY = '@cashdrift_expense_limit';

let db: SQLite.SQLiteDatabase | null = null;

const initDB = async () => {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('cashdrift_db_v1');
      // Split statements to avoid potential multi-statement parsing issues on some Android versions
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          via TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL,
          createdAt INTEGER NOT NULL
        );
      `);
    }
    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  theme: 'dark', // default dark as per request
  language: 'en',
  expenseLimit: 0,
  isLoaded: false,

  loadInitialData: async () => {
    try {
      const database = await initDB();
      const allRows = await database.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY createdAt DESC');
      
      const savedTheme = await AsyncStorage.getItem(THEME_KEY) as 'light' | 'dark';
      const savedLang = await AsyncStorage.getItem(LANG_KEY) as 'en' | 'bn';
      const savedLimit = await AsyncStorage.getItem(LIMIT_KEY);

      if (savedLang) {
        changeLanguage(savedLang);
      }

      set({
        transactions: allRows || [],
        theme: savedTheme || 'dark', // fallback to dark
        language: savedLang || 'en',
        expenseLimit: savedLimit ? parseFloat(savedLimit) : 0,
        isLoaded: true
      });
    } catch (e) {
      console.error(e);
      set({ isLoaded: true });
    }
  },

  addTransaction: async (t) => {
    try {
      const database = await initDB();
      if (!database) throw new Error("Database not initialized");

      const id = t.id || uuid.v4().toString();
      const createdAt = Date.now();
      const amount = Number(t.amount) || 0;

      await database.runAsync(
        'INSERT INTO transactions (id, type, amount, via, note, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          t.type || 'expense',
          amount,
          t.via || 'cash',
          t.note || '',
          t.date || new Date().toISOString(),
          createdAt
        ]
      );
      
      const newTransaction: Transaction = {
        ...t,
        id,
        amount,
        createdAt
      };

      const updated = [newTransaction, ...get().transactions];
      set({ transactions: updated.sort((a,b) => b.createdAt - a.createdAt) });
    } catch(e) {
      console.error("Failed to insert transaction:", e);
      Alert.alert("Store Error", "Failed to save transaction. Please try again.");
    }
  },

  deleteTransaction: async (id) => {
    try {
      const database = await initDB();
      await database.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
      
      const updated = get().transactions.filter(t => t.id !== id);
      set({ transactions: updated });
    } catch(e) {
      console.error("Failed to delete transaction", e);
    }
  },

  importTransactions: async (newTransactions) => {
    try {
      const database = await initDB();
      const existing = get().transactions;
      const existingIds = new Set(existing.map(t => t.id));
      const toAdd = newTransactions.filter(t => !existingIds.has(t.id));

      if (toAdd.length === 0) return;

      // Wrap in a transaction for bulk insert
      await database.withTransactionAsync(async () => {
        for (const tx of toAdd) {
          await database.runAsync(
            'INSERT INTO transactions (id, type, amount, via, note, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              tx.id || uuid.v4().toString(),
              tx.type || 'expense',
              tx.amount || 0,
              tx.via || 'cash',
              tx.note || '',
              tx.date || new Date().toISOString(),
              tx.createdAt || Date.now()
            ]
          );
        }
      });

      const updated = [...toAdd, ...existing].sort((a,b) => b.createdAt - a.createdAt);
      set({ transactions: updated });
    } catch(e) {
      console.error("Failed to import transactions", e);
    }
  },

  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem(THEME_KEY, theme);
  },

  setLanguage: async (lang) => {
    set({ language: lang });
    await changeLanguage(lang);
  },

  setExpenseLimit: async (limit) => {
    set({ expenseLimit: limit });
    await AsyncStorage.setItem(LIMIT_KEY, limit.toString());
  }
}));
