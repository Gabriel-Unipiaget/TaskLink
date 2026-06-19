import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, StyleSheet,
  ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { colors, commonStyles } from '../theme';
import { getNotificationPreferences, updateNotificationPreferences } from '../services/firestoreService';

export default function NotificationsScreen({ navigation }) {
  const [prefs, setPrefs] = useState({ app: true, email: false, whatsapp: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationPreferences().then(p => {
      setPrefs(p);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationPreferences(prefs);
      Alert.alert('Sucesso', 'Preferências de notificação salvas!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as preferências.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

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
          { label: 'Notificações no app', key: 'app' },
          { label: 'E-mail', key: 'email' },
          { label: 'WhatsApp', key: 'whatsapp' },
        ].map((item) => (
          <View key={item.key} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Switch
              value={!!prefs[item.key]}
              onValueChange={v => setPrefs(p => ({ ...p, [item.key]: v }))}
              trackColor={{ false: '#ddd', true: colors.gold }}
              thumbColor={prefs[item.key] ? colors.primary : '#f4f3f4'}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[commonStyles.btnPrimary, { marginTop: 24 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={colors.primary} />
            : <Text style={commonStyles.btnPrimaryText}>Salvar preferências</Text>
          }
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
