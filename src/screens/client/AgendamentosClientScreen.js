import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {
  onAgendamentosByClienteSnapshot, updateAgendamentoStatus,
  getAvaliacoesByCliente, getClinica, getUserById,
  getOrCreateConversa,
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

export default function AgendamentosClientScreen({ navigation }) {
  const user = auth().currentUser;
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avaliadosSet, setAvaliadosSet] = useState(new Set());
  const [loadingChat, setLoadingChat] = useState(null);

  useEffect(() => {
    const unsubscribe = onAgendamentosByClienteSnapshot((data) => {
      setAgendamentos(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getAvaliacoesByCliente().then(avaliacoes => {
        const ids = new Set(avaliacoes.map(a => a.agendamentoId));
        setAvaliadosSet(ids);
      });
    }, [])
  );

  const handleCancelar = (id) => {
    Alert.alert('Cancelar', 'Deseja cancelar este agendamento?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim', style: 'destructive',
        onPress: () => updateAgendamentoStatus(id, 'cancelado'),
      },
    ]);
  };

  const handleAvaliar = (agendamento) => {
    navigation.navigate('Avaliar', {
      agendamentoId: agendamento.id,
      clinicaId: agendamento.clinicaId,
      nomeClinica: agendamento.nomeClinica,
    });
  };

  const handleMensagem = async (agendamento) => {
    setLoadingChat(agendamento.id);
    try {
      const clinica = await getClinica(agendamento.clinicaId);
      if (!clinica) { Alert.alert('Erro', 'Clínica não encontrada.'); return; }
      const owner = await getUserById(clinica.ownerId);
      const conversaId = await getOrCreateConversa({
        clienteId: user.uid,
        ownerId: clinica.ownerId,
        clinicaId: agendamento.clinicaId,
        nomeClinica: agendamento.nomeClinica,
        nomeCliente: user.displayName || '',
        nomeOwner: owner?.name || 'Clínica',
      });
      navigation.navigate('Chat', {
        conversaId,
        nomeParceiro: owner?.name || 'Clínica',
        nomeClinica: agendamento.nomeClinica,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o chat.');
    } finally {
      setLoadingChat(null);
    }
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

                <View style={styles.actions}>
                  {a.status === 'pendente' && (
                    <TouchableOpacity style={styles.btnCancelar} onPress={() => handleCancelar(a.id)}>
                      <Text style={styles.btnCancelarText}>Cancelar</Text>
                    </TouchableOpacity>
                  )}

                  {a.status === 'confirmado' && (
                    avaliadosSet.has(a.id) ? (
                      <View style={styles.btnAvaliado}>
                        <Text style={styles.btnAvaliadoText}>⭐ Avaliado</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.btnAvaliar} onPress={() => handleAvaliar(a)}>
                        <Text style={styles.btnAvaliarText}>⭐ Avaliar</Text>
                      </TouchableOpacity>
                    )
                  )}

                  {a.status !== 'cancelado' && (
                    <TouchableOpacity
                      style={styles.btnMensagem}
                      onPress={() => handleMensagem(a)}
                      disabled={loadingChat === a.id}
                    >
                      {loadingChat === a.id
                        ? <ActivityIndicator color={colors.primary} size="small" />
                        : <Text style={styles.btnMensagemText}>💬 Mensagem</Text>
                      }
                    </TouchableOpacity>
                  )}
                </View>
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  btnCancelar: {
    borderWidth: 1.5, borderColor: '#E53935', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
  },
  btnCancelarText: { color: '#E53935', fontWeight: 'bold', fontSize: 13 },
  btnAvaliar: {
    borderWidth: 1.5, borderColor: colors.gold, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
  },
  btnAvaliarText: { color: colors.gold, fontWeight: 'bold', fontSize: 13 },
  btnAvaliado: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  btnAvaliadoText: { color: '#999', fontWeight: 'bold', fontSize: 13 },
  btnMensagem: {
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
    backgroundColor: colors.primary,
    minWidth: 44,
  },
  btnMensagemText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
