import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useStore, Transaction } from '../../store/useStore';
import { Colors } from '../../constants/theme';
import { isThisWeek, isThisMonth, parseISO } from 'date-fns';

export default function HomeScreen() {
  const { theme, transactions } = useStore();
  const { t } = useTranslation();

  const currentTheme = Colors[theme];

  const stats = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let lastMonthExpense = 0;
    let lastMonthIncome = 0;
    let lastWeekExpense = 0;
    let lastWeekIncome = 0;

    transactions.forEach(tx => {
      const amt = tx.amount;
      const date = parseISO(tx.date);
      const isExp = tx.type === 'expense';

      if (isExp) totalExpense += amt;
      else totalIncome += amt;

      if (isThisMonth(date)) {
        if (isExp) lastMonthExpense += amt;
        else lastMonthIncome += amt;
      }

      if (isThisWeek(date)) {
        if (isExp) lastWeekExpense += amt;
        else lastWeekIncome += amt;
      }
    });

    return {
      totalExpense, totalIncome,
      lastMonthExpense, lastMonthIncome,
      lastWeekExpense, lastWeekIncome
    };
  }, [transactions]);

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isExpense = item.type === 'expense';
    const amountColor = isExpense ? currentTheme.expense : currentTheme.income;
    const sign = isExpense ? '-' : '+';

    return (
      <View style={[styles.transactionCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        <View style={styles.txLeft}>
          <Text style={[styles.txVia, { color: currentTheme.text }]}>{item.via.toUpperCase()}</Text>
          <Text style={[styles.txNote, { color: currentTheme.textMuted }]}>{item.note}</Text>
        </View>
        <Text style={[styles.txAmount, { color: amountColor }]}>{sign} {item.amount}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* KPI Cards */}
        <View style={styles.grid}>
          <View style={[styles.statCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.statLabel, { color: currentTheme.textMuted }]}>{t('total_expense')}</Text>
            <Text style={[styles.statValue, { color: currentTheme.expense }]}>{stats.totalExpense}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.statLabel, { color: currentTheme.textMuted }]}>{t('total_income')}</Text>
            <Text style={[styles.statValue, { color: currentTheme.income }]}>{stats.totalIncome}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={[styles.statCardSmall, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.statLabelSmall, { color: currentTheme.textMuted }]}>{t('last_month_expense')}</Text>
            <Text style={[styles.statValueSmall, { color: currentTheme.expense }]}>{stats.lastMonthExpense}</Text>
          </View>
          <View style={[styles.statCardSmall, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.statLabelSmall, { color: currentTheme.textMuted }]}>{t('last_month_income')}</Text>
            <Text style={[styles.statValueSmall, { color: currentTheme.income }]}>{stats.lastMonthIncome}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={[styles.statCardSmall, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.statLabelSmall, { color: currentTheme.textMuted }]}>{t('last_week_expense')}</Text>
            <Text style={[styles.statValueSmall, { color: currentTheme.expense }]}>{stats.lastWeekExpense}</Text>
          </View>
          <View style={[styles.statCardSmall, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.statLabelSmall, { color: currentTheme.textMuted }]}>{t('last_week_income')}</Text>
            <Text style={[styles.statValueSmall, { color: currentTheme.income }]}>{stats.lastWeekIncome}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Recent Transactions</Text>
        <FlatList
          scrollEnabled={false}
          data={transactions.slice(0, 5)}
          keyExtractor={item => item.id}
          renderItem={renderTransaction}
          ListEmptyComponent={<Text style={{ color: currentTheme.textMuted, marginTop: 10 }}>No transactions yet.</Text>}
        />
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statCard: {
    flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, marginHorizontal: 4,
    justifyContent: 'center', alignItems: 'center'
  },
  statCardSmall: {
    flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, marginHorizontal: 4,
    justifyContent: 'center', alignItems: 'center'
  },
  statLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabelSmall: { fontSize: 12, fontWeight: '500', marginBottom: 4, textAlign: 'center' },
  statValueSmall: { fontSize: 18, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  transactionCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  txLeft: { flex: 1 },
  txVia: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  txNote: { fontSize: 13, color: '#687076' },
  txAmount: { fontSize: 16, fontWeight: 'bold' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 60, height: 60,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8
  }
});
