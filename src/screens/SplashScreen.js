import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import auth from '@react-native-firebase/auth';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const user = auth().currentUser;
      if (user) {
        navigation.replace('Home');
      } else {
        navigation.replace('Login');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C3A2F" />
      <View style={styles.logoWrapper}>
        <Text style={styles.logoTask}>Task</Text>
        <Text style={styles.logoLink}>Link</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.slogan}>Agendamento inteligente para estética</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C3A2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoTask: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  logoLink: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#C9962A',
    letterSpacing: 1,
  },
  divider: {
    width: 48,
    height: 3,
    backgroundColor: '#C9962A',
    borderRadius: 2,
    marginBottom: 16,
  },
  slogan: {
    fontSize: 15,
    color: '#A8C5B5',
    letterSpacing: 0.5,
  },
});