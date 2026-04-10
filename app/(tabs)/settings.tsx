import React from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { documentDirectory, writeAsStringAsync, readAsStringAsync, EncodingType } from 'expo-file-system';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { getDocumentAsync } from 'expo-document-picker';
import { useStore, Transaction, TransactionType, PaymentMethod } from '../../store/useStore';
import { Colors } from '../../constants/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme, language, setTheme, setLanguage, transactions, importTransactions, expenseLimit, setExpenseLimit } = useStore();

  const isDark = theme === 'dark';
  const isBn = language === 'bn';

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
      // skip header using i=1
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // This regex correctly ignores commas inside quotes
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
          via: cleanCol(cols[3]) as PaymentMethod,
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

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={[styles.card, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: Colors[theme].text }]}>{t('monthly_limit')}</Text>
          <TextInput
            style={[styles.inputLimit, { color: Colors[theme].text, borderColor: Colors[theme].border }]}
            value={expenseLimit ? expenseLimit.toString() : ''}
            onChangeText={(v) => setExpenseLimit(parseFloat(v) || 0)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors[theme].textMuted}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: Colors[theme].border }]} />

        <View style={styles.row}>
          <Text style={[styles.label, { color: Colors[theme].text }]}>{t('theme')} (Dark / Light)</Text>
          <Switch 
            value={isDark} 
            onValueChange={(val) => setTheme(val ? 'dark' : 'light')} 
            trackColor={{ false: Colors[theme].border, true: Colors[theme].tint }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: Colors[theme].border }]} />

        <View style={styles.row}>
          <Text style={[styles.label, { color: Colors[theme].text }]}>{t('language')} (English / বাংলা)</Text>
          <Switch 
            value={isBn} 
            onValueChange={(val) => setLanguage(val ? 'bn' : 'en')} 
            trackColor={{ false: Colors[theme].border, true: Colors[theme].tint }}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border, marginTop: 16 }]}>
        <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint, marginBottom: 12 }]} onPress={handleExport}>
          <Text style={styles.buttonText}>{t('export_csv')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint }]} onPress={handleImport}>
          <Text style={styles.buttonText}>{t('import_csv')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputLimit: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: 120,
    textAlign: 'center',
    fontSize: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
