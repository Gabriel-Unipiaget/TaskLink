import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import RNFS from 'react-native-fs';

// ─── USUÁRIO ─────────────────────────────────────────────────────────────────

export const getUserData = async () => {
  const uid = auth().currentUser?.uid;
  if (!uid) return null;
  const doc = await firestore().collection('usuarios').doc(uid).get();
  return doc.exists ? doc.data() : null;
};

export const getUserById = async (uid) => {
  if (!uid) return null;
  const doc = await firestore().collection('usuarios').doc(uid).get();
  return doc.exists ? { id: uid, ...doc.data() } : null;
};

export const updateUserRole = async (role) => {
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  await firestore().collection('usuarios').doc(uid).update({ role });
};

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────

export const getNotificationPreferences = async () => {
  const uid = auth().currentUser?.uid;
  if (!uid) return { app: true, email: false, whatsapp: false };
  const doc = await firestore().collection('usuarios').doc(uid).get();
  return doc.exists
    ? (doc.data()?.notificacoes || { app: true, email: false, whatsapp: false })
    : { app: true, email: false, whatsapp: false };
};

export const updateNotificationPreferences = async (prefs) => {
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  await firestore().collection('usuarios').doc(uid).update({ notificacoes: prefs });
};

// ─── CLÍNICAS ─────────────────────────────────────────────────────────────────

