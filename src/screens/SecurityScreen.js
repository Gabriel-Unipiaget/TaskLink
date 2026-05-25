import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { colors, commonStyles } from '../theme';

export default function SecurityScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha todos os campos.'); return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter no mínimo 6 caracteres.'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não conferem.'); return;
    }
    setLoading(true);
    try {
      const user = auth().currentUser;
      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
      Alert.alert('Sucesso', 'Senha alterada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Erro', 'Senha atual incorreta.');
      } else {
        Alert.alert('Erro', 'Não foi possível alterar a senha.');
      }
    } finally { setLoading(false); }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Tem certeza? Todos os seus dados serão removidos permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              await auth().currentUser.delete();
              navigation.replace('Login');
            } catch {
              Alert.alert('Erro', 'Faça login novamente para excluir a conta.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[commonStyles.header, styles.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Segurança e acesso</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Alterar senha</Text>
        <View style={commonStyles.divider} />

        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Política de senha</Text>
          <Text style={styles.policyItem}>• Mínimo de 6 caracteres</Text>
          <Text style={styles.policyItem}>• Use letras e números para maior segurança</Text>
          <Text style={styles.policyItem}>• Não reutilize senhas antigas</Text>
        </View>

        <Text style={commonStyles.sectionTitle}>Senha atual</Text>
        <TextInput style={commonStyles.input} placeholder="••••••••" placeholderTextColor={colors.textLight} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />

        <Text style={commonStyles.sectionTitle}>Nova senha</Text>
        <TextInput style={commonStyles.input} placeholder="••••••••" placeholderTextColor={colors.textLight} value={newPassword} onChangeText={setNewPassword} secureTextEntry />

        <Text style={commonStyles.sectionTitle}>Confirmar nova senha</Text>
        <TextInput style={commonStyles.input} placeholder="••••••••" placeholderTextColor={colors.textLight} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        <TouchableOpacity style={commonStyles.btnPrimary} onPress={handleChangePassword} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={commonStyles.btnPrimaryText}>Alterar senha</Text>}
        </TouchableOpacity>

        <View style={styles.dividerSection} />

        <Text style={commonStyles.sectionTitle}>Zona de perigo</Text>
        <TouchableOpacity style={styles.btnDelete} onPress={handleDeleteAccount}>
          <Text style={styles.btnDeleteText}>Excluir minha conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { alignItems: 'flex-start' },
  back: { marginBottom: 12 },
  backText: { color: colors.gold, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  policyCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 16, borderLeftWidth: 4, borderLeftColor: colors.gold,
  },
  policyTitle: { fontWeight: 'bold', color: colors.textDark, marginBottom: 6 },
  policyItem: { color: colors.textBody, fontSize: 13, marginBottom: 3 },
  dividerSection: { height: 1, backgroundColor: '#ddd', marginVertical: 20 },
  btnDelete: {
    borderWidth: 1.5, borderColor: '#E53935', borderRadius: 12,
    padding: 14, alignItems: 'center', marginBottom: 10,
  },
  btnDeleteText: { color: '#E53935', fontWeight: 'bold', fontSize: 15 },
});