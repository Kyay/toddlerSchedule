import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RoutineScreen } from './src/screens/RoutineScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { StoreProvider, useStore } from './src/store';
import { colors } from './src/theme';

type Tab = 'today' | 'routines';

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const { ready } = useStore();
  const [tab, setTab] = useState<Tab>('today');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {!ready ? (
          <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
        ) : tab === 'today' ? (
          <TodayScreen />
        ) : (
          <RoutineScreen />
        )}
      </View>
      <View style={styles.tabBar}>
        <TabButton label="Today" icon="📅" active={tab === 'today'} onPress={() => setTab('today')} />
        <TabButton label="Routines" icon="🗂️" active={tab === 'routines'} onPress={() => setTab('routines')} />
      </View>
    </SafeAreaView>
  );
}

function TabButton({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tabBtn} accessibilityRole="tab" accessibilityState={{ selected: active }}>
      <Text style={{ fontSize: 22, opacity: active ? 1 : 0.5 }}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  tabLabelActive: { color: colors.primary },
});
