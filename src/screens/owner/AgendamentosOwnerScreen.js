import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import {
  getMinhasClinicas, onAgendamentosByClinicaSnapshot,
  updateAgendamentoStatus,
} from '../../services/firestoreService';
import { colors, commonStyles } from '../../theme';

const statusColor = (status) => {
  if (status === 'confirmado') return '#4CAF50';
  if (status === 'cancelado') return '#E53935';
  return colors.gold;
};

const statusLabel = (status) => {
  if (status === 'confirmado') return '✅ Confirmado';
  if (status === 'cancelado') return '❌ Cancelado';
  return '⏳ Pendente';
};

export default function AgendamentosOwnerScreen() {
  const [clinicas, setClinicas] = useState([]);
  const [clinicaSelecionada, setClinicaSelecionada] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMinhasClinicas().then(data => {
      setClinicas(data);
      if (data.length > 0) setClinicaSelecionada(data[0]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!clinicaSelecionada) return;
    const unsubscribe = onAgendamentosByClinicaSnapshot(clinicaSelecionada.id, (data) => {
      setAgendamentos(data);
    });
    return () => unsubscribe();
  }, [clinicaSelecionada]);

  const handleStatus = (id, status) => {
    const label = status === 'confirmado' ? 'confirmar' : 'cancelar';
    Alert.alert('Atenção', `Deseja ${label} este agendamento?`, [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim', onPress: () => updateAgendamentoStatus(id, status) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Agendamentos</Text>
      </View>

      <View style={commonStyles.card}>
        <Text style={styles.title}>Agendamentos</Text>
        <View style={commonStyles.divider} />

        {loading ? <ActivityIndicator color={colors.gold} /> : (
          <>
            <Text style={commonStyles.sectionTitle}>Clínica</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {clinicas.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, clinicaSelecionada?.id === c.id && styles.chipSelected]}
                  onPress={() => setClinicaSelecionada(c)}
                >
                  <Text style={[styles.chipText, clinicaSelecionada?.id === c.id && styles.chipTextSelected]}>
                    {c.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView showsVerticalScrollIndicator={false}>
              {agendamentos.length === 0 ? (
                <View style={commonStyles.contentCard}>
                  <Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>
                </View>
              ) : (
                agendamentos.map(a => (
                  <View key={a.id} style={commonStyles.contentCard}>
                    <View style={styles.statusRow}>
                      <Text style={styles.servicoNome}>{a.nomeServico}</Text>
                      <Text style={[styles.status, { color: statusColor(a.status) }]}>
                        {statusLabel(a.status)}
                      </Text>
                    </View>
                    <Text style={styles.info}>👤 {a.nomeCliente}</Text>
                    <Text style={styles.info}>📅 {a.data} às {a.hora}</Text>
                    <Text style={styles.info}>💰 R$ {Number(a.preco).toFixed(2)}</Text>
                    <Text style={styles.info}>⏱ {a.duracao} min</Text>

                    {a.status === 'pendente' && (
                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={styles.btnConfirmar}
                          onPress={() => handleStatus(a.id, 'confirmado')}
                        >
                          <Text style={styles.btnConfirmarText}>✅ Confirmar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.btnCancelar}
                          onPress={() => handleStatus(a.id, 'cancelado')}
                        >
                          <Text style={styles.btnCancelarText}>❌ Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  chip: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: '#fff' },
  chipSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  chipText: { color: colors.textBody, fontWeight: 'bold', fontSize: 13 },
  chipTextSelected: { color: colors.primary },
  emptyText: { color: colors.textBody, textAlign: 'center' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  servicoNome: { fontWeight: 'bold', color: colors.textDark, fontSize: 15, flex: 1 },
  status: { fontWeight: 'bold', fontSize: 12 },
  info: { color: colors.textBody, fontSize: 13, marginBottom: 3 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btnConfirmar: { flex: 1, borderWidth: 1.5, borderColor: '#4CAF50', borderRadius: 10, padding: 10, alignItems: 'center' },
  btnConfirmarText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 13 },
  btnCancelar: { flex: 1, borderWidth: 1.5, borderColor: '#E53935', borderRadius: 10, padding: 10, alignItems: 'center' },
  btnCancelarText: { color: '#E53935', fontWeight: 'bold', fontSize: 13 },
});