import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// USUÁRIO
export const getUserData = async () => {
  const uid = auth().currentUser?.uid;
  const doc = await firestore().collection('usuarios').doc(uid).get();
  return doc.exists ? doc.data() : null;
};

export const updateUserRole = async (role) => {
  const uid = auth().currentUser?.uid;
  await firestore().collection('usuarios').doc(uid).update({ role });
};

// CLÍNICAS
export const createClinica = async (data) => {
  const uid = auth().currentUser?.uid;
  return firestore().collection('clinicas').add({
    ...data,
    ownerId: uid,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getMinhasClinicas = async () => {
  const uid = auth().currentUser?.uid;
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

// SERVIÇOS
export const createServico = async (data) => {
  return firestore().collection('servicos').add({
    ...data,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getServicosByClinica = async (clinicaId) => {
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

// AGENDAMENTOS
export const createAgendamento = async (data) => {
  return firestore().collection('agendamentos').add({
    ...data,
    status: 'pendente',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getAgendamentosByCliente = async () => {
  const uid = auth().currentUser?.uid;
  const snapshot = await firestore()
    .collection('agendamentos')
    .where('clienteId', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAgendamentosByClinica = async (clinicaId) => {
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