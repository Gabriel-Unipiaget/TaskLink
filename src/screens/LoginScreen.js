import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { loginWithEmail, loginWithGoogle } from '../services/authService';
import { colors, commonStyles } from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Atenção', 'Preencha e-mail e senha.'); return; }
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigation.replace('Home');
    } catch {
      Alert.alert('Erro', 'E-mail ou senha incorretos.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigation.replace('Home');
    } catch {
      Alert.alert('Erro', 'Não foi possível entrar com Google.');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Acesse sua conta</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Bem-vindo de volta</Text>
        <View style={commonStyles.divider} />

        <Text style={commonStyles.sectionTitle}>E-mail</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="seu@email.com"
          placeholderTextColor={colors.textLight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={commonStyles.sectionTitle}>Senha</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgot}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={commonStyles.btnPrimary} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={commonStyles.btnPrimaryText}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGoogle} onPress={handleGoogle} disabled={loading}>
          <Text style={styles.btnGoogleText}>Entrar com Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Não tem conta? <Text style={styles.linkBold}>Cadastre-se</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  forgot: { color: colors.gold, textAlign: 'right', marginBottom: 20, fontWeight: 'bold' },
  btnGoogle: {
    borderWidth: 1.5, borderColor: colors.gold, borderRadius: 12,
    padding: 16, alignItems: 'center', marginBottom: 24,
  },
  btnGoogleText: { color: colors.gold, fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', color: colors.textBody },
  linkBold: { color: colors.gold, fontWeight: 'bold' },
});