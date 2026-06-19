import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import { onMinhasClinicasSnapshot, getAgendamentosByClinica } from '../../services/firestoreService';
import auth from '@react-native-firebase/auth';
import { colors, commonStyles } from '../../theme';

export default function OwnerHomeScreen() {
  const user = auth().currentUser;
  const [clinicas, setClinicas] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, confirmados: 0, cancelados: 0, pendentes: 0, receita: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onMinhasClinicasSnapshot(async (data) => {
      setClinicas(data);

      let total = 0, confirmados = 0, cancelados = 0, pendentes = 0, receita = 0;

      for (const clinica of data) {
        const ags = await getAgendamentosByClinica(clinica.id);
        total += ags.length;
        for (const a of ags) {
          if (a.status === 'confirmado') { confirmados++; receita += Number(a.preco) || 0; }
          else if (a.status === 'cancelado') cancelados++;
          else pendentes++;
        }
      }

      setKpis({ total, confirmados, cancelados, pendentes, receita });
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const chartData = [
    { x: 'Pendentes', y: kpis.pendentes, fill: colors.gold },
    { x: 'Confirmados', y: kpis.confirmados, fill: '#4CAF50' },
    { x: 'Cancelados', y: kpis.cancelados, fill: '#E53935' },
  ];

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

        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* KPIs */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{clinicas.length}</Text>
                <Text style={styles.kpiLabel}>Clínicas</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{kpis.total}</Text>
                <Text style={styles.kpiLabel}>Total</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderColor: '#4CAF50' }]}>
                <Text style={[styles.kpiValue, { color: '#4CAF50' }]}>{kpis.confirmados}</Text>
                <Text style={styles.kpiLabel}>Confirmados</Text>
              </View>
              <View style={[styles.kpiCard, { borderColor: '#E53935' }]}>
                <Text style={[styles.kpiValue, { color: '#E53935' }]}>{kpis.cancelados}</Text>
                <Text style={styles.kpiLabel}>Cancelados</Text>
              </View>
              <View style={[styles.kpiCard, { borderColor: colors.gold }]}>
                <Text style={[styles.kpiValue, { color: colors.gold }]}>{kpis.pendentes}</Text>
                <Text style={styles.kpiLabel}>Pendentes</Text>
              </View>
            </View>

            {/* Receita */}
            <View style={styles.receitaCard}>
              <Text style={styles.receitaLabel}>💰 Receita estimada (confirmados)</Text>
              <Text style={styles.receitaValue}>
                R$ {kpis.receita.toFixed(2).replace('.', ',')}
              </Text>
            </View>

            {/* Gráfico */}
            <Text style={commonStyles.sectionTitle}>Agendamentos por status</Text>
            <View style={styles.chartContainer}>
              <VictoryChart
                domainPadding={30}
                height={220}
                padding={{ top: 10, bottom: 40, left: 40, right: 20 }}
              >
                <VictoryAxis
                  style={{
                    tickLabels: { fill: colors.textBody, fontSize: 11 },
                    axis: { stroke: 'transparent' },
                    grid: { stroke: 'transparent' },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    tickLabels: { fill: colors.textBody, fontSize: 11 },
                    axis: { stroke: 'transparent' },
                    grid: { stroke: '#E0E0E0', strokeDasharray: '4' },
                  }}
                  tickFormat={(t) => Number.isInteger(t) ? t : ''}
                />
                <VictoryBar
                  data={chartData}
                  style={{ data: { fill: ({ datum }) => datum.fill, borderRadius: 6 } }}
                  cornerRadius={{ top: 6 }}
                  barWidth={40}
                />
              </VictoryChart>
            </View>

            {/* Lista de clínicas */}
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
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpiCard: {
    flex: 1, backgroundColor: colors.primary, borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#A8C5B5',
  },
  kpiValue: { fontSize: 28, fontWeight: 'bold', color: colors.gold },
  kpiLabel: { fontSize: 12, color: '#A8C5B5', marginTop: 4, textAlign: 'center' },
  receitaCard: {
    backgroundColor: colors.primary, borderRadius: 14, borderWidth: 1.5,
    borderColor: colors.gold, padding: 16, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  receitaLabel: { color: '#A8C5B5', fontSize: 13, flex: 1 },
  receitaValue: { color: colors.gold, fontWeight: 'bold', fontSize: 22 },
  chartContainer: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 16,
    overflow: 'hidden', paddingTop: 4,
  },
  emptyText: { color: colors.textBody, textAlign: 'center' },
  clinicaName: { fontWeight: 'bold', color: colors.textDark, fontSize: 15 },
  clinicaEndereco: { color: colors.textBody, fontSize: 13, marginTop: 2 },
});