import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Box, HStack, VStack } from '@gluestack-ui/themed';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

// Componente base para skeleton boxes con animación shimmer
function SkeletonBox({
  width,
  height,
  style,
}: {
  width?: string | number;
  height?: string | number;
  style?: any;
}) {
  const colorScheme = useColorScheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  const backgroundColor = colorScheme === 'dark' ? '#374151' : '#e5e7eb';
  const shimmerColor = colorScheme === 'dark' ? '#4b5563' : '#f3f4f6';

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [animatedValue]);

  const animatedBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [backgroundColor, shimmerColor],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: animatedBackgroundColor,
          borderRadius: 8,
          width,
          height,
        },
        style,
      ]}
    />
  );
}

export function DailySummaryCardsSkeleton() {
  return (
    <HStack space="md" flexWrap="wrap">
      {[1, 2, 3, 4].map((i) => (
        <Box key={i} flex={1} minWidth="45%">
          <Card style={styles.skeletonCard}>
            <VStack space="xs">
              <SkeletonBox height={12} width="60%" />
              <SkeletonBox height={24} width="80%" />
              <SkeletonBox height={10} width="40%" />
            </VStack>
          </Card>
        </Box>
      ))}
    </HStack>
  );
}

export function EarningsPerTripBarsSkeleton() {
  return (
    <Card style={styles.skeletonCard}>
      <VStack space="md">
        <SkeletonBox height={16} width="50%" />
        {/* Contenedor de barras verticales como en el componente real */}
        <Box
          height={140}
          style={styles.chartContainer}
          flexDirection="row"
          alignItems="flex-end"
          gap={6}
          paddingHorizontal={4}
          paddingBottom={12}
          paddingTop={12}
        >
          {[85, 60, 95, 40, 75, 90, 55, 70].map((height, i) => (
            <Box key={i} flex={1}>
              <SkeletonBox height={`${height}%`} width="100%" style={{ borderRadius: 6 }} />
            </Box>
          ))}
        </Box>
      </VStack>
    </Card>
  );
}

export function PlatformPieSkeleton() {
  return (
    <Card style={styles.skeletonCard}>
      <VStack space="md">
        <SkeletonBox height={16} width="50%" />
        <HStack space="sm" alignItems="center">
          {/* SVG Container - más pequeño para evitar overflow */}
          <Box alignItems="center" justifyContent="center" width={170} height={170}>
            <SkeletonBox height={160} width={160} style={{ borderRadius: 80 }} />
          </Box>
          {/* Leyenda - controlada para no salirse */}
          <VStack space="sm" flex={1} paddingLeft={12} maxWidth={120}>
            {[1, 2, 3, 4].map((i) => (
              <HStack key={i} space="sm" alignItems="center">
                <SkeletonBox height={12} width={12} style={{ borderRadius: 4 }} />
                <SkeletonBox height={12} width="50%" />
                <SkeletonBox height={12} width="25%" />
              </HStack>
            ))}
          </VStack>
        </HStack>
      </VStack>
    </Card>
  );
}

export function ActivityBlocksSkeleton() {
  return (
    <Card style={styles.skeletonCard}>
      <VStack space="md">
        <SkeletonBox height={16} width="50%" />
        <VStack space="sm">
          <HStack space="xs" alignItems="flex-end" height={130}>
            {Array.from({ length: 24 }).map((_, i) => (
              <Box key={i} flex={1}>
                <SkeletonBox
                  height={Math.random() * 80 + 20}
                  width="100%"
                  style={{ borderRadius: 2 }}
                />
              </Box>
            ))}
          </HStack>
          <HStack space="sm" justifyContent="space-between">
            <SkeletonBox height={10} width="15%" />
            <SkeletonBox height={10} width="15%" />
            <SkeletonBox height={10} width="15%" />
            <SkeletonBox height={10} width="15%" />
            <SkeletonBox height={10} width="15%" />
          </HStack>
        </VStack>
      </VStack>
    </Card>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    padding: 16,
  },
  chartContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
  },
});
