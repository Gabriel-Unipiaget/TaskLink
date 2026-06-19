import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { onConversasSnapshot } from '../services/firestoreService';
import { colors, commonStyles } from '../theme';

export default function ConversasScreen({ navigation }) {
  const uid = auth().currentUser?.uid;
  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onConversasSnapshot((data) => {
      setConversas(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getNomeParceiro = (conversa) =>
    conversa.clienteId === uid ? conversa.nomeOwner : conversa.nomeCliente;

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Mensagens</Text>
      </View>

      <View style={commonStyles.card}>
        <Text style={styles.title}>Conversas</Text>
        <View style={commonStyles.divider} />

        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} />
        ) : conversas.length === 0 ? (
          <View style={commonStyles.contentCard}>
            <Text style={styles.emptyText}>Nenhuma conversa ainda.</Text>
            <Text style={styles.emptyHint}>
              Inicie uma conversa a partir de um agendamento.
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversas}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const parceiro = getNomeParceiro(item);
              return (
                <TouchableOpacity
                  style={commonStyles.contentCard}
                  onPress={() => navigation.navigate('Chat', {
                    conversaId: item.id,
                    nomeParceiro: parceiro,
                    nomeClinica: item.nomeClinica,
                  })}
                >
                  <View style={styles.row}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {parceiro?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nomeParceiro}>{parceiro}</Text>
                      <Text style={styles.nomeClinica}>{item.nomeClinica}</Text>
                      {!!item.lastMessage && (
                        <Text style={styles.lastMessage} numberOfLines={1}>
                          {item.lastMessage}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  emptyText: { color: colors.textBody, textAlign: 'center', fontWeight: 'bold' },
  emptyHint: { color: '#999', textAlign: 'center', fontSize: 13, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
  nomeParceiro: { fontWeight: 'bold', color: colors.textDark, fontSize: 15 },
  nomeClinica: { color: colors.textBody, fontSize: 12, marginTop: 2 },
  lastMessage: { color: '#999', fontSize: 13, marginTop: 4 },
  arrow: { fontSize: 24, color: colors.gold, fontWeight: 'bold' },
});
