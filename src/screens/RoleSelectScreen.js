import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { colors, commonStyles } from '../theme';

export default function RoleSelectScreen({ navigation }) {
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const user = auth().currentUser;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await firestore().collection('usuarios').doc(user.uid).set({
        name: user.displayName,
        email: user.email,
        role,
        createdAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      navigation.replace('Main');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar seu perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Bem-vindo, {user?.displayName?.split(' ')[0]}!</Text>
      </View>

      <View style={commonStyles.card}>
        <Text style={styles.title}>Como você vai usar o TaskLink?</Text>
        <View style={commonStyles.divider} />
        <Text style={styles.subtitle}>Escolha seu perfil para continuar</Text>

        <TouchableOpacity
          style={[styles.roleCard, role === 'client' && styles.roleCardSelected]}
          onPress={() => setRole('client')}
        >
          <Text style={styles.roleIcon}>👤</Text>
          <Text style={[styles.roleTitle, role === 'client' && styles.roleTitleSelected]}>Cliente</Text>
          <Text style={[styles.roleDesc, role === 'client' && styles.roleDescSelected]}>
            Quero buscar clínicas e agendar serviços
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, role === 'owner' && styles.roleCardSelected]}
          onPress={() => setRole('owner')}
        >
          <Text style={styles.roleIcon}>🏪</Text>
          <Text style={[styles.roleTitle, role === 'owner' && styles.roleTitleSelected]}>Estabelecimento</Text>
          <Text style={[styles.roleDesc, role === 'owner' && styles.roleDescSelected]}>
            Quero cadastrar minha clínica e gerenciar agendamentos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.btnPrimary, { marginTop: 24 }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.primary} />
            : <Text style={commonStyles.btnPrimaryText}>Confirmar e entrar</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  subtitle: { color: colors.textBody, fontSize: 14, marginBottom: 20 },
  roleCard: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 16,
    padding: 20, marginBottom: 14, backgroundColor: '#fff',
    alignItems: 'center',
  },
  roleCardSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  roleIcon: { fontSize: 36, marginBottom: 8 },
  roleTitle: { fontSize: 17, fontWeight: 'bold', color: colors.textDark, marginBottom: 4 },
  roleTitleSelected: { color: colors.primary },
  roleDesc: { fontSize: 13, color: colors.textBody, textAlign: 'center' },
  roleDescSelected: { color: colors.primary },
});