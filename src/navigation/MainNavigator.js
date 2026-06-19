import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';
import { getUserData } from '../services/firestoreService';
import { colors } from '../theme';

// Telas Owner
import OwnerHomeScreen from '../screens/owner/OwnerHomeScreen';
import ClinicasScreen from '../screens/owner/ClinicasScreen';
import ServicoScreen from '../screens/owner/ServicosScreen';
import HorariosScreen from '../screens/owner/HorariosScreen';
import AgendamentosOwnerScreen from '../screens/owner/AgendamentosOwnerScreen';
import RelatorioScreen from '../screens/owner/RelatorioScreen';

// Telas Client
import ClientHomeScreen from '../screens/client/ClientHomeScreen';
import AgendamentosClientScreen from '../screens/client/AgendamentosClientScreen';

// Telas compartilhadas
import ProfileScreen from '../screens/ProfileScreen';
import ConversasScreen from '../screens/ConversasScreen';

const Tab = createBottomTabNavigator();

const tabIcon = (label) => {
  const icons = {
    'Início': '🏠',
    'Clínicas': '🏪',
    'Serviços': '✂️',
    'Horários': '🕐',
    'Agenda': '📅',
    'Relatórios': '📊',
    'Explorar': '🔍',
    'Mensagens': '💬',
    'Perfil': '👤',
  };
  return <Text style={{ fontSize: 20 }}>{icons[label] || '📋'}</Text>;
};

const tabScreenOptions = ({ route }) => ({
  headerShown: false,
  tabBarStyle: { backgroundColor: colors.primary, borderTopColor: colors.gold, borderTopWidth: 1 },
  tabBarActiveTintColor: colors.gold,
  tabBarInactiveTintColor: '#888',
  tabBarIcon: () => tabIcon(route.name),
});

function OwnerTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Início" component={OwnerHomeScreen} />
      <Tab.Screen name="Clínicas" component={ClinicasScreen} />
      <Tab.Screen name="Serviços" component={ServicoScreen} />
      <Tab.Screen name="Horários" component={HorariosScreen} />
      <Tab.Screen name="Agenda" component={AgendamentosOwnerScreen} />
      <Tab.Screen name="Relatórios" component={RelatorioScreen} />
      <Tab.Screen name="Mensagens" component={ConversasScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function ClientTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Explorar" component={ClientHomeScreen} />
      <Tab.Screen name="Agenda" component={AgendamentosClientScreen} />
      <Tab.Screen name="Mensagens" component={ConversasScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserData().then(data => {
      setRole(data?.role || 'client');
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );

  return role === 'owner' ? <OwnerTabs /> : <ClientTabs />;
}