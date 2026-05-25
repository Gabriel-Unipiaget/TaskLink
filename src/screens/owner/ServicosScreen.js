import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import {
  getMinhasClinicas, getServicosByClinica,
  createServico, updateServico, deleteServico,
} from '../../services/firestoreService';
import { colors, commonStyles } from '../../theme';

const emptyForm = { nome: '', descricao: '', preco: '', duracao: '' };

export default function ServicosScreen() {
  const [clinicas, setClinicas] = useState([]);
  const [clinicaSelecionada, setClinicaSelecionada] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMinhasClinicas().then(data => {
      setClinicas(data);
      if (data.length > 0) {
        setClinicaSelecionada(data[0]);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (clinicaSelecionada) loadServicos();
  }, [clinicaSelecionada]);

  const loadServicos = async () => {
    const data = await getServicosByClinica(clinicaSelecionada.id);
    setServicos(data);
  };

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalVisible(true); };
  const openEdit = (s) => {
    setForm({ nome: s.nome, descricao: s.descricao, preco: String(s.preco), duracao: String(s.duracao) });
    setEditingId(s.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.preco) { Alert.alert('Atenção', 'Nome e preço são obrigatórios.'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        preco: parseFloat(form.preco),
        duracao: parseInt(form.duracao) || 60,
        clinicaId: clinicaSelecionada.id,
        nomeClinica: clinicaSelecionada.nome,
      };
      if (editingId) {
        await updateServico(editingId, data);
      } else {
        await createServico(data);
      }
      setModalVisible(false);
      loadServicos();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Excluir', 'Deseja excluir este serviço?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteServico(id); loadServicos(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Serviços</Text>
      </View>

      <View style={commonStyles.card}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Serviços</Text>
          {clinicaSelecionada && (
            <TouchableOpacity style={styles.btnAdd} onPress={openCreate}>
              <Text style={styles.btnAddText}>+ Novo</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={commonStyles.divider} />

        {loading ? <ActivityIndicator color={colors.gold} /> : (
          <>
            <Text style={commonStyles.sectionTitle}>Clínica</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {clinicas.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.clinicaChip, clinicaSelecionada?.id === c.id && styles.clinicaChipSelected]}
                  onPress={() => setClinicaSelecionada(c)}
                >
                  <Text style={[styles.clinicaChipText, clinicaSelecionada?.id === c.id && styles.clinicaChipTextSelected]}>
                    {c.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView showsVerticalScrollIndicator={false}>
              {servicos.length === 0 ? (
                <View style={commonStyles.contentCard}>
                  <Text style={styles.emptyText}>Nenhum serviço cadastrado.</Text>
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
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.btnEdit} onPress={() => openEdit(s)}>
                        <Text style={styles.btnEditText}>✎ Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(s.id)}>
                        <Text style={styles.btnDeleteText}>🗑 Excluir</Text>
                      </TouchableOpacity>
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
            <Text style={styles.modalTitle}>{editingId ? 'Editar serviço' : 'Novo serviço'}</Text>
            <View style={commonStyles.divider} />
            {[
              { label: 'Nome *', key: 'nome', placeholder: 'Ex: Corte de cabelo' },
              { label: 'Preço (R$) *', key: 'preco', placeholder: '0.00', keyboard: 'decimal-pad' },
              { label: 'Duração (minutos)', key: 'duracao', placeholder: '60', keyboard: 'numeric' },
              { label: 'Descrição', key: 'descricao', placeholder: 'Detalhes do serviço' },
            ].map(field => (
              <View key={field.key}>
                <Text style={commonStyles.sectionTitle}>{field.label}</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textLight}
                  value={form[field.key]}
                  onChangeText={v => setForm(f => ({ ...f, [field.key]: v }))}
                  keyboardType={field.keyboard || 'default'}
                />
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
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
  clinicaChip: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: '#fff' },
  clinicaChipSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  clinicaChipText: { color: colors.textBody, fontWeight: 'bold', fontSize: 13 },
  clinicaChipTextSelected: { color: colors.primary },
  emptyText: { color: colors.textBody, textAlign: 'center' },
  servicoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  servicoNome: { fontWeight: 'bold', color: colors.textDark, fontSize: 15 },
  servicoPreco: { color: colors.gold, fontWeight: 'bold', fontSize: 15 },
  servicoDesc: { color: colors.textBody, fontSize: 13, marginTop: 4 },
  servicoDuracao: { color: '#999', fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btnEdit: { borderWidth: 1.5, borderColor: colors.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnEditText: { color: colors.gold, fontWeight: 'bold', fontSize: 12 },
  btnDelete: { borderWidth: 1.5, borderColor: '#E53935', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnDeleteText: { color: '#E53935', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnCancelText: { color: colors.textBody, fontWeight: 'bold' },
});