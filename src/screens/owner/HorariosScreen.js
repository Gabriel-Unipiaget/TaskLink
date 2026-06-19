import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import {
  getMinhasClinicas, getServicosByClinica,
  onHorariosByClinicaSnapshot, createHorario, deleteHorario,
} from '../../services/firestoreService';
import { colors, commonStyles } from '../../theme';

const emptyForm = { data: '', hora: '' };

export default function HorariosScreen() {
  const [clinicas, setClinicas] = useState([]);
  const [clinicaSelecionada, setClinicaSelecionada] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMinhasClinicas().then(data => {
      setClinicas(data);
      if (data.length > 0) setClinicaSelecionada(data[0]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!clinicaSelecionada) return;
    getServicosByClinica(clinicaSelecionada.id).then(data => {
      setServicos(data);
      if (data.length > 0) setServicoSelecionado(data[0]);
    });
  }, [clinicaSelecionada]);

  useEffect(() => {
    if (!clinicaSelecionada) return;
    const unsubscribe = onHorariosByClinicaSnapshot(clinicaSelecionada.id, (data) => {
      setHorarios(data);
    });
    return () => unsubscribe();
  }, [clinicaSelecionada]);

  const handleSave = async () => {
    if (!form.data || !form.hora) {
      Alert.alert('Atenção', 'Preencha data e horário.'); return;
    }
    if (!servicoSelecionado) {
      Alert.alert('Atenção', 'Selecione um serviço.'); return;
    }
    setSaving(true);
    try {
      await createHorario({
        clinicaId: clinicaSelecionada.id,
        nomeClinica: clinicaSelecionada.nome,
        servicoId: servicoSelecionado.id,
        nomeServico: servicoSelecionado.nome,
        preco: servicoSelecionado.preco,
        duracao: servicoSelecionado.duracao,
        data: form.data,
        hora: form.hora,
      });
      setModalVisible(false);
      setForm(emptyForm);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally { setSaving(false); }
  };

  const handleDelete = (id, disponivel) => {
    if (!disponivel) {
      Alert.alert('Atenção', 'Este horário já foi reservado por um cliente.');
      return;
    }
    Alert.alert('Excluir', 'Deseja excluir este horário?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteHorario(id) },
    ]);
  };

  const horariosDoServico = servicoSelecionado
    ? horarios.filter(h => h.servicoId === servicoSelecionado.id)
    : [];

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Horários disponíveis</Text>
      </View>

      <View style={commonStyles.card}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Horários</Text>
          <TouchableOpacity style={styles.btnAdd} onPress={() => setModalVisible(true)}>
            <Text style={styles.btnAddText}>+ Novo</Text>
          </TouchableOpacity>
        </View>
        <View style={commonStyles.divider} />

        {loading ? <ActivityIndicator color={colors.gold} /> : (
          <>
            <Text style={commonStyles.sectionTitle}>Clínica</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
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

            <Text style={commonStyles.sectionTitle}>Serviço</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {servicos.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, servicoSelecionado?.id === s.id && styles.chipSelected]}
                  onPress={() => setServicoSelecionado(s)}
                >
                  <Text style={[styles.chipText, servicoSelecionado?.id === s.id && styles.chipTextSelected]}>
                    {s.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView showsVerticalScrollIndicator={false}>
              {horariosDoServico.length === 0 ? (
                <View style={commonStyles.contentCard}>
                  <Text style={styles.emptyText}>Nenhum horário cadastrado.</Text>
                </View>
              ) : (
                horariosDoServico.map(h => (
                  <View key={h.id} style={commonStyles.contentCard}>
                    <View style={styles.horarioRow}>
                      <View>
                        <Text style={styles.horarioData}>📅 {h.data} às {h.hora}</Text>
                        <Text style={styles.horarioServico}>{h.nomeServico}</Text>
                      </View>
                      <View style={styles.horarioRight}>
                        <Text style={[styles.horarioStatus, { color: h.disponivel ? '#4CAF50' : '#E53935' }]}>
                          {h.disponivel ? '✅ Livre' : '🔒 Reservado'}
                        </Text>
                        {h.disponivel && (
                          <TouchableOpacity onPress={() => handleDelete(h.id, h.disponivel)}>
                            <Text style={styles.btnDeleteText}>🗑</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo horário disponível</Text>
            <View style={commonStyles.divider} />

            <Text style={commonStyles.sectionTitle}>Serviço</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {servicos.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, servicoSelecionado?.id === s.id && styles.chipSelected]}
                  onPress={() => setServicoSelecionado(s)}
                >
                  <Text style={[styles.chipText, servicoSelecionado?.id === s.id && styles.chipTextSelected]}>
                    {s.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={commonStyles.sectionTitle}>Data</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.textLight}
              value={form.data}
              onChangeText={v => setForm(f => ({ ...f, data: v }))}
              keyboardType="numeric"
            />

            <Text style={commonStyles.sectionTitle}>Horário</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="HH:MM"
              placeholderTextColor={colors.textLight}
              value={form.hora}
              onChangeText={v => setForm(f => ({ ...f, hora: v }))}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => { setModalVisible(false); setForm(emptyForm); }}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[commonStyles.btnPrimary, { flex: 1, marginBottom: 0 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.primary} /> : <Text style={commonStyles.btnPrimaryText}>Salvar</Text>}
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark },
  btnAdd: { backgroundColor: colors.gold, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  btnAddText: { color: colors.primary, fontWeight: 'bold' },
  chip: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: '#fff' },
  chipSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  chipText: { color: colors.textBody, fontWeight: 'bold', fontSize: 13 },
  chipTextSelected: { color: colors.primary },
  emptyText: { color: colors.textBody, textAlign: 'center' },
  horarioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  horarioData: { fontWeight: 'bold', color: colors.textDark, fontSize: 14 },
  horarioServico: { color: colors.textBody, fontSize: 12, marginTop: 2 },
  horarioRight: { alignItems: 'flex-end', gap: 6 },
  horarioStatus: { fontWeight: 'bold', fontSize: 12 },
  btnDeleteText: { color: '#E53935', fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnCancelText: { color: colors.textBody, fontWeight: 'bold' },
});