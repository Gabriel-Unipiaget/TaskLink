import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '510094023312-elp7es2tkqmvbap4u7rumc6bu0hbt5rj.apps.googleusercontent.com', // pegar no Firebase Console
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