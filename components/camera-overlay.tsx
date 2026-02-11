import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { CARD_ASPECT_RATIO, CARD_WIDTH_PERCENT } from '@/utils/crop';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = SCREEN_WIDTH * CARD_WIDTH_PERCENT;
const CARD_H = CARD_W / CARD_ASPECT_RATIO;

const CORNER = 28;
const BORDER = 3;

interface CameraOverlayProps {
  scanning?: boolean;
}

export function CameraOverlay({ scanning = false }: CameraOverlayProps) {
  // Pulse animation when scanning
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (scanning) {
      opacity.value = withRepeat(
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [scanning, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const color = scanning ? '#4ECDC4' : '#FFFFFF';

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Viewfinder rectangle */}
      <Animated.View
        style={[
          styles.viewfinder,
          { width: CARD_W, height: CARD_H },
          animatedStyle,
        ]}
      >
        {/* Subtle border */}
        <View style={styles.border} />

        {/* Corner brackets */}
        <Corner position="topLeft" color={color} />
        <Corner position="topRight" color={color} />
        <Corner position="bottomLeft" color={color} />
        <Corner position="bottomRight" color={color} />
      </Animated.View>

      {/* Hint label */}
      <Text style={styles.hint}>
        {scanning ? 'Scanning…' : 'Position card inside the frame'}
      </Text>
    </View>
  );
}

// ── Corner bracket sub-component ──────────────────────────────────

type Pos = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

function Corner({ position, color }: { position: Pos; color: string }) {
  const isTop = position.startsWith('top');
  const isLeft = position.endsWith('Left');

  return (
    <View
      style={[
        styles.corner,
        {
          [isTop ? 'top' : 'bottom']: -1,
          [isLeft ? 'left' : 'right']: -1,
          borderColor: color,
          ...(isTop && isLeft && { borderTopWidth: BORDER, borderLeftWidth: BORDER, borderTopLeftRadius: 10 }),
          ...(isTop && !isLeft && { borderTopWidth: BORDER, borderRightWidth: BORDER, borderTopRightRadius: 10 }),
          ...(!isTop && isLeft && { borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderBottomLeftRadius: 10 }),
          ...(!isTop && !isLeft && { borderBottomWidth: BORDER, borderRightWidth: BORDER, borderBottomRightRadius: 10 }),
        },
      ]}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    position: 'relative',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  hint: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
