import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  isLoaded: boolean;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteTransaction: (id: string) => void;
  importTransactions: (transactions: Transaction[]) => void;
  loadInitialData: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'bn') => void;
}

const TRANSACTIONS_KEY = '@cashdrift_transactions';
const THEME_KEY = '@cashdrift_theme';
const LANG_KEY = '@language_pref';

import uuid from 'react-native-uuid';
import { changeLanguage } from '../i18n';

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  theme: 'dark', // default dark as per request
  language: 'en',
  isLoaded: false,

  loadInitialData: async () => {
    try {
      const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      const savedTheme = await AsyncStorage.getItem(THEME_KEY) as 'light' | 'dark';
      const savedLang = await AsyncStorage.getItem(LANG_KEY) as 'en' | 'bn';

      if (savedLang) {
        changeLanguage(savedLang);
      }

      set({
        transactions: data ? JSON.parse(data) : [],
        theme: savedTheme || 'dark', // fallback to dark
        language: savedLang || 'en',
        isLoaded: true
      });
    } catch (e) {
      console.error(e);
      set({ isLoaded: true });
    }
  },

  addTransaction: async (t) => {
    const newTransaction: Transaction = {
      ...t,
      id: t.id || uuid.v4().toString(),
      createdAt: Date.now()
    };
    
    const updated = [newTransaction, ...get().transactions];
    set({ transactions: updated });
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
  },

  deleteTransaction: async (id) => {
    const updated = get().transactions.filter(t => t.id !== id);
    set({ transactions: updated });
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
  },

  importTransactions: async (newTransactions) => {
    const existing = get().transactions;
    // merge by adding only ones with new IDs, or just prepend without duplicates
    const existingIds = new Set(existing.map(t => t.id));
    const toAdd = newTransactions.filter(t => !existingIds.has(t.id));
    
    const updated = [...toAdd, ...existing];
    set({ transactions: updated });
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
  },

  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem(THEME_KEY, theme);
  },

  setLanguage: async (lang) => {
    set({ language: lang });
    await changeLanguage(lang);
  }
}));
