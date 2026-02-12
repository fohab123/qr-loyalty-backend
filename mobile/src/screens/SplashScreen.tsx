import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export const SplashScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>QR Loyalty</Text>
    <ActivityIndicator size="large" color={Colors.primaryLight} style={styles.spinner} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
});
