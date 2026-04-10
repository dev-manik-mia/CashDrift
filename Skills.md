---
name: CashDrift Cash Tracker Implementation
description: Implementation plan and skill set for CashDrift Expense Tracker application
---

# CashDrift Expense Tracker

## 1. Project Requirements & Objective
Develop an expense tracker application named "CashDrift".
- **Color Schema**: Inspired by AIT (https://ait.edu.bd/). Dark mode (default) and Light mode.
- **Localization**: English and Bangla language support.
- **Transaction Types**: Income and Expense.
- **Payment Methods (Via)**: Cash, bKash, Nagad, Bank, PayPal, Wise, Stripe.
- **Home Screen KPIs**: 
  - Total Expense & Income
  - Last Month Expense & Income
  - Last Week Expense & Income
- **Smart Filter**: Filter capabilities for expenses.
- **Transaction Fields**: Type, Amount, Via, Note, Date.
- **Input Methods**:
  - Manual Form Input
  - Voice Input (e.g., "Spent 400 via bkash for medicine" -> Auto-fill type=Expense, amount=400, via=bKash, note="medicine").

## 2. Technical Decisions
- **Framework**: React Native (Expo) - project already initialized.
- **Styling**: Native styles using React Native + Dynamic Theme provider for Dark/Light mode navigation.
- **State Management**: React Context / Zustand for global state.
- **Localization**: `i18next` and `react-i18next` for English/Bangla switching.
- **Storage**: `AsyncStorage` for local offline persistence.
- **Voice Recognition**: We'll build a parser for NLP-like parsing mapping text to fields.

## 3. Data Model Architecture
```typescript
type TransactionType = 'expense' | 'income';
type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank' | 'paypal' | 'wise' | 'stripe';

interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    via: PaymentMethod;
    note: string;
    date: string; // ISO format
    createdAt: number;
}
```

## 4. NLP Parsing Logic for Voice Input
A basic regex/keyword-based parser function:
- Keyword "spent", "paid", "give" => Expense
- Keyword "receive", "got", "earned" => Income
- Numbers => Amount
- Keywords "bkash", "nagad", "paypal", etc. => Via
- Keywords "for XYZ" => Note

## 5. Development Phases
1. **Setup & Initialization**: Install dependencies (i18next, async-storage, date-fns, zustand, etc.).
2. **Theming & Localization System**: Setup translation files (en.json, bn.json) and Theme Context.
3. **Core State & Logic**: Create transaction store and time filter logic.
4. **UI Implementation**: Home Screen, Transaction Screen/Modal.
5. **Smart Filtering & Polish**.
6. **Data Portability**: Implement Import and Export of transactions in CSV format using `expo-file-system`, `expo-sharing`, and `expo-document-picker`.

## 6. Target AIT Color Scheme Guidelines
Based on https://ait.edu.bd/ branding:
- **Dark Mode (Default)**: Deep modern dark background, contrasting white text, with specific branding accent colors.
- **Light Mode**: White/Light Gray background, dark text.
- **Status Colors**: Expense (Red-ish), Income (Green-ish).
