import { Platform } from 'react-native';

const getDefaultBaseUrl = (): string => {
  // Android emulator uses 10.0.2.2 to reach host localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  // iOS simulator can use localhost directly
  return 'http://localhost:3000/api';
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? getDefaultBaseUrl();
