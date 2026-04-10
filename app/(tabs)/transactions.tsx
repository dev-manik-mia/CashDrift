import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStore, Transaction } from '../../store/useStore';
import { Colors } from '../../constants/theme';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function TransactionsScreen() {
  const { theme, transactions } = useStore();
  const { t } = useTranslation();
  const currentTheme = Colors[theme];

  const [search, setSearch] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!search) return transactions;
    const s = search.toLowerCase();
    return transactions.filter(t => 
      t.note.toLowerCase().includes(s) || 
      t.via.toLowerCase().includes(s) || 
      t.type.toLowerCase().includes(s) ||
      t.amount.toString().includes(s)
    );
  }, [transactions, search]);

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
      <View style={[styles.searchContainer, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        <IconSymbol name="magnifyingglass" size={20} color={currentTheme.icon} />
        <TextInput
          style={[styles.searchInput, { color: currentTheme.text }]}
          placeholderTextColor={currentTheme.textMuted}
          placeholder={t('filter') + " (Type, Amount, Via, Note)"}
          value={search}
          onChangeText={setSearch}
        />
      </View>

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