export const createClinica = async (data) => {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');
  return firestore().collection('clinicas').add({
    ...data,
    ownerId: uid,
    fotos: [],
    ratingMedia: 0,
    totalAvaliacoes: 0,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getClinica = async (clinicaId) => {
  if (!clinicaId) return null;
  const doc = await firestore().collection('clinicas').doc(clinicaId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const getMinhasClinicas = async () => {
  const uid = auth().currentUser?.uid;
  if (!uid) return [];
  const snapshot = await firestore()
    .collection('clinicas')
    .where('ownerId', '==', uid)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllClinicas = async () => {
  const snapshot = await firestore().collection('clinicas').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateClinica = async (id, data) => {
  await firestore().collection('clinicas').doc(id).update(data);
};

export const deleteClinica = async (id) => {
  await firestore().collection('clinicas').doc(id).delete();
};

export const onMinhasClinicasSnapshot = (callback) => {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    callback([]);
    return () => {};
  }
  return firestore()
    .collection('clinicas')
    .where('ownerId', '==', uid)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      },
      (error) => {
        console.error('Erro no snapshot de clínicas:', error);
        callback([]);
      }
    );
};

// ─── FOTOS DE CLÍNICAS (base64, subcoleção) ───────────────────────────────────

export const uploadClinicaPhoto = async (clinicaId, uri) => {
  const base64 = await RNFS.readFile(uri, 'base64');
  const base64Image = `data:image/jpeg;base64,${base64}`;
  const ref = await firestore()
    .collection('clinicas')
    .doc(clinicaId)
    .collection('fotos')
    .add({
      base64: base64Image,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  return ref.id;
};

export const deleteClinicaPhoto = async (clinicaId, photoId) => {
  await firestore()
    .collection('clinicas')
    .doc(clinicaId)
    .collection('fotos')
    .doc(photoId)
    .delete();
};

export const onClinicaFotosSnapshot = (clinicaId, callback) => {
  if (!clinicaId) { callback([]); return () => {}; }
  return firestore()
    .collection('clinicas')
    .doc(clinicaId)
    .collection('fotos')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => { console.error('Erro snapshot fotos:', error); callback([]); }
    );
};

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────────

export const createServico = async (data) => {
  return firestore().collection('servicos').add({
    ...data,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getServicosByClinica = async (clinicaId) => {
  if (!clinicaId) return [];
  const snapshot = await firestore()
    .collection('servicos')
    .where('clinicaId', '==', clinicaId)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateServico = async (id, data) => {
  await firestore().collection('servicos').doc(id).update(data);
};

export const deleteServico = async (id) => {
  await firestore().collection('servicos').doc(id).delete();
};

export const onServicosByClinicaSnapshot = (clinicaId, callback) => {
  if (!clinicaId) {
    callback([]);
    return () => {};
  }
  return firestore()
    .collection('servicos')
    .where('clinicaId', '==', clinicaId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      },
      (error) => {
        console.error('Erro no snapshot de serviços:', error);
        callback([]);
      }
    );
};

// ─── AGENDAMENTOS ─────────────────────────────────────────────────────────────

export const createAgendamento = async (data) => {
  return firestore().collection('agendamentos').add({
    ...data,
    status: 'pendente',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getAgendamentosByCliente = async () => {
  const uid = auth().currentUser?.uid;
  if (!uid) return [];
  const snapshot = await firestore()
    .collection('agendamentos')
    .where('clienteId', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAgendamentosByClinica = async (clinicaId) => {
  if (!clinicaId) return [];
  const snapshot = await firestore()
    .collection('agendamentos')
    .where('clinicaId', '==', clinicaId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateAgendamentoStatus = async (id, status) => {
  await firestore().collection('agendamentos').doc(id).update({ status });
};

export const onAgendamentosByClienteSnapshot = (callback) => {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    callback([]);
    return () => {};
  }
  return firestore()
    .collection('agendamentos')
    .where('clienteId', '==', uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      },
      (error) => {
        console.error('Erro no snapshot de agendamentos (cliente):', error);
        callback([]);
      }
    );
};

export const onAgendamentosByClinicaSnapshot = (clinicaId, callback) => {
  if (!clinicaId) {
    callback([]);
    return () => {};
  }
  return firestore()
    .collection('agendamentos')
    .where('clinicaId', '==', clinicaId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      },
      (error) => {
        console.error('Erro no snapshot de agendamentos (clínica):', error);
        callback([]);
      }
    );
};

// ─── HORÁRIOS ─────────────────────────────────────────────────────────────────

export const createHorario = async (data) => {
  return firestore().collection('horarios').add({
    ...data,
    disponivel: true,
    agendamentoId: null,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const onHorariosByClinicaSnapshot = (clinicaId, callback) => {
  if (!clinicaId) {
    callback([]);
    return () => {};
  }
  return firestore()
    .collection('horarios')
    .where('clinicaId', '==', clinicaId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        const horarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(horarios);
      },
      (error) => {
        console.error('Erro no snapshot de horários:', error);
        callback([]);
      }
    );
};

export const onHorariosDisponiveisByServico = (clinicaId, servicoId, callback) => {
  if (!clinicaId || !servicoId) {
    callback([]);
    return () => {};
  }
  return firestore()
    .collection('horarios')
    .where('clinicaId', '==', clinicaId)
    .where('servicoId', '==', servicoId)
    .where('disponivel', '==', true)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      },
      (error) => {
        console.error('Erro no snapshot de horários disponíveis:', error);
        callback([]);
      }
    );
};

export const deleteHorario = async (id) => {
  await firestore().collection('horarios').doc(id).delete();
};

export const reservarHorario = async (horarioId, agendamentoId) => {
  await firestore().collection('horarios').doc(horarioId).update({
    disponivel: false,
    agendamentoId,
  });
};

export const liberarHorario = async (horarioId) => {
  await firestore().collection('horarios').doc(horarioId).update({
    disponivel: true,
    agendamentoId: null,
  });
};

// ─── AVALIAÇÕES ───────────────────────────────────────────────────────────────

export const createAvaliacao = async ({ clinicaId, nomeClinica, agendamentoId, rating, comentario }) => {
  const uid = auth().currentUser?.uid;
  const nomeCliente = auth().currentUser?.displayName || '';
  if (!uid) throw new Error('Não autenticado');

  return firestore().runTransaction(async (transaction) => {
    const clinicaRef = firestore().collection('clinicas').doc(clinicaId);
    const clinicaDoc = await transaction.get(clinicaRef);
    const { ratingMedia = 0, totalAvaliacoes = 0 } = clinicaDoc.data() || {};
    const newTotal = totalAvaliacoes + 1;
    const newMedia = ((ratingMedia * totalAvaliacoes) + rating) / newTotal;

    transaction.update(clinicaRef, {
      ratingMedia: parseFloat(newMedia.toFixed(1)),
      totalAvaliacoes: newTotal,
    });

    const avaliacaoRef = firestore().collection('avaliacoes').doc();
    transaction.set(avaliacaoRef, {
      clinicaId,
      nomeClinica,
      clienteId: uid,
      nomeCliente,
      agendamentoId,
      rating,
      comentario,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  });
};

export const getAvaliacoesByCliente = async () => {
  const uid = auth().currentUser?.uid;
  if (!uid) return [];
  const snapshot = await firestore()
    .collection('avaliacoes')
    .where('clienteId', '==', uid)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const onAvaliacoesByClinicaSnapshot = (clinicaId, callback) => {
  if (!clinicaId) { callback([]); return () => {}; }
  // Requer índice composto: clinicaId + createdAt DESC
  return firestore()
    .collection('avaliacoes')
    .where('clinicaId', '==', clinicaId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => { console.error('Erro snapshot avaliações:', error); callback([]); }
    );
};

// ─── CHAT ─────────────────────────────────────────────────────────────────────

export const getOrCreateConversa = async ({ clienteId, ownerId, clinicaId, nomeClinica, nomeCliente, nomeOwner }) => {
  const existing = await firestore()
    .collection('conversas')
    .where('clienteId', '==', clienteId)
    .where('ownerId', '==', ownerId)
    .where('clinicaId', '==', clinicaId)
    .limit(1)
    .get();

  if (!existing.empty) return existing.docs[0].id;

  const ref = await firestore().collection('conversas').add({
    participantes: [clienteId, ownerId],
    clienteId,
    ownerId,
    clinicaId,
    nomeClinica,
    nomeCliente,
    nomeOwner,
    lastMessage: '',
    updatedAt: firestore.FieldValue.serverTimestamp(),
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
};

export const sendMessage = async (conversaId, { senderId, texto }) => {
  const batch = firestore().batch();
  const msgRef = firestore()
    .collection('conversas')
    .doc(conversaId)
    .collection('mensagens')
    .doc();
  batch.set(msgRef, {
    senderId,
    texto,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  batch.update(firestore().collection('conversas').doc(conversaId), {
    lastMessage: texto,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
  await batch.commit();
};

export const onConversasSnapshot = (callback) => {
  const uid = auth().currentUser?.uid;
  if (!uid) { callback([]); return () => {}; }
  // Requer índice composto: participantes array-contains + updatedAt DESC
  return firestore()
    .collection('conversas')
    .where('participantes', 'array-contains', uid)
    .orderBy('updatedAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => { console.error('Erro snapshot conversas:', error); callback([]); }
    );
};

export const onMensagensSnapshot = (conversaId, callback) => {
  if (!conversaId) { callback([]); return () => {}; }
  return firestore()
    .collection('conversas')
    .doc(conversaId)
    .collection('mensagens')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => { console.error('Erro snapshot mensagens:', error); callback([]); }
    );
};
