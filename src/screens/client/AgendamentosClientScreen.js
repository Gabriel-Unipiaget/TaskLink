import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { onAgendamentosByClienteSnapshot, updateAgendamentoStatus } from '../../services/firestoreService';
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

export default function AgendamentosClientScreen() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAgendamentosByClienteSnapshot((data) => {
      setAgendamentos(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCancelar = (id) => {
    Alert.alert('Cancelar', 'Deseja cancelar este agendamento?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim', style: 'destructive',
        onPress: () => updateAgendamentoStatus(id, 'cancelado'),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Meus agendamentos</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Agendamentos</Text>
        <View style={commonStyles.divider} />

        {loading ? <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} /> :
          agendamentos.length === 0 ? (
            <View style={commonStyles.contentCard}>
              <Text style={styles.emptyText}>Você ainda não tem agendamentos.</Text>
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
                <Text style={styles.info}>🏪 {a.nomeClinica}</Text>
                <Text style={styles.info}>📅 {a.data} às {a.hora}</Text>
                <Text style={styles.info}>💰 R$ {Number(a.preco).toFixed(2)}</Text>

                {a.status === 'pendente' && (
                  <TouchableOpacity style={styles.btnCancelar} onPress={() => handleCancelar(a.id)}>
                    <Text style={styles.btnCancelarText}>Cancelar agendamento</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  emptyText: { color: colors.textBody, textAlign: 'center' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  servicoNome: { fontWeight: 'bold', color: colors.textDark, fontSize: 15, flex: 1 },
  status: { fontWeight: 'bold', fontSize: 12 },
  info: { color: colors.textBody, fontSize: 13, marginBottom: 3 },
  btnCancelar: {
    borderWidth: 1.5, borderColor: '#E53935', borderRadius: 10,
    padding: 10, alignItems: 'center', marginTop: 10,
  },
  btnCancelarText: { color: '#E53935', fontWeight: 'bold', fontSize: 13 },
});