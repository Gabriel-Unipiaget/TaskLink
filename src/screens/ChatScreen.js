import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { onMensagensSnapshot, sendMessage } from '../services/firestoreService';
import { colors, commonStyles } from '../theme';

export default function ChatScreen({ navigation, route }) {
  const { conversaId, nomeParceiro, nomeClinica } = route.params;
  const uid = auth().currentUser?.uid;
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onMensagensSnapshot(conversaId, (data) => {
      setMensagens(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [conversaId]);

  const handleSend = async () => {
    const msg = texto.trim();
    if (!msg) return;
    setTexto('');
    setSending(true);
    try {
      await sendMessage(conversaId, { senderId: uid, texto: msg });
    } finally {
      setSending(false);
    }
  };

  const renderMensagem = ({ item }) => {
    const isMine = item.senderId === uid;
    return (
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMine ? styles.textMine : styles.textOther]}>
          {item.texto}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[commonStyles.header, { alignItems: 'flex-start' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerName}>{nomeParceiro}</Text>
        <Text style={commonStyles.headerSubtitle}>{nomeClinica}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.gold} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={mensagens}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={{ padding: 16, paddingBottom: 8, flexGrow: 1 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Nenhuma mensagem ainda.</Text>
                <Text style={styles.emptyHint}>Seja o primeiro a enviar!</Text>
              </View>
            }
            renderItem={renderMensagem}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={colors.textLight}
            value={texto}
            onChangeText={setTexto}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !texto.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!texto.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color={colors.primary} size="small" />
              : <Text style={styles.sendIcon}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  backBtn: { marginBottom: 12 },
  backText: { color: colors.gold, fontWeight: 'bold' },
  headerName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' },
  list: { flex: 1, backgroundColor: '#F0F0F0' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.textBody, fontWeight: 'bold' },
  emptyHint: { color: '#999', fontSize: 13, marginTop: 4 },
  bubble: {
    maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 8,
  },
  bubbleMine: {
    backgroundColor: colors.gold,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  textMine: { color: colors.primary },
  textOther: { color: colors.textDark },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  input: {
    flex: 1, backgroundColor: '#F0F0F0', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: colors.textDark, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
});
