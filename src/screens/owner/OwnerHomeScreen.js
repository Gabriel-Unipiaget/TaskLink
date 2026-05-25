import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { onMinhasClinicasSnapshot, getAgendamentosByClinica } from '../../services/firestoreService';
import auth from '@react-native-firebase/auth';
import { colors, commonStyles } from '../../theme';

export default function OwnerHomeScreen() {
  const user = auth().currentUser;
  const [clinicas, setClinicas] = useState([]);
  const [totalAgendamentos, setTotalAgendamentos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onMinhasClinicasSnapshot(async (data) => {
      setClinicas(data);
      let total = 0;
      for (const clinica of data) {
        const ags = await getAgendamentosByClinica(clinica.id);
        total += ags.length;
      }
      setTotalAgendamentos(total);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Olá, {user?.displayName?.split(' ')[0]}! 👋</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Painel do estabelecimento</Text>
        <View style={commonStyles.divider} />

        {loading ? <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} /> : (
          <>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{clinicas.length}</Text>
                <Text style={styles.kpiLabel}>Clínicas</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{totalAgendamentos}</Text>
                <Text style={styles.kpiLabel}>Agendamentos</Text>
              </View>
            </View>

            <Text style={commonStyles.sectionTitle}>Minhas clínicas</Text>
            {clinicas.length === 0 ? (
              <View style={commonStyles.contentCard}>
                <Text style={styles.emptyText}>Você ainda não cadastrou nenhuma clínica.</Text>
              </View>
            ) : (
              clinicas.map(c => (
                <View key={c.id} style={commonStyles.contentCard}>
                  <Text style={styles.clinicaName}>{c.nome}</Text>
                  <Text style={styles.clinicaEndereco}>{c.endereco}</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  kpiCard: {
    flex: 1, backgroundColor: colors.primary, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  kpiValue: { fontSize: 32, fontWeight: 'bold', color: colors.gold },
  kpiLabel: { fontSize: 13, color: '#A8C5B5', marginTop: 4 },
  emptyText: { color: colors.textBody, textAlign: 'center' },
  clinicaName: { fontWeight: 'bold', color: colors.textDark, fontSize: 15 },
  clinicaEndereco: { color: colors.textBody, fontSize: 13, marginTop: 2 },
});