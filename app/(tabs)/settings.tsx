import React from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import { documentDirectory, writeAsStringAsync, readAsStringAsync, EncodingType } from 'expo-file-system';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { getDocumentAsync } from 'expo-document-picker';
import { useStore, Transaction, TransactionType } from '../../store/useStore';
import { Colors } from '../../constants/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { 
    theme, language, setTheme, setLanguage, transactions, 
    importTransactions, expenseLimit, setExpenseLimit,
    paymentMethods, addPaymentMethod, deletePaymentMethod 
  } = useStore();

  const isDark = theme === 'dark';
  const isBn = language === 'bn';
  const currentTheme = Colors[theme];
  const [newMethodName, setNewMethodName] = React.useState('');

  const handleExport = async () => {
    try {
      const header = 'id,type,amount,via,note,date,createdAt\n';
      const rows = transactions.map(tx => 
        `"${tx.id}","${tx.type}","${tx.amount}","${tx.via}","${tx.note.replace(/"/g, '""')}","${tx.date}","${tx.createdAt}"`
      ).join('\n');
      const csv = header + rows;
      
      const fileUri = (documentDirectory || 'file:///') + 'cashdrift_export.csv';
      await writeAsStringAsync(fileUri, csv, { encoding: EncodingType ? EncodingType.UTF8 : 'utf8' });
      
      if (await isAvailableAsync()) {
        await shareAsync(fileUri);
      } else {
        Alert.alert(t('export_success'), fileUri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('error'), 'Export failed.');
    }
  };

  const handleImport = async () => {
    try {
      const result = await getDocumentAsync({ type: '*/*' });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const fileUri = result.assets[0].uri;
      const csv = await readAsStringAsync(fileUri, { encoding: EncodingType ? EncodingType.UTF8 : 'utf8' });
      
      const lines = csv.split('\n');
      if (lines.length < 2) return;

      const newTransactions: Transaction[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\",]+))/g);
        if (!cols || cols.length < 7) continue;

        const cleanCol = (str: string) => {
          if (str.startsWith('"') && str.endsWith('"')) {
            return str.substring(1, str.length - 1).replace(/""/g, '"');
          }
          return str;
        };

        const tx: Transaction = {
          id: cleanCol(cols[0]),
          type: cleanCol(cols[1]) as TransactionType,
          amount: parseFloat(cleanCol(cols[2])),
          via: cleanCol(cols[3]),
          note: cleanCol(cols[4]),
          date: cleanCol(cols[5]),
          createdAt: parseInt(cleanCol(cols[6]), 10)
        };
        newTransactions.push(tx);
      }

      importTransactions(newTransactions);
      Alert.alert('Success', t('import_success'));
    } catch (e) {
      console.error(e);
      Alert.alert(t('error'), 'Import failed.');
    }
  };

  const handleAddMethod = async () => {
    if (!newMethodName.trim()) return;
    await addPaymentMethod(newMethodName.trim());
    setNewMethodName('');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: currentTheme.text }]}>{t('monthly_limit')}</Text>
          <TextInput
            style={[styles.inputLimit, { color: currentTheme.text, borderColor: currentTheme.border }]}
            value={expenseLimit ? expenseLimit.toString() : ''}
            onChangeText={(v) => setExpenseLimit(parseFloat(v) || 0)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={currentTheme.textMuted}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: currentTheme.border }]} />

        <View style={styles.row}>
          <Text style={[styles.label, { color: currentTheme.text }]}>{t('theme')} (Dark / Light)</Text>
          <Switch 
            value={isDark} 
            onValueChange={(val) => setTheme(val ? 'dark' : 'light')} 
            trackColor={{ false: currentTheme.border, true: currentTheme.tint }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: currentTheme.border }]} />

        <View style={styles.row}>
          <Text style={[styles.label, { color: currentTheme.text }]}>{t('language')} (English / বাংলা)</Text>
          <Switch 
            value={isBn} 
            onValueChange={(val) => setLanguage(val ? 'bn' : 'en')} 
            trackColor={{ false: currentTheme.border, true: currentTheme.tint }}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border, marginTop: 16 }]}>
        <Text style={[styles.label, { color: currentTheme.text, marginBottom: 12 }]}>Payment Methods</Text>
        <View style={styles.methodList}>
          {paymentMethods.map(m => (
            <View key={m.id} style={[styles.methodItem, { borderColor: currentTheme.border }]}>
              <Text style={{ color: currentTheme.text }}>{m.name.toUpperCase()}</Text>
              <TouchableOpacity onPress={() => deletePaymentMethod(m.id)}>
                <Text style={{ color: currentTheme.expense, fontSize: 12 }}>DELETE</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        
        <View style={styles.addMethodRow}>
          <TextInput
            style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border, flex: 1, marginRight: 8 }]}
            placeholder="New Method (e.g. Card)"
            placeholderTextColor={currentTheme.textMuted}
            value={newMethodName}
            onChangeText={setNewMethodName}
          />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: currentTheme.tint }]} onPress={handleAddMethod}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>ADD</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border, marginTop: 16 }]}>
        <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.tint, marginBottom: 12 }]} onPress={handleExport}>
          <Text style={styles.buttonText}>{t('export_csv')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.tint }]} onPress={handleImport}>
          <Text style={styles.buttonText}>{t('import_csv')}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  divider: { height: 1, marginVertical: 4 },
  label: { fontSize: 16, fontWeight: 'bold' },
  inputLimit: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, width: 120, textAlign: 'center', fontSize: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  methodList: { marginBottom: 12 },
  methodItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, marginBottom: 4 },
  addMethodRow: { flexDirection: 'row', alignItems: 'center' },
  addBtn: { padding: 12, borderRadius: 8, minWidth: 60, alignItems: 'center' },
  button: { padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
