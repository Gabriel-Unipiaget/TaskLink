import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'SEU_WEB_CLIENT_ID', // pegar no Firebase Console
});

export const loginWithEmail = (email, password) => {
  return auth().signInWithEmailAndPassword(email, password);
};

export const registerWithEmail = (email, password) => {
  return auth().createUserWithEmailAndPassword(email, password);
};

export const loginWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const { data } = await GoogleSignin.signIn();
  const googleCredential = auth.GoogleAuthProvider.credential(data.idToken);
  return auth().signInWithCredential(googleCredential);
};

export const forgotPassword = (email) => {
  return auth().sendPasswordResetEmail(email);
};

export const logout = () => {
  return auth().signOut();
};