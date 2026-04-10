import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useStore, TransactionType, PaymentMethod } from '../store/useStore';
import { Colors } from '../constants/theme';

export default function AddTransactionModal() {
  const { theme, addTransaction } = useStore();
  const { t } = useTranslation();
  const currentTheme = Colors[theme];

  const [smartInput, setSmartInput] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [via, setVia] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');

  const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bkash', 'nagad', 'bank', 'paypal', 'wise', 'stripe'];

  // NLP Smart Input logic
  const handleSmartInput = (text: string) => {
    setSmartInput(text);
    const lower = text.toLowerCase();
    
    // Default to expense
    let newType: TransactionType = 'expense';
    if (lower.includes('receive') || lower.includes('earned') || lower.includes('got')) {
      newType = 'income';
    }

    // Extract amount
    const amountMatch = lower.match(/\d+(\.\d+)?/);
    if (amountMatch) {
      setAmount(amountMatch[0]);
    }

    // Extract Via
    let newVia: PaymentMethod = 'cash'; // default
    for (const method of PAYMENT_METHODS) {
      if (lower.includes(method)) {
        newVia = method;
        break;
      }
    }

    // Extract Note
    // "spent 400 via bkash for medicine" -> extract everything after "for "
    const forMatch = lower.match(/(?:for|on)\s+(.+)/);
    if (forMatch && forMatch[1]) {
      setNote(forMatch[1].trim());
    } else {
      // Just set the whole text as note if 'for' isn't found, but ignore numbers and payment methods if possible
      // to keep it simple, leave note empty or use full text
      // Let's just update the state
    }

    setType(newType);
    setVia(newVia);
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    addTransaction({
      type,
      amount: numAmount,
      via,
      note: note || smartInput,
      date: new Date().toISOString(),
    });

    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        <Text style={[styles.label, { color: currentTheme.text }]}>{t('smart_input')}</Text>
        <TextInput
          style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border }]}
          placeholder={t('smart_input_placeholder')}
          placeholderTextColor={currentTheme.textMuted}
          value={smartInput}
          onChangeText={handleSmartInput}
        />

        <View style={styles.divider} />

        <Text style={[styles.label, { color: currentTheme.text }]}>{t('type')}</Text>
        <View style={styles.row}>
           <TouchableOpacity 
             style={[styles.chip, type === 'expense' && { backgroundColor: currentTheme.expense, borderColor: currentTheme.expense }]}
             onPress={() => setType('expense')}
           >
             <Text style={type === 'expense' ? styles.chipTextActive : { color: currentTheme.text }}>{t('expense')}</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.chip, type === 'income' && { backgroundColor: currentTheme.income, borderColor: currentTheme.income }]}
             onPress={() => setType('income')}
           >
             <Text style={type === 'income' ? styles.chipTextActive : { color: currentTheme.text }}>{t('income')}</Text>
           </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: currentTheme.text, marginTop: 16 }]}>{t('amount')}</Text>
        <TextInput
          style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border }]}
          placeholder="0.00"
          placeholderTextColor={currentTheme.textMuted}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={[styles.label, { color: currentTheme.text, marginTop: 16 }]}>{t('via')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity 
              key={m}
              style={[
                styles.chip, 
                via === m && { backgroundColor: currentTheme.tint, borderColor: currentTheme.tint }
              ]}
              onPress={() => setVia(m)}
            >
              <Text style={via === m ? styles.chipTextActive : { color: currentTheme.text }}>{m.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: currentTheme.text, marginTop: 16 }]}>{t('note')}</Text>
        <TextInput
          style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border }]}
          placeholder="What was this for?"
          placeholderTextColor={currentTheme.textMuted}
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.tint }]} onPress={handleSave}>
          <Text style={styles.buttonText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  divider: { height: 1, marginVertical: 20 },
  row: { flexDirection: 'row', gap: 12 },
  rowScroll: { flexDirection: 'row', marginBottom: 8 },
  chip: { 
    borderWidth: 1, borderColor: '#ccc', borderRadius: 20, 
    paddingVertical: 8, paddingHorizontal: 16, marginRight: 8 
  },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  button: { marginTop: 24, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
