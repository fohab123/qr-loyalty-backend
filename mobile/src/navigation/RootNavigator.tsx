import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import { Colors } from '../constants/theme';

const DarkNavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.primary,
  },
};

export const RootNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={DarkNavTheme}>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
