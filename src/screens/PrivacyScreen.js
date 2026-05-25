import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, commonStyles } from '../theme';

export default function PrivacyScreen({ navigation }) {
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
        <Text style={commonStyles.headerSubtitle}>Privacidade e LGPD</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Sua privacidade importa</Text>
        <View style={commonStyles.divider} />

        {[
          {
            titulo: 'Dados coletados',
            texto: 'Coletamos nome, e-mail, telefone e foto de perfil para personalizar sua experiência no TaskLink.',
          },
          {
            titulo: 'Como usamos seus dados',
            texto: 'Seus dados são utilizados exclusivamente para gerenciar agendamentos, enviar notificações e melhorar nossos serviços. Nunca vendemos seus dados a terceiros.',
          },
          {
            titulo: 'Seus direitos (LGPD)',
            texto: 'Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito de acessar, corrigir e excluir seus dados a qualquer momento.',
          },
          {
            titulo: 'Segurança',
            texto: 'Utilizamos criptografia e autenticação segura (Firebase Auth) para proteger suas informações.',
          },
          {
            titulo: 'Contato',
            texto: 'Para exercer seus direitos ou tirar dúvidas: privacidade@tasklink.com.br',
          },
        ].map((item) => (
          <View key={item.titulo} style={commonStyles.contentCard}>
            <Text style={styles.sectionHeader}>{item.titulo}</Text>
            <Text style={styles.sectionText}>{item.texto}</Text>
          </View>
        ))}
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
  sectionHeader: { fontWeight: 'bold', color: colors.textDark, fontSize: 15, marginBottom: 6 },
  sectionText: { color: colors.textBody, fontSize: 14, lineHeight: 21 },
});