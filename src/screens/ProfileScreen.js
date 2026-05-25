import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Image,
  PermissionsAndroid, Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { colors, commonStyles } from '../theme';
import { logout } from '../services/authService';

export default function ProfileScreen({ navigation }) {
  const user = auth().currentUser;
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const doc = await firestore().collection('usuarios').doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data();
        setPhone(data.phone || '');
        setPhotoBase64(data.photoBase64 || null);
      }
    } catch (error) {
      console.log(error);
    }
  };

const handleLogout = () => {
  Alert.alert('Sair', 'Deseja sair da sua conta?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Sair', style: 'destructive',
      onPress: async () => {
        await logout();
        navigation.getParent()?.dispatch(
          require('@react-navigation/native').CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      },
    },
  ]);
};

  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  };

  const handlePickPhoto = async () => {
    if (!editing) return;
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria.');
      return;
    }

    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.5 });
    if (result.didCancel || !result.assets) return;

    setUploading(true);
    try {
      const image = result.assets[0];
      const base64 = await RNFS.readFile(image.uri, 'base64');
      const base64Image = `data:image/jpeg;base64,${base64}`;

      await firestore().collection('usuarios').doc(user.uid).set(
        { photoBase64: base64Image },
        { merge: true }
      );

      setPhotoBase64(base64Image);
      Alert.alert('Sucesso', 'Foto atualizada!');
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível salvar a foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Atenção', 'O nome não pode ficar vazio.'); return; }
    setLoading(true);
    try {
      await user.updateProfile({ displayName: name });
      await firestore().collection('usuarios').doc(user.uid).set(
        { name, phone },
        { merge: true }
      );
      Alert.alert('Sucesso', 'Perfil atualizado!');
      setEditing(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.displayName || '');
    loadProfile();
    setEditing(false);
  };

  const photoSource = photoBase64 ? { uri: photoBase64 } : null;

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarContainer}>
          {uploading ? (
            <ActivityIndicator color={colors.gold} size="large" />
          ) : photoSource ? (
            <Image source={photoSource} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {editing && (
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>✎</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.displayName || 'Meu Perfil'}</Text>
        <Text style={commonStyles.headerSubtitle}>{user?.email}</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Meus dados</Text>
          {!editing && (
            <TouchableOpacity style={styles.btnEdit} onPress={() => setEditing(true)}>
              <Text style={styles.btnEditText}>✎ Editar</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={commonStyles.divider} />

        <Text style={commonStyles.sectionTitle}>Nome</Text>
        <TextInput
          style={[commonStyles.input, !editing && styles.inputReadOnly]}
          value={name}
          onChangeText={setName}
          placeholder="Seu nome completo"
          placeholderTextColor={colors.textLight}
          editable={editing}
        />

        <Text style={commonStyles.sectionTitle}>E-mail</Text>
        <TextInput
          style={[commonStyles.input, styles.inputDisabled]}
          value={user?.email}
          editable={false}
        />

        <Text style={commonStyles.sectionTitle}>Telefone</Text>
        <TextInput
          style={[commonStyles.input, !editing && styles.inputReadOnly]}
          value={phone}
          onChangeText={setPhone}
          placeholder="(00) 00000-0000"
          placeholderTextColor={colors.textLight}
          keyboardType="phone-pad"
          editable={editing}
        />

        {editing && (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={handleCancel}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.btnPrimary, styles.btnSave]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={colors.primary} />
                : <Text style={commonStyles.btnPrimaryText}>Salvar</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.dividerSection} />

        <Text style={commonStyles.sectionTitle}>Configurações</Text>

        {[
          { label: 'Segurança e acesso', screen: 'Security' },
          { label: 'Notificações', screen: 'Notifications' },
          { label: 'Ajuda e suporte', screen: 'Support' },
          { label: 'Privacidade e LGPD', screen: 'Privacy' },
        ].map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuItemText}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Text style={styles.btnLogoutText}>Sair da conta</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  avatarContainer: { marginBottom: 12, position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.gold },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, fontWeight: 'bold', color: colors.primary },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: colors.gold, borderRadius: 12,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  avatarBadgeText: { color: colors.primary, fontSize: 12 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark },
  btnEdit: {
    borderWidth: 1.5, borderColor: colors.gold,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6,
  },
  btnEditText: { color: colors.gold, fontWeight: 'bold', fontSize: 13 },
  inputReadOnly: { borderColor: '#ddd', backgroundColor: '#fafafa', color: '#888' },
  inputDisabled: { backgroundColor: '#f5f5f5', color: '#aaa', borderColor: '#ddd' },
  editActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  btnCancel: {
    flex: 1, borderWidth: 1.5, borderColor: '#ddd',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  btnCancelText: { color: colors.textBody, fontWeight: 'bold' },
  btnSave: { flex: 1, marginBottom: 0 },
  dividerSection: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 20 },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1,
  },
  menuItemText: { fontSize: 15, color: colors.textDark, fontWeight: '500' },
  menuArrow: { fontSize: 22, color: colors.gold, fontWeight: 'bold' },
  btnLogout: {
    borderWidth: 1.5, borderColor: '#E53935', borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 32,
  },
  btnLogoutText: { color: '#E53935', fontWeight: 'bold', fontSize: 15 },
});