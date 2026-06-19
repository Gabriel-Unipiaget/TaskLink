import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal, Image,
  PermissionsAndroid, Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors, commonStyles } from '../../theme';
import {
  onMinhasClinicasSnapshot, createClinica, updateClinica, deleteClinica,
  onClinicaFotosSnapshot, uploadClinicaPhoto, deleteClinicaPhoto,
  onAvaliacoesByClinicaSnapshot,
} from '../../services/firestoreService';

const emptyForm = { nome: '', descricao: '', endereco: '', telefone: '' };

const StarDisplay = ({ rating }) => (
  <Text style={styles.stars}>
    {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
  </Text>
);

export default function ClinicasScreen() {
  const [clinicas, setClinicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Modal fotos
  const [modalFotos, setModalFotos] = useState(false);
  const [clinicaFotos, setClinicaFotos] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Modal avaliações
  const [modalAvaliacoes, setModalAvaliacoes] = useState(false);
  const [clinicaAvaliacoes, setClinicaAvaliacoes] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onMinhasClinicasSnapshot((data) => {
      setClinicas(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscrições dinâmicas para modal de fotos
  useEffect(() => {
    if (!clinicaFotos) return;
    const unsubscribe = onClinicaFotosSnapshot(clinicaFotos.id, setFotos);
    return () => unsubscribe();
  }, [clinicaFotos]);

  // Subscrições dinâmicas para modal de avaliações
  useEffect(() => {
    if (!clinicaAvaliacoes) return;
    const unsubscribe = onAvaliacoesByClinicaSnapshot(clinicaAvaliacoes.id, setAvaliacoes);
    return () => unsubscribe();
  }, [clinicaAvaliacoes]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalVisible(true); };
  const openEdit = (c) => {
    setForm({ nome: c.nome || '', descricao: c.descricao || '', endereco: c.endereco || '', telefone: c.telefone || '' });
    setEditingId(c.id);
    setModalVisible(true);
  };

  const openFotos = (c) => { setClinicaFotos(c); setFotos([]); setModalFotos(true); };
  const openAvaliacoes = (c) => { setClinicaAvaliacoes(c); setAvaliacoes([]); setModalAvaliacoes(true); };

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
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Excluir', 'Deseja excluir esta clínica?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteClinica(id); } },
    ]);
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleAddFoto = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) { Alert.alert('Permissão negada', 'Precisamos de acesso à galeria.'); return; }

    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.4 });
    if (result.didCancel || !result.assets) return;

    setUploadingFoto(true);
    try {
      await uploadClinicaPhoto(clinicaFotos.id, result.assets[0].uri);
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar a foto.');
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleDeleteFoto = (photoId) => {
    Alert.alert('Excluir foto', 'Deseja remover esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await deleteClinicaPhoto(clinicaFotos.id, photoId);
          } catch {
            Alert.alert('Erro', 'Não foi possível remover a foto.');
          }
        },
      },
    ]);
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

                {!!c.totalAvaliacoes && (
                  <View style={styles.ratingRow}>
                    <StarDisplay rating={c.ratingMedia || 0} />
                    <Text style={styles.ratingText}>
                      {Number(c.ratingMedia).toFixed(1)} ({c.totalAvaliacoes} avaliações)
                    </Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.btnEdit} onPress={() => openEdit(c)}>
                    <Text style={styles.btnEditText}>✎ Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnFotos} onPress={() => openFotos(c)}>
                    <Text style={styles.btnFotosText}>📷 Fotos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnReviews} onPress={() => openAvaliacoes(c)}>
                    <Text style={styles.btnReviewsText}>⭐ Avaliações</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(c.id)}>
                    <Text style={styles.btnDeleteText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Modal criar/editar clínica */}
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

      {/* Modal fotos */}
      <Modal visible={modalFotos} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Fotos — {clinicaFotos?.nome}</Text>
            <View style={commonStyles.divider} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {fotos.length === 0 ? (
                <View style={commonStyles.contentCard}>
                  <Text style={styles.emptyText}>Nenhuma foto ainda.</Text>
                </View>
              ) : (
                <View style={styles.fotosGrid}>
                  {fotos.map(f => (
                    <View key={f.id} style={styles.fotoContainer}>
                      <Image source={{ uri: f.base64 }} style={styles.fotoImg} />
                      <TouchableOpacity
                        style={styles.fotoDeleteBtn}
                        onPress={() => handleDeleteFoto(f.id)}
                      >
                        <Text style={styles.fotoDeleteText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalFotos(false)}>
                <Text style={styles.btnCancelText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.btnPrimary, { flex: 1, marginBottom: 0 }]}
                onPress={handleAddFoto}
                disabled={uploadingFoto}
              >
                {uploadingFoto
                  ? <ActivityIndicator color={colors.primary} />
                  : <Text style={commonStyles.btnPrimaryText}>+ Adicionar foto</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal avaliações */}
      <Modal visible={modalAvaliacoes} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Avaliações — {clinicaAvaliacoes?.nome}</Text>
            {!!clinicaAvaliacoes?.totalAvaliacoes && (
              <Text style={styles.avaliacaoMedia}>
                Média: {Number(clinicaAvaliacoes.ratingMedia).toFixed(1)} ⭐ ({clinicaAvaliacoes.totalAvaliacoes} avaliações)
              </Text>
            )}
            <View style={commonStyles.divider} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {avaliacoes.length === 0 ? (
                <View style={commonStyles.contentCard}>
                  <Text style={styles.emptyText}>Nenhuma avaliação ainda.</Text>
                </View>
              ) : (
                avaliacoes.map(a => (
                  <View key={a.id} style={commonStyles.contentCard}>
                    <View style={styles.avaliacaoHeader}>
                      <Text style={styles.avaliacaoCliente}>{a.nomeCliente}</Text>
                      <Text style={styles.avaliacaoStars}>{'★'.repeat(a.rating)}{'☆'.repeat(5 - a.rating)}</Text>
                    </View>
                    {!!a.comentario && <Text style={styles.avaliacaoComentario}>{a.comentario}</Text>}
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={[commonStyles.btnPrimary, { marginTop: 8 }]}
              onPress={() => setModalAvaliacoes(false)}
            >
              <Text style={commonStyles.btnPrimaryText}>Fechar</Text>
            </TouchableOpacity>
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
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  stars: { color: colors.gold, fontSize: 13 },
  ratingText: { color: colors.textBody, fontSize: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  btnEdit: { borderWidth: 1.5, borderColor: colors.gold, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  btnEditText: { color: colors.gold, fontWeight: 'bold', fontSize: 12 },
  btnFotos: { borderWidth: 1.5, borderColor: '#555', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  btnFotosText: { color: '#555', fontWeight: 'bold', fontSize: 12 },
  btnReviews: { borderWidth: 1.5, borderColor: '#C9962A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  btnReviewsText: { color: '#C9962A', fontWeight: 'bold', fontSize: 12 },
  btnDelete: { borderWidth: 1.5, borderColor: '#E53935', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  btnDeleteText: { color: '#E53935', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnCancel: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnCancelText: { color: colors.textBody, fontWeight: 'bold' },
  fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  fotoContainer: { position: 'relative' },
  fotoImg: { width: 100, height: 80, borderRadius: 10 },
  fotoDeleteBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#E53935', borderRadius: 10,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  fotoDeleteText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  avaliacaoMedia: { color: colors.textBody, fontSize: 13, marginTop: 4 },
  avaliacaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  avaliacaoCliente: { fontWeight: 'bold', color: colors.textDark, fontSize: 14 },
  avaliacaoStars: { color: colors.gold, fontSize: 14 },
  avaliacaoComentario: { color: colors.textBody, fontSize: 13, marginTop: 4 },
});
