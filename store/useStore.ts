import { create } from 'zustand';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import uuid from 'react-native-uuid';
import { changeLanguage } from '../i18n';

export type TransactionType = 'expense' | 'income';

export interface PaymentMethodItem {
  id: string;
  name: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  via: string; // Changed from enum to string for dynamic methods
  note: string;
  date: string; // ISO string
  createdAt: number;
}

interface AppState {
  transactions: Transaction[];
  paymentMethods: PaymentMethodItem[];
  theme: 'light' | 'dark';
  language: 'en' | 'bn';
  expenseLimit: number;
  isLoaded: boolean;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => void;
  importTransactions: (transactions: Transaction[]) => void;
  loadInitialData: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'bn') => void;
  setExpenseLimit: (limit: number) => void;
  addPaymentMethod: (name: string) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
}

const THEME_KEY = '@cashdrift_theme';
const LANG_KEY = '@language_pref';
const LIMIT_KEY = '@cashdrift_expense_limit';

let db: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

const initDB = async () => {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('cashdrift_db_v1');
    }

    if (db && !isInitialized) {
      // Split into separate calls to prevent Android NullPointerException on multi-statement strings
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA synchronous = NORMAL;');
      
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

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          createdAt INTEGER NOT NULL
        );
      `);

      // Seed default payment methods if empty
      const methods = await db.getAllAsync<PaymentMethodItem>('SELECT * FROM payment_methods');
      const defaults = ['Cash', 'Card', 'Bank', 'Bkash', 'Nagad', 'Rocket', 'Paypal', 'Stripe', 'Wise'];
      
      if (!methods || methods.length === 0) {
        for (const name of defaults) {
          await db.runAsync(
            'INSERT INTO payment_methods (id, name, createdAt) VALUES (?, ?, ?)',
            [uuid.v4().toString(), name, Date.now()]
          );
        }
      } else {
        // Add missing standard defaults if they don't exist
        for (const name of defaults) {
          if (!methods.find(m => m.name.toLowerCase() === name.toLowerCase())) {
            await db.runAsync(
              'INSERT INTO payment_methods (id, name, createdAt) VALUES (?, ?, ?)',
              [uuid.v4().toString(), name, Date.now()]
            );
          }
        }
      }
      isInitialized = true;
    }
    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  paymentMethods: [],
  theme: 'dark', 
  language: 'en',
  expenseLimit: 0,
  isLoaded: false,

  loadInitialData: async () => {
    try {
      const database = await initDB();
      const allRows = await database.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY createdAt DESC');
      const allMethods = await database.getAllAsync<PaymentMethodItem>('SELECT * FROM payment_methods ORDER BY createdAt ASC');
      
      const savedTheme = await AsyncStorage.getItem(THEME_KEY) as 'light' | 'dark';
      const savedLang = await AsyncStorage.getItem(LANG_KEY) as 'en' | 'bn';
      const savedLimit = await AsyncStorage.getItem(LIMIT_KEY);

      if (savedLang) {
        changeLanguage(savedLang);
      }

      set({
        transactions: allRows || [],
        paymentMethods: allMethods || [],
        theme: savedTheme || 'dark', 
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

  updateTransaction: async (id, updates) => {
    try {
      const database = await initDB();
      const existing = get().transactions.find(t => t.id === id);
      if (!existing) return;

      const updatedTx = { ...existing, ...updates };
      
      await database.runAsync(
        'UPDATE transactions SET type = ?, amount = ?, via = ?, note = ?, date = ? WHERE id = ?',
        [updatedTx.type, updatedTx.amount, updatedTx.via, updatedTx.note, updatedTx.date, id]
      );

      const updatedList = get().transactions.map(t => t.id === id ? updatedTx : t);
      set({ transactions: updatedList });
    } catch (e) {
      console.error("Failed to update transaction", e);
      Alert.alert("Error", "Failed to update transaction.");
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

  addPaymentMethod: async (name: string) => {
    try {
      const database = await initDB();
      const id = uuid.v4().toString();
      const createdAt = Date.now();
      await database.runAsync('INSERT INTO payment_methods (id, name, createdAt) VALUES (?, ?, ?)', [id, name, createdAt]);
      set({ paymentMethods: [...get().paymentMethods, { id, name, createdAt }] });
    } catch (e) {
      console.error("Failed to add payment method", e);
    }
  },

  deletePaymentMethod: async (id: string) => {
    try {
      const database = await initDB();
      await database.runAsync('DELETE FROM payment_methods WHERE id = ?', [id]);
      set({ paymentMethods: get().paymentMethods.filter(m => m.id !== id) });
    } catch (e) {
      console.error("Failed to delete payment method", e);
    }
  },

  importTransactions: async (newTransactions) => {
    try {
      const database = await initDB();
      const existing = get().transactions;
      const existingIds = new Set(existing.map(t => t.id));
      const toAdd = newTransactions.filter(t => !existingIds.has(t.id));

      if (toAdd.length === 0) return;

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
