import { MapSkeleton } from '@/components/ui/MapSkeleton';
import { Palette } from '@/constants/Colors';
import { useUserLocation } from '@/core/location/useUserLocation';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useIsFocused } from '@react-navigation/native';
import MapboxGL from '@rnmapbox/maps';
import type { FeatureCollection, Point } from 'geojson';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Platform, StyleSheet, View } from 'react-native';
import type { Hotspot } from '../mock';

const MAP_BORDER_RADIUS = 16;

type Props = { hotspots: Hotspot[] };

function HeatmapInner({ hotspots }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? Palette.dark.surfaceAlt : Palette.light.surface;

  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [afterInteractions, setAfterInteractions] = useState(false);
  const geojson = useMemo<FeatureCollection<Point, { weight: number }>>(() => {
    return {
      type: 'FeatureCollection',
      features: hotspots.map((h) => ({
        type: 'Feature',
        properties: {
          weight: Math.max(0.05, Math.min(1, h.intensity ?? 0.5)),
        },
        geometry: {
          type: 'Point',
          coordinates: [h.lng, h.lat],
        },
      })),
    };
  }, [hotspots]);
  const styleURLRef = useRef<string>('');
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const { coords } = useUserLocation();
  const isFocused = useIsFocused();
  const [lazyReady, setLazyReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Handlers y efectos
  const onLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    if (width && height && (width !== dims.w || height !== dims.h)) {
      setDims({ w: width, h: height });
    }
  };

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setAfterInteractions(true));
    return () => task.cancel();
  }, []);

  const envStyle = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL;
  const desiredStyle = envStyle
    ? envStyle
    : isDark
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';
  if (styleURLRef.current !== desiredStyle) {
    styleURLRef.current = desiredStyle;
  }

  // Camera fit to hotspots once per change
  useEffect(() => {
    if (coords) {
      cameraRef.current?.setCamera({
        centerCoordinate: [coords.lng, coords.lat],
        zoomLevel: 11,
        animationDuration: 500,
      });
      return;
    }
    if (hotspots.length) {
      const lngs = hotspots.map((h) => h.lng);
      const lats = hotspots.map((h) => h.lat);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      if (minLng === maxLng && minLat === maxLat) {
        cameraRef.current?.setCamera({
          centerCoordinate: [maxLng, maxLat],
          zoomLevel: 12,
          animationDuration: 500,
        });
      } else {
        cameraRef.current?.fitBounds([minLng, minLat], [maxLng, maxLat], 40, 300);
      }
    }
  }, [coords, hotspots]);

  useEffect(() => {
    let cancelled = false;
    if (isFocused) {
      const timeout = setTimeout(() => {
        if (!cancelled) {
          setLazyReady(true);
        }
      }, 150);
      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    } else {
      setLazyReady(false);
    }
  }, [isFocused]);

  const shouldMountMap = afterInteractions && lazyReady && dims.w > 0 && dims.h > 0;

  useEffect(() => {
    if (!shouldMountMap) {
      setMapLoaded(false);
      setShowSkeleton(true);
    }
  }, [shouldMountMap]);

  useEffect(() => {
    if (!mapLoaded) {
      setShowSkeleton(true);
      return;
    }
    const t = setTimeout(() => setShowSkeleton(false), 120);
    return () => clearTimeout(t);
  }, [mapLoaded]);

  if (Platform.OS === 'web') {
    const dot = isDark ? 'rgba(45, 127, 249, 0.25)' : 'rgba(45, 127, 249, 0.2)';
    const core = 'rgba(45, 127, 249, 0.65)';
    return (
      <View style={[styles.map, { backgroundColor: bg }]}>
        {hotspots.map((h, idx) => (
          <View key={idx} style={[styles.spot, { left: (idx + 1) * 60, top: 50 + idx * 40 }]}>
            <View style={[styles.spotOuter, { backgroundColor: dot }]} />
            <View style={[styles.spotMid, { backgroundColor: dot }]} />
            <View style={[styles.spotCore, { backgroundColor: core, opacity: h.intensity }]} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.map, { backgroundColor: bg }]} onLayout={onLayout}>
      {showSkeleton && <MapSkeleton isDark={isDark} borderRadius={MAP_BORDER_RADIUS} />}
      {shouldMountMap && (
        <MapboxGL.MapView
          styleURL={styleURLRef.current}
          style={StyleSheet.absoluteFill}
          compassEnabled={false}
          scaleBarEnabled={false}
          logoEnabled
          logoPosition={{ bottom: 12, left: 12 }}
          onWillStartLoadingMap={() => setMapLoaded(false)}
          onDidFinishLoadingMap={() => setMapLoaded(true)}
        >
          <MapboxGL.Camera ref={cameraRef} />
          <MapboxGL.ShapeSource id="hotspots-source" shape={geojson}>
            <MapboxGL.HeatmapLayer
              id="hotspots-heatmap"
              // Keep a stable source reference
              sourceID="hotspots-source"
              style={{
                heatmapRadius: ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 18, 14, 32],
                heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 0, 0.8, 14, 1.2],
                heatmapWeight: ['coalesce', ['get', 'weight'], 0.5],
                heatmapOpacity: 0.9,
              }}
            />
          </MapboxGL.ShapeSource>
        </MapboxGL.MapView>
      )}
    </View>
  );
}

export const HeatmapView = memo(HeatmapInner, (prev, next) => {
  if (prev.hotspots.length !== next.hotspots.length) {
    return false;
  }
  for (let i = 0; i < prev.hotspots.length; i++) {
    const a = prev.hotspots[i];
    const b = next.hotspots[i];
    if (a.lat !== b.lat || a.lng !== b.lng || a.intensity !== b.intensity) {
      return false;
    }
  }
  return true;
});

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 260,
    borderRadius: MAP_BORDER_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(127, 179, 255, 0.25)',
  },
  // Web-only fallback dots below
  spot: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  spotOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  spotMid: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  spotCore: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
