import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useStore, TransactionType, PaymentMethod } from '../store/useStore';
import { Colors } from '../constants/theme';
import { IconSymbol } from '../components/ui/icon-symbol';

export default function VoiceModal() {
  const { t } = useTranslation();
  const { theme, addTransaction, expenseLimit, transactions } = useStore();
  const currentTheme = Colors[theme];
  
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Pulsing animation for microphone indicator
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1, true
    );
    // Auto focus to pop keyboard implicitly urging user to click Mic button on keyboard
    setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const finalizeSave = (type: TransactionType, amount: number, via: PaymentMethod, note: string) => {
    addTransaction({ type, amount, via, note, date: new Date().toISOString() });
    router.back();
  };

  const processAudioText = () => {
    if (!text.trim()) {
       router.back();
       return;
    }
    
    const lower = text.toLowerCase();
    const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bkash', 'nagad', 'bank', 'paypal', 'wise', 'stripe'];
    
    let newType: TransactionType = 'expense';
    if (lower.includes('receive') || lower.includes('earned') || lower.includes('got')) newType = 'income';

    const amountMatch = lower.match(/\d+(\.\d+)?/);
    const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

    let newVia: PaymentMethod = 'cash';
    for (const method of PAYMENT_METHODS) {
      if (lower.includes(method)) { newVia = method; break; }
    }

    const forMatch = lower.match(/(?:for|on)\s+(.+)/);
    const note = forMatch && forMatch[1] ? forMatch[1].trim() : text;

    if (amount <= 0) {
      Alert.alert('Missing Amount', "Could not detect an amount. Say something like 'Spent 400 via bkash for medicine'");
      return;
    }

    if (newType === 'expense' && expenseLimit > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyExpense = transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (monthlyExpense + amount > expenseLimit) {
         Alert.alert(
           t('limit_exceeded_title'), 
           t('limit_exceeded_msg', { limit: expenseLimit }),
           [
             { text: t('cancel'), style: 'cancel' },
             { text: t('proceed'), onPress: () => finalizeSave(newType, amount, newVia, note) }
           ]
         );
         return;
      }
    }
    
    finalizeSave(newType, amount, newVia, note);
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Smart Dictation</Text>
        <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
          Tap the Microphone button below or on your system keyboard to speak.
        </Text>
        
        <TextInput
           ref={inputRef}
           style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border }]}
           value={text}
           onChangeText={setText}
           placeholder="Listening... (Say: Spent 400 via bkash)"
           placeholderTextColor={currentTheme.textMuted}
           multiline
        />
        
        <View style={styles.micWrapper}>
            <Animated.View style={[styles.micContainer, { backgroundColor: currentTheme.tint }, animatedStyle]}>
              <IconSymbol name="mic.fill" size={60} color="#fff" />
            </Animated.View>
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: currentTheme.tint }]} onPress={processAudioText}>
           <Text style={styles.btnText}>Process Voice Transaction</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 40, justifyContent: 'center' },
  card: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  input: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 18, minHeight: 100, textAlignVertical: 'top', marginBottom: 24 },
  micWrapper: { height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  micContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  btn: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
