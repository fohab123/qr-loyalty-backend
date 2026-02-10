import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, StyleSheet, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPoints, scanQrCode } from '../api/points';
import { useAuth } from '../hooks/useAuth';
import { ScannerOverlay } from '../components/ScannerOverlay';
import type { ApiError } from '../types/api';
import type { MainStackParamList } from '../types/navigation';
import { AxiosError } from 'axios';

type Props = NativeStackScreenProps<MainStackParamList, 'Scanner'>;

export const ScannerScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [points, setPoints] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const processingRef = useRef(false);

  // Fetch points balance on mount
  useEffect(() => {
    getPoints()
      .then((res) => setPoints(res.data.pointsBalance))
      .catch(() => {});
  }, []);

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanning(true);

    try {
      const res = await scanQrCode({ qrCodeData: result.data });
      setPoints(res.data.newBalance);
      Alert.alert(
        'Success',
        `Points earned: ${res.data.pointsEarned}\nNew balance: ${res.data.newBalance.toLocaleString()}`,
        [{ text: 'OK', onPress: () => { processingRef.current = false; } }],
      );
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr.response?.data?.message;
      const errorText = Array.isArray(msg) ? msg.join('\n') : msg ?? 'Scan failed';
      Alert.alert('Error', errorText, [
        { text: 'OK', onPress: () => { processingRef.current = false; } },
      ]);
    } finally {
      setScanning(false);
    }
  };

  // Permission not yet determined
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          QR Loyalty needs camera access to scan receipt QR codes.
        </Text>
        {permission.canAskAgain ? (
          <Text style={styles.permissionLink} onPress={requestPermission}>
            Grant Permission
          </Text>
        ) : (
          <Text
            style={styles.permissionLink}
            onPress={() => Linking.openSettings()}
          >
            Open Settings
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />
      <ScannerOverlay
        points={points}
        scanning={scanning}
        onLogout={signOut}
        onHistory={() => navigation.navigate('History')}
        onProfile={() => navigation.navigate('Profile')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionLink: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
});
