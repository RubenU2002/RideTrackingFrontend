import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Props = {
  isDark?: boolean;
  borderRadius?: number;
};

export function MapSkeleton({ isDark = false, borderRadius }: Props) {
  const translate = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translate, {
          toValue: 150,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: -150,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [translate]);

  const baseColor = isDark ? 'rgba(21, 33, 55, 0.9)' : 'rgba(196, 217, 255, 0.55)';
  const highlightColor = isDark ? 'rgba(119, 155, 255, 0.18)' : 'rgba(255, 255, 255, 0.35)';

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        borderRadius !== null ? { borderRadius, overflow: 'hidden' } : null,
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} />
      <Animated.View
        style={[
          styles.highlight,
          {
            backgroundColor: highlightColor,
            transform: [{ translateX: translate }, { rotate: '18deg' }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  highlight: {
    position: 'absolute',
    top: -80,
    bottom: -80,
    width: '45%',
    opacity: 0.65,
  },
});
