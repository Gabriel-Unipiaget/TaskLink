import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { colors, commonStyles } from '../theme';
import { createAvaliacao } from '../services/firestoreService';

const StarRating = ({ rating, onRate }) => (
  <View style={styles.stars}>
    {[1, 2, 3, 4, 5].map(star => (
      <TouchableOpacity key={star} onPress={() => onRate(star)}>
        <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const ratingLabel = (r) => {
  if (r === 1) return 'Muito ruim';
  if (r === 2) return 'Ruim';
  if (r === 3) return 'Regular';
  if (r === 4) return 'Bom';
  if (r === 5) return 'Excelente!';
  return 'Toque nas estrelas para avaliar';
};

export default function AvaliarScreen({ navigation, route }) {
  const { agendamentoId, clinicaId, nomeClinica } = route.params;
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Atenção', 'Selecione uma nota de 1 a 5 estrelas.');
      return;
    }
    setSaving(true);
    try {
      await createAvaliacao({ clinicaId, nomeClinica, agendamentoId, rating, comentario });
      Alert.alert('Obrigado!', 'Sua avaliação foi enviada com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a avaliação.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[commonStyles.header, { alignItems: 'flex-start' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Avaliar clínica</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Como foi sua experiência?</Text>
        <View style={commonStyles.divider} />

        <View style={commonStyles.contentCard}>
          <Text style={styles.clinicaNome}>{nomeClinica}</Text>
          <Text style={commonStyles.sectionTitle}>Sua nota</Text>
          <StarRating rating={rating} onRate={setRating} />
          <Text style={styles.ratingLabel}>{ratingLabel(rating)}</Text>
        </View>

        <Text style={commonStyles.sectionTitle}>Comentário (opcional)</Text>
        <TextInput
          style={[commonStyles.input, styles.textArea]}
          placeholder="Conte como foi sua experiência..."
          placeholderTextColor={colors.textLight}
          value={comentario}
          onChangeText={setComentario}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[commonStyles.btnPrimary, rating === 0 && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={saving || rating === 0}
        >
          {saving
            ? <ActivityIndicator color={colors.primary} />
            : <Text style={commonStyles.btnPrimaryText}>Enviar avaliação</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  backBtn: { marginBottom: 12 },
  backText: { color: colors.gold, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  clinicaNome: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 4 },
  stars: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  star: { fontSize: 40, color: '#ddd' },
  starActive: { color: colors.gold },
  ratingLabel: { color: colors.textBody, fontSize: 13 },
  textArea: { height: 100 },
  btnDisabled: { opacity: 0.5 },
});
