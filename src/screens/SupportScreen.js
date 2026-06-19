import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking, LayoutAnimation, Alert,
} from 'react-native';
import { colors, commonStyles } from '../theme';
import { faqs } from '../data/faqs';

export default function SupportScreen({ navigation }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaq(openFaq === index ? null : index);
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
        <Text style={commonStyles.headerSubtitle}>Ajuda e suporte</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Como podemos ajudar?</Text>
        <View style={commonStyles.divider} />

        <Text style={commonStyles.sectionTitle}>Fale conosco</Text>

        {[
          { label: 'Chat de suporte', action: () => Alert.alert('Em breve', 'Chat disponível em breve.') },
          { label: 'E-mail: suporte@tasklink.com.br', action: () => Linking.openURL('mailto:suporte@tasklink.com.br') },
          { label: 'WhatsApp', action: () => Linking.openURL('https://wa.me/5511999999999') },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={commonStyles.contentCard} onPress={item.action}>
            <Text style={styles.contactText}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={commonStyles.sectionTitle}>Perguntas frequentes</Text>

        {faqs.map((faq, index) => (
          <TouchableOpacity key={index} style={commonStyles.contentCard} onPress={() => toggleFaq(index)}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqChevron}>{openFaq === index ? '▲' : '▼'}</Text>
            </View>
            {openFaq === index && <Text style={styles.faqAnswer}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}

        <Text style={commonStyles.sectionTitle}>Sobre o TaskLink</Text>
        <View style={commonStyles.contentCard}>
          <Text style={styles.aboutItem}>Versão: 1.0.0</Text>
          <Text style={styles.aboutItem}>Desenvolvedor: TaskLink Startup</Text>
          <Text style={styles.aboutItem}>Plataforma: Android / iOS</Text>
        </View>
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
  contactText: { color: colors.gold, fontWeight: 'bold', fontSize: 14 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontWeight: 'bold', color: colors.textDark, fontSize: 14, flex: 1, marginRight: 8 },
  faqChevron: { color: colors.gold, fontSize: 12 },
  faqAnswer: { color: colors.textBody, fontSize: 13, marginTop: 8, lineHeight: 20 },
  aboutItem: { color: colors.textBody, fontSize: 14, marginBottom: 4 },
});
