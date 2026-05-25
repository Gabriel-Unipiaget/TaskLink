import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  StatusBar, ScrollView,
} from 'react-native';
import { forgotPassword } from '../services/authService';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Atenção', 'Digite seu e-mail.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert('Sucesso', 'E-mail de recuperação enviado!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'E-mail não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="light-content" backgroundColor="#1C3A2F" />

      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Text style={styles.logoTask}>Task</Text>
          <Text style={styles.logoLink}>Link</Text>
        </View>
        <Text style={styles.headerSub}>Recuperação de acesso</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recuperar{'\n'}Senha</Text>
        <Text style={styles.cardSubtitle}>
          Digite seu e-mail e enviaremos um link para redefinir sua senha.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleReset}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#1C3A2F" />
            : <Text style={styles.btnText}>Enviar e-mail</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>← Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#1C3A2F' },
  scrollContent: { flexGrow: 1 },

  header: {
    backgroundColor: '#1C3A2F',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 28,
  },
  logoWrapper: { flexDirection: 'row', marginBottom: 6 },
  logoTask: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  logoLink: { fontSize: 32, fontWeight: 'bold', color: '#C9962A' },
  headerSub: { fontSize: 15, color: '#A8C5B5' },

  card: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingTop: 36,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C3A2F',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 28,
    lineHeight: 20,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C9962A',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
  },

  btnPrimary: {
    backgroundColor: '#C9962A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnText: { color: '#1C3A2F', fontWeight: 'bold', fontSize: 16 },

  link: {
    textAlign: 'center',
    color: '#1C3A2F',
    fontSize: 14,
    fontWeight: '500',
  },
});