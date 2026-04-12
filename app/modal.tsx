import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore, TransactionType } from '../store/useStore';
import { Colors } from '../constants/theme';
import { IconSymbol } from '../components/ui/icon-symbol';

export default function AddTransactionModal() {
  const { theme, addTransaction, updateTransaction, expenseLimit, transactions, paymentMethods } = useStore();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentTheme = Colors[theme];

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [via, setVia] = useState<string>('');
  const [note, setNote] = useState('');

  const isEdit = !!id;

  useEffect(() => {
    if (via === '' && paymentMethods.length > 0) {
      setVia(paymentMethods[0].name);
    }
  }, [paymentMethods]);

  useEffect(() => {
    if (isEdit) {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        setType(tx.type);
        setAmount(tx.amount.toString());
        setVia(tx.via);
        setNote(tx.note);
      }
    }
  }, [id]);

  const finalizeSave = (numAmount: number) => {
    if (isEdit && id) {
      updateTransaction(id, {
        type,
        amount: numAmount,
        via,
        note,
      });
    } else {
      addTransaction({
        type,
        amount: numAmount,
        via,
        note,
        date: new Date().toISOString(),
      });
    }
    router.back();
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    if (type === 'expense' && expenseLimit > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyExpense = transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (monthlyExpense + numAmount > expenseLimit) {
         Alert.alert(
           t('limit_exceeded_title'), 
           t('limit_exceeded_msg', { limit: expenseLimit }),
           [
             { text: t('cancel'), style: 'cancel' },
             { text: t('proceed'), onPress: () => finalizeSave(numAmount) }
           ]
         );
         return;
      }
    }

    finalizeSave(numAmount);
  };

  return (
    <View style={styles.backdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => router.back()} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollCenter} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            
            <View style={styles.header}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                {isEdit ? t('edit_transaction') : t('add_transaction')}
              </Text>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                <IconSymbol name="xmark" size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

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
              {paymentMethods.length === 0 ? (
                <Text style={{ color: currentTheme.textMuted, paddingVertical: 8 }}>
                  No payment methods found. Please add one in Settings.
                </Text>
              ) : (
                paymentMethods.map(m => (
                  <TouchableOpacity 
                    key={m.id}
                    style={[
                      styles.chip, 
                      via === m.name && { backgroundColor: currentTheme.tint, borderColor: currentTheme.tint }
                    ]}
                    onPress={() => setVia(m.name)}
                  >
                    <Text style={via === m.name ? styles.chipTextActive : { color: currentTheme.text }}>{m.name.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <Text style={[styles.label, { color: currentTheme.text, marginTop: 16 }]}>{t('note')}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: currentTheme.text, borderColor: currentTheme.border }]}
              placeholder="What was this for?"
              placeholderTextColor={currentTheme.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.tint }]} onPress={handleSave}>
              <Text style={styles.buttonText}>{isEdit ? t('update') : t('save')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 16 },
  scrollCenter: { flexGrow: 1, justifyContent: 'flex-start', paddingTop: 60 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
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
