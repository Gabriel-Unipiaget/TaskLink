import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, Alert, Image,
} from 'react-native';
import {
  getAllClinicas, getServicosByClinica, createAgendamento,
  onHorariosDisponiveisByServico, reservarHorario,
  onClinicaFotosSnapshot,
} from '../../services/firestoreService';
import auth from '@react-native-firebase/auth';
import { colors, commonStyles } from '../../theme';

const RatingStars = ({ rating, total }) => {
  if (!total) return null;
  const stars = Math.round(rating);
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingStars}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</Text>
      <Text style={styles.ratingText}>{Number(rating).toFixed(1)} ({total})</Text>
    </View>
  );
};

function ClinicaFotos({ clinicaId }) {
  const [fotos, setFotos] = useState([]);

  useEffect(() => {
    if (!clinicaId) return;
    const unsubscribe = onClinicaFotosSnapshot(clinicaId, setFotos);
    return () => unsubscribe();
  }, [clinicaId]);

  if (fotos.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosScroll}>
      {fotos.map(f => (
        <Image key={f.id} source={{ uri: f.base64 }} style={styles.fotoThumb} />
      ))}
    </ScrollView>
  );
}

export default function ClientHomeScreen() {
  const user = auth().currentUser;
  const [clinicas, setClinicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clinicaSelecionada, setClinicaSelecionada] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [loadingServicos, setLoadingServicos] = useState(false);
  const [modalAgendar, setModalAgendar] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [unsubscribeHorarios, setUnsubscribeHorarios] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllClinicas().then(data => {
      setClinicas(data);
      setLoading(false);
    });
  }, []);

  const handleSelectClinica = async (clinica) => {
    setClinicaSelecionada(clinica);
    setLoadingServicos(true);
    const s = await getServicosByClinica(clinica.id);
    setServicos(s);
    setLoadingServicos(false);
  };

  const handleAgendar = (servico) => {
    setServicoSelecionado(servico);
    setHorarioSelecionado(null);
    setHorariosDisponiveis([]);
    setLoadingHorarios(true);
    setModalAgendar(true);

    const unsubscribe = onHorariosDisponiveisByServico(
      clinicaSelecionada.id,
      servico.id,
      (data) => {
        setHorariosDisponiveis(data);
        setLoadingHorarios(false);
      }
    );
    setUnsubscribeHorarios(() => unsubscribe);
  };

  const handleFecharModal = () => {
    if (unsubscribeHorarios) unsubscribeHorarios();
    setUnsubscribeHorarios(null);
    setModalAgendar(false);
  };

  const handleConfirmarAgendamento = async () => {
    if (!horarioSelecionado) {
      Alert.alert('Atenção', 'Selecione um horário disponível.');
      return;
    }
    setSaving(true);
    try {
      const docRef = await createAgendamento({
        clienteId: user.uid,
        nomeCliente: user.displayName,
        clinicaId: clinicaSelecionada.id,
        nomeClinica: clinicaSelecionada.nome,
        servicoId: servicoSelecionado.id,
        nomeServico: servicoSelecionado.nome,
        preco: servicoSelecionado.preco,
        duracao: servicoSelecionado.duracao,
        data: horarioSelecionado.data,
        hora: horarioSelecionado.hora,
        horarioId: horarioSelecionado.id,
      });
      await reservarHorario(horarioSelecionado.id, docRef.id);
      if (unsubscribeHorarios) unsubscribeHorarios();
      setModalAgendar(false);
      Alert.alert('Sucesso! 🎉', 'Agendamento realizado com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível realizar o agendamento.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = clinicas.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.endereco || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Olá, {user?.displayName?.split(' ')[0]}! 👋</Text>
      </View>

      <View style={commonStyles.card}>
        {!clinicaSelecionada ? (
          <>
            <Text style={styles.title}>Explorar clínicas</Text>
            <View style={commonStyles.divider} />

            <TextInput
              style={[commonStyles.input, { marginBottom: 12 }]}
              placeholder="Buscar clínica..."
              placeholderTextColor={colors.textLight}
              value={search}
              onChangeText={setSearch}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              {loading ? <ActivityIndicator color={colors.gold} /> :
                filtered.length === 0 ? (
                  <View style={commonStyles.contentCard}>
                    <Text style={styles.emptyText}>Nenhuma clínica encontrada.</Text>
                  </View>
                ) : (
                  filtered.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={commonStyles.contentCard}
                      onPress={() => handleSelectClinica(c)}
                    >
                      <ClinicaFotos clinicaId={c.id} />
                      <Text style={styles.clinicaNome}>{c.nome}</Text>
                      <RatingStars rating={c.ratingMedia} total={c.totalAvaliacoes} />
                      <Text style={styles.clinicaInfo}>📍 {c.endereco}</Text>
                      {c.telefone ? <Text style={styles.clinicaInfo}>📞 {c.telefone}</Text> : null}
                      {c.descricao ? <Text style={styles.clinicaDesc}>{c.descricao}</Text> : null}
                      <Text style={styles.verServicos}>Ver serviços →</Text>
                    </TouchableOpacity>
                  ))
                )
              }
            </ScrollView>
          </>
        ) : (
          <>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={() => setClinicaSelecionada(null)}>
                <Text style={styles.backText}>← Voltar</Text>
              </TouchableOpacity>
              <Text style={styles.clinicaHeader}>{clinicaSelecionada.nome}</Text>
            </View>
            <RatingStars rating={clinicaSelecionada.ratingMedia} total={clinicaSelecionada.totalAvaliacoes} />
            <View style={commonStyles.divider} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingServicos ? <ActivityIndicator color={colors.gold} /> :
                servicos.length === 0 ? (
                  <View style={commonStyles.contentCard}>
                    <Text style={styles.emptyText}>Nenhum serviço disponível.</Text>
                  </View>
                ) : (
                  servicos.map(s => (
                    <View key={s.id} style={commonStyles.contentCard}>
                      <View style={styles.servicoHeader}>
                        <Text style={styles.servicoNome}>{s.nome}</Text>
                        <Text style={styles.servicoPreco}>R$ {Number(s.preco).toFixed(2)}</Text>
                      </View>
                      {s.descricao ? <Text style={styles.servicoDesc}>{s.descricao}</Text> : null}
                      <Text style={styles.servicoDuracao}>⏱ {s.duracao} min</Text>
                      <TouchableOpacity
                        style={[commonStyles.btnPrimary, { marginTop: 12, marginBottom: 0 }]}
                        onPress={() => handleAgendar(s)}
                      >
                        <Text style={commonStyles.btnPrimaryText}>Ver horários</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )
              }
            </ScrollView>
          </>
        )}
      </View>

      <Modal visible={modalAgendar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolher horário</Text>
            <View style={commonStyles.divider} />

            <View style={commonStyles.contentCard}>
              <Text style={styles.modalInfo}>🏪 {clinicaSelecionada?.nome}</Text>
              <Text style={styles.modalInfo}>✂️ {servicoSelecionado?.nome}</Text>
              <Text style={styles.modalInfo}>💰 R$ {Number(servicoSelecionado?.preco || 0).toFixed(2)}</Text>
              <Text style={styles.modalInfo}>⏱ {servicoSelecionado?.duracao} min</Text>
            </View>

            <Text style={commonStyles.sectionTitle}>Horários disponíveis</Text>

            {loadingHorarios ? (
              <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
            ) : horariosDisponiveis.length === 0 ? (
              <View style={commonStyles.contentCard}>
                <Text style={{ color: colors.textBody, textAlign: 'center' }}>
                  Nenhum horário disponível no momento.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                {horariosDisponiveis.map(h => (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.horarioOption, horarioSelecionado?.id === h.id && styles.horarioOptionSelected]}
                    onPress={() => setHorarioSelecionado(h)}
                  >
                    <Text style={[styles.horarioOptionText, horarioSelecionado?.id === h.id && styles.horarioOptionTextSelected]}>
                      📅 {h.data} às {h.hora}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={handleFecharModal}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.btnPrimary, { flex: 1, marginBottom: 0 }, !horarioSelecionado && { opacity: 0.5 }]}
                onPress={handleConfirmarAgendamento}
                disabled={saving || !horarioSelecionado}
              >
                {saving
                  ? <ActivityIndicator color={colors.primary} />
                  : <Text style={commonStyles.btnPrimaryText}>Confirmar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  backText: { color: colors.gold, fontWeight: 'bold', fontSize: 15 },
  clinicaHeader: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, flex: 1 },
  emptyText: { color: colors.textBody, textAlign: 'center' },
  clinicaNome: { fontWeight: 'bold', color: colors.textDark, fontSize: 15, marginBottom: 4 },
  clinicaInfo: { color: colors.textBody, fontSize: 13, marginBottom: 2 },
  clinicaDesc: { color: '#999', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  verServicos: { color: colors.gold, fontWeight: 'bold', fontSize: 13, marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  ratingStars: { color: colors.gold, fontSize: 13 },
  ratingText: { color: colors.textBody, fontSize: 12 },
  fotosScroll: { marginBottom: 10 },
  fotoThumb: { width: 90, height: 70, borderRadius: 8, marginRight: 8 },
  servicoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  servicoNome: { fontWeight: 'bold', color: colors.textDark, fontSize: 15 },
  servicoPreco: { color: colors.gold, fontWeight: 'bold', fontSize: 15 },
  servicoDesc: { color: colors.textBody, fontSize: 13, marginTop: 4 },
  servicoDuracao: { color: '#999', fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark },
  modalInfo: { fontSize: 14, color: colors.textDark, marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnCancelText: { color: colors.textBody, fontWeight: 'bold' },
  horarioOption: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12,
    padding: 14, marginBottom: 8, backgroundColor: '#fff',
  },
  horarioOptionSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  horarioOptionText: { color: colors.textDark, fontWeight: 'bold', fontSize: 14 },
  horarioOptionTextSelected: { color: colors.primary },
});
