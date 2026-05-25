import React, { useState } from 'react';
import {
  View, Text, Switch, StyleSheet,
  ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { colors, commonStyles } from '../theme';

export default function NotificationsScreen({ navigation }) {
  const [appNotif, setAppNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [whatsappNotif, setWhatsappNotif] = useState(false);

  const handleSave = () => {
    Alert.alert('Sucesso', 'Preferências de notificação salvas!');
  };

  return (
    <View style={styles.container}>
      <View style={[commonStyles.header, styles.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Notificações</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Canais de notificação</Text>
        <View style={commonStyles.divider} />

        <Text style={commonStyles.sectionTitle}>Escolha como deseja ser notificado</Text>

        {[
          { label: 'Notificações no app', value: appNotif, setter: setAppNotif },
          { label: 'E-mail', value: emailNotif, setter: setEmailNotif },
          { label: 'WhatsApp', value: whatsappNotif, setter: setWhatsappNotif },
        ].map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Switch
              value={item.value}
              onValueChange={item.setter}
              trackColor={{ false: '#ddd', true: colors.gold }}
              thumbColor={item.value ? colors.primary : '#f4f3f4'}
            />
          </View>
        ))}

        <TouchableOpacity style={[commonStyles.btnPrimary, { marginTop: 24 }]} onPress={handleSave}>
          <Text style={commonStyles.btnPrimaryText}>Salvar preferências</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { alignItems: 'flex-start' },
  back: { marginBottom: 12 },
  backText: { color: colors.gold, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    elevation: 1,
  },
  rowLabel: { fontSize: 15, color: colors.textDark },
});
