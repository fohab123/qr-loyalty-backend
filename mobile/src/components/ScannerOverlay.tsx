import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradient } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CUTOUT_SIZE = 250;

interface ScannerOverlayProps {
  points: number | null;
  scanning: boolean;
  onLogout: () => void;
  onHistory: () => void;
  onProfile: () => void;
  onAdmin?: () => void;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  points,
  scanning,
  onLogout,
  onHistory,
  onProfile,
  onAdmin,
}) => {
  const sideOverlayWidth = (SCREEN_WIDTH - CUTOUT_SIZE) / 2;

  return (
    <View style={styles.overlay}>
      {/* Top section */}
      <View style={styles.topSection}>
        <View style={styles.topBar}>
          <Text style={styles.appName}>QR Loyalty</Text>
          {points !== null && (
            <LinearGradient
              colors={[...Gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pointsPill}
            >
              <Text style={styles.pointsText}>
                {points.toLocaleString()} pts
              </Text>
            </LinearGradient>
          )}
        </View>
      </View>

      {/* Middle section with cutout */}
      <View style={styles.middleSection}>
        <View style={[styles.sideOverlay, { width: sideOverlayWidth }]} />
        <View style={styles.cutoutContainer}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {scanning && (
            <ActivityIndicator size="large" color="#fff" style={styles.scanSpinner} />
          )}
        </View>
        <View style={[styles.sideOverlay, { width: sideOverlayWidth }]} />
      </View>

      {/* Instruction text */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Point camera at receipt QR code
        </Text>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomButton} onPress={onHistory}>
            <Text style={styles.bottomButtonIcon}>&#128337;</Text>
            <Text style={styles.bottomButtonLabel}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={onProfile}>
            <Text style={styles.bottomButtonIcon}>&#128100;</Text>
            <Text style={styles.bottomButtonLabel}>Profile</Text>
          </TouchableOpacity>
          {onAdmin && (
            <TouchableOpacity style={styles.bottomButton} onPress={onAdmin}>
              <Text style={styles.bottomButtonIcon}>{'\u2699'}</Text>
              <Text style={styles.bottomButtonLabel}>Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.bottomButton} onPress={onLogout}>
            <Text style={styles.bottomButtonIcon}>&#10140;</Text>
            <Text style={styles.bottomButtonLabel}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const CORNER_SIZE = 30;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  appName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  pointsPill: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  middleSection: {
    flexDirection: 'row',
    height: CUTOUT_SIZE,
  },
  sideOverlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cutoutContainer: {
    width: CUTOUT_SIZE,
    height: CUTOUT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: '#fff',
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: '#fff',
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: '#fff',
    borderBottomRightRadius: 4,
  },
  scanSpinner: {
    position: 'absolute',
  },
  instructionContainer: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  instructionText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingBottom: 48,
    paddingTop: 16,
  },
  bottomButton: {
    alignItems: 'center',
    gap: 4,
  },
  bottomButtonIcon: {
    fontSize: 24,
  },
  bottomButtonLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
  },
});
