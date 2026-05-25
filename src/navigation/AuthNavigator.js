import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SecurityScreen from '../screens/SecurityScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SupportScreen from '../screens/SupportScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
    </Stack.Navigator>
  );
}