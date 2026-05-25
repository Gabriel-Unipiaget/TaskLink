import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { colors, commonStyles } from '../../theme';
import { onMinhasClinicasSnapshot, createClinica, updateClinica, deleteClinica } from '../../services/firestoreService';

const emptyForm = { nome: '', descricao: '', endereco: '', telefone: '' };

export default function ClinicasScreen() {
  const [clinicas, setClinicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Troca o useEffect e remove a função load
useEffect(() => {
  setLoading(true);
  const unsubscribe = onMinhasClinicasSnapshot((data) => {
    setClinicas(data);
    setLoading(false);
  });
  return () => unsubscribe(); // limpa o listener ao sair da tela
}, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMinhasClinicas();
      setClinicas(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalVisible(true); };
  const openEdit = (c) => { setForm({ nome: c.nome, descricao: c.descricao, endereco: c.endereco, telefone: c.telefone }); setEditingId(c.id); setModalVisible(true); };

 const handleSave = async () => {
  if (!form.nome || !form.endereco) { Alert.alert('Atenção', 'Nome e endereço são obrigatórios.'); return; }
  setSaving(true);
  try {
    if (editingId) {
      await updateClinica(editingId, form);
    } else {
      await createClinica(form);
    }
    setModalVisible(false);
    // removeu o load() daqui
  } catch {
    Alert.alert('Erro', 'Não foi possível salvar.');
  } finally { setSaving(false); }
};

const handleDelete = (id) => {
  Alert.alert('Excluir', 'Deseja excluir esta clínica?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: async () => {
      await deleteClinica(id);
      // removeu o load() daqui
    }},
  ]);
};

  const filtered = clinicas.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.endereco.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Minhas clínicas</Text>
      </View>

      <View style={commonStyles.card}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Clínicas</Text>
          <TouchableOpacity style={styles.btnAdd} onPress={openCreate}>
            <Text style={styles.btnAddText}>+ Nova</Text>
          </TouchableOpacity>
        </View>
        <View style={commonStyles.divider} />

        <TextInput
          style={[commonStyles.input, { marginBottom: 12 }]}
          placeholder="Buscar clínica..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          {loading ? <ActivityIndicator color={colors.gold} /> : filtered.length === 0 ? (
            <View style={commonStyles.contentCard}>
              <Text style={styles.emptyText}>Nenhuma clínica encontrada.</Text>
            </View>
          ) : (
            filtered.map(c => (
              <View key={c.id} style={commonStyles.contentCard}>
                <Text style={styles.clinicaNome}>{c.nome}</Text>
                <Text style={styles.clinicaInfo}>{c.endereco}</Text>
                {c.telefone ? <Text style={styles.clinicaInfo}>📞 {c.telefone}</Text> : null}
                {c.descricao ? <Text style={styles.clinicaDesc}>{c.descricao}</Text> : null}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.btnEdit} onPress={() => openEdit(c)}>
                    <Text style={styles.btnEditText}>✎ Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(c.id)}>
                    <Text style={styles.btnDeleteText}>🗑 Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar clínica' : 'Nova clínica'}</Text>
            <View style={commonStyles.divider} />

            {[
              { label: 'Nome *', key: 'nome', placeholder: 'Nome da clínica' },
              { label: 'Endereço *', key: 'endereco', placeholder: 'Rua, número, bairro' },
              { label: 'Telefone', key: 'telefone', placeholder: '(00) 00000-0000' },
              { label: 'Descrição', key: 'descricao', placeholder: 'Descreva sua clínica' },
            ].map(field => (
              <View key={field.key}>
                <Text style={commonStyles.sectionTitle}>{field.label}</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textLight}
                  value={form[field.key]}
                  onChangeText={v => setForm(f => ({ ...f, [field.key]: v }))}
                  multiline={field.key === 'descricao'}
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
  emptyText: { color: colors.textBody, textAlign: 'center' },
  clinicaNome: { fontWeight: 'bold', color: colors.textDark, fontSize: 15, marginBottom: 4 },
  clinicaInfo: { color: colors.textBody, fontSize: 13, marginBottom: 2 },
  clinicaDesc: { color: '#999', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btnEdit: { borderWidth: 1.5, borderColor: colors.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnEditText: { color: colors.gold, fontWeight: 'bold', fontSize: 12 },
  btnDelete: { borderWidth: 1.5, borderColor: '#E53935', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnDeleteText: { color: '#E53935', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnCancelText: { color: colors.textBody, fontWeight: 'bold' },
});