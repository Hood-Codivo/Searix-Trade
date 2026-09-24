import { Tabs } from 'expo-router';
import { Bell, Binoculars, ChartNoAxesCombined, CircleUserRound, FileCheck2 } from 'lucide-react-native';
import { colors, font } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontFamily: font.sansMedium, fontSize: 11, marginTop: 2 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 78, paddingBottom: 12, paddingTop: 8 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Markets', tabBarIcon: ({ color }) => <ChartNoAxesCombined color={color} size={21} /> }} />
      <Tabs.Screen name="watchlist" options={{ title: 'Watchlist', tabBarIcon: ({ color }) => <Binoculars color={color} size={21} /> }} />
      <Tabs.Screen name="receipts" options={{ title: 'Receipts', tabBarIcon: ({ color }) => <FileCheck2 color={color} size={21} /> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarIcon: ({ color }) => <Bell color={color} size={21} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <CircleUserRound color={color} size={21} /> }} />
    </Tabs>
  );
}
