import React from 'react';
import { View, Text } from 'react-native';
import { colors, commonStyles } from '../../theme';

export default function AgendamentosClientScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Meus agendamentos</Text>
      </View>
      <View style={commonStyles.card}>
        <Text style={{ color: colors.textBody, textAlign: 'center', marginTop: 20 }}>
          Em breve — Dia 4
        </Text>
      </View>
    </View>
  );
}