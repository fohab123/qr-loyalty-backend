import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const SplashScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>QR Loyalty</Text>
    <ActivityIndicator size="large" color="#4F46E5" style={styles.spinner} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
});
