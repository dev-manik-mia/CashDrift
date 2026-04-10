import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStore, Transaction, PaymentMethod } from '../../store/useStore';
import { Colors } from '../../constants/theme';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function TransactionsScreen() {
  const { theme, transactions } = useStore();
  const { t } = useTranslation();
  const currentTheme = Colors[theme];

  const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bkash', 'nagad', 'bank', 'paypal', 'wise', 'stripe'];

  const [showFilters, setShowFilters] = useState(false);
  const [filterNote, setFilterNote] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterAmount, setFilterAmount] = useState('');
  const [filterVia, setFilterVia] = useState<PaymentMethod | ''>('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Note match
      if (filterNote && !t.note.toLowerCase().includes(filterNote.toLowerCase())) return false;
      // Via match
      if (filterVia && t.via !== filterVia) return false;
      // Amount match
      if (filterAmount && !t.amount.toString().includes(filterAmount)) return false;
      // Date match (e.g., matching '2026-04' or '04-10')
      if (filterDate && !t.date.includes(filterDate)) return false;

      return true;
    });
  }, [transactions, filterNote, filterVia, filterAmount, filterDate]);

  const resetFilters = () => {
    setFilterNote('');
    setFilterDate('');
    setFilterAmount('');
    setFilterVia('');
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isExpense = item.type === 'expense';
    const amountColor = isExpense ? currentTheme.expense : currentTheme.income;
    const sign = isExpense ? '-' : '+';

    return (
      <View style={[styles.transactionCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        <View style={styles.txLeft}>
          <Text style={[styles.txTitle, { color: currentTheme.text }]}>
            {item.type.toUpperCase()} • {item.via.toUpperCase()}
          </Text>
          <Text style={[styles.txNote, { color: currentTheme.textMuted }]}>{item.note}</Text>
          <Text style={[styles.txDate, { color: currentTheme.textMuted }]}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.txAmount, { color: amountColor }]}>{sign} {item.amount}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <TouchableOpacity 
        style={[styles.filterToggle, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]} 
        onPress={() => setShowFilters(!showFilters)}
      >
        <IconSymbol name="list.bullet" size={20} color={currentTheme.icon} />
        <Text style={[styles.filterToggleText, { color: currentTheme.text }]}>
           {showFilters ? 'Hide Filters' : 'Smart Filters'}
        </Text>
        {(filterNote || filterDate || filterAmount || filterVia) ? (
           <View style={[styles.activeDot, { backgroundColor: currentTheme.tint }]} />
        ) : null}
      </TouchableOpacity>

      {showFilters && (
        <View style={[styles.filterContainer, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
          <View style={styles.filterRow}>
            <TextInput
              style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border, flex: 1, marginRight: 8 }]}
              placeholder="Filter by Note"
              placeholderTextColor={currentTheme.textMuted}
              value={filterNote}
              onChangeText={setFilterNote}
            />
            <TextInput
              style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border, flex: 1 }]}
              placeholder="Amount (e.g. 400)"
              placeholderTextColor={currentTheme.textMuted}
              value={filterAmount}
              keyboardType="numeric"
              onChangeText={setFilterAmount}
            />
          </View>

          <TextInput
            style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border, marginBottom: 12 }]}
            placeholder="Date Contains (e.g. 2026-04)"
            placeholderTextColor={currentTheme.textMuted}
            value={filterDate}
            onChangeText={setFilterDate}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity 
              style={[styles.chip, !filterVia && { backgroundColor: currentTheme.tint, borderColor: currentTheme.tint }]}
              onPress={() => setFilterVia('')}
            >
              <Text style={!filterVia ? styles.chipTextActive : { color: currentTheme.text }}>All Methods</Text>
            </TouchableOpacity>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity 
                key={m}
                style={[styles.chip, filterVia === m && { backgroundColor: currentTheme.tint, borderColor: currentTheme.tint }]}
                onPress={() => setFilterVia(m)}
              >
                <Text style={filterVia === m ? styles.chipTextActive : { color: currentTheme.text }}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
            <Text style={{ color: currentTheme.expense, fontWeight: 'bold' }}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>No transactions found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  activeDot: {
    width: 8, height: 8, borderRadius: 4, marginLeft: 8
  },
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: { 
    borderWidth: 1, borderColor: '#ccc', borderRadius: 20, 
    paddingVertical: 6, paddingHorizontal: 12, marginRight: 8 
  },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // accommodate global fab
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  txLeft: { flex: 1 },
  txTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  txNote: { fontSize: 15, marginBottom: 4 },
  txDate: { fontSize: 11 },
  txAmount: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 16 }
});
