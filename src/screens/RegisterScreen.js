import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { registerWithEmail } from '../services/authService';
import firestore from '@react-native-firebase/firestore';
import { colors, commonStyles } from '../theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert('Atenção', 'Preencha todos os campos.'); return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres.'); return;
    }
    if (password !== confirm) {
      Alert.alert('Atenção', 'As senhas não conferem.'); return;
    }
    setLoading(true);
    try {
      const { user } = await registerWithEmail(email, password);
      await user.updateProfile({ displayName: name });
      await firestore().collection('usuarios').doc(user.uid).set({
        name,
        email,
        role,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      navigation.replace('Main');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Erro', 'Este e-mail já está cadastrado.');
      } else {
        Alert.alert('Erro', 'Não foi possível criar a conta.');
      }
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Crie sua conta</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Cadastro</Text>
        <View style={commonStyles.divider} />

        <Text style={commonStyles.sectionTitle}>Você é</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'client' && styles.roleBtnSelected]}
            onPress={() => setRole('client')}
          >
            <Text style={[styles.roleBtnText, role === 'client' && styles.roleBtnTextSelected]}>
              👤 Cliente
            </Text>
            <Text style={[styles.roleDesc, role === 'client' && styles.roleBtnTextSelected]}>
              Quero agendar serviços
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'owner' && styles.roleBtnSelected]}
            onPress={() => setRole('owner')}
          >
            <Text style={[styles.roleBtnText, role === 'owner' && styles.roleBtnTextSelected]}>
              🏪 Estabelecimento
            </Text>
            <Text style={[styles.roleDesc, role === 'owner' && styles.roleBtnTextSelected]}>
              Quero gerenciar minha clínica
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={commonStyles.sectionTitle}>Nome completo</Text>
        <TextInput style={commonStyles.input} placeholder="Seu nome" placeholderTextColor={colors.textLight} value={name} onChangeText={setName} />

        <Text style={commonStyles.sectionTitle}>E-mail</Text>
        <TextInput style={commonStyles.input} placeholder="seu@email.com" placeholderTextColor={colors.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={commonStyles.sectionTitle}>Senha</Text>
        <TextInput style={commonStyles.input} placeholder="Mínimo 6 caracteres" placeholderTextColor={colors.textLight} value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={commonStyles.sectionTitle}>Confirmar senha</Text>
        <TextInput style={commonStyles.input} placeholder="Repita a senha" placeholderTextColor={colors.textLight} value={confirm} onChangeText={setConfirm} secureTextEntry />

        <TouchableOpacity style={commonStyles.btnPrimary} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={commonStyles.btnPrimaryText}>Criar conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Já tem conta? <Text style={styles.linkBold}>Faça login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#ddd',
    borderRadius: 12, padding: 12, alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleBtnSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  roleBtnText: { fontWeight: 'bold', color: colors.textDark, fontSize: 13 },
  roleBtnTextSelected: { color: colors.primary },
  roleDesc: { fontSize: 11, color: colors.textBody, marginTop: 4, textAlign: 'center' },
  link: { textAlign: 'center', color: colors.textBody, marginBottom: 20 },
  linkBold: { color: colors.gold, fontWeight: 'bold' },
});