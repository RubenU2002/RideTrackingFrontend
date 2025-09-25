import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useIsFocused } from '@react-navigation/native';
import MapboxGL from '@rnmapbox/maps';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Platform, StyleSheet, View } from 'react-native';

type Coord = [number, number]; // [lng, lat]

export function TripMapView({
  path,
  start,
  current,
}: {
  path: Coord[];
  start?: Coord | null;
  current?: Coord | null;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? Palette.dark.surfaceAlt : Palette.light.surface;

  // Layout + lazy gates to avoid 64x64 warning and speed up first paint
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [afterInteractions, setAfterInteractions] = useState(false);
  const isFocused = useIsFocused();
  const [lazyReady, setLazyReady] = useState(false);
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
  useEffect(() => {
    let cancelled = false;
    if (isFocused) {
      const t = setTimeout(() => {
        if (!cancelled) {setLazyReady(true);}
      }, 120);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    } else {
      setLazyReady(false);
    }
  }, [isFocused]);

  // Style URL per theme or custom env
  const styleURLRef = useRef<string>('');
  const envStyle = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL;
  const desiredStyle = envStyle
    ? envStyle
    : isDark
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';
  if (styleURLRef.current !== desiredStyle) {styleURLRef.current = desiredStyle;}

  // GeoJSON sources
  const line: Feature<LineString> | undefined = useMemo(() => {
    if (!path || path.length < 2) {return undefined;}
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: path,
      },
    };
  }, [path]);

  const points: FeatureCollection<Point, { kind: 'start' | 'current' }> | undefined =
    useMemo(() => {
      const feats: Feature<Point, { kind: 'start' | 'current' }>[] = [];
      if (start) {
        feats.push({
          type: 'Feature',
          properties: { kind: 'start' },
          geometry: { type: 'Point', coordinates: start },
        });
      }
      if (current) {
        feats.push({
          type: 'Feature',
          properties: { kind: 'current' },
          geometry: { type: 'Point', coordinates: current },
        });
      }
      if (feats.length === 0) {return undefined;}
      return { type: 'FeatureCollection', features: feats };
    }, [start, current]);

  const cameraRef = useRef<MapboxGL.Camera>(null);
  const pathLength = path?.length;
  const currentLng = current?.[0];
  const currentLat = current?.[1];
  useEffect(() => {
    if (pathLength >= 2) {
      const lngs = path.map((c) => c[0]);
      const lats = path.map((c) => c[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      cameraRef.current?.fitBounds([minLng, minLat], [maxLng, maxLat], 60, 300);
    } else if (current) {
      cameraRef.current?.setCamera({
        centerCoordinate: current,
        zoomLevel: 14,
        animationDuration: 400,
      });
    }
  }, [path, pathLength, current, currentLng, currentLat, cameraRef]);

  if (Platform.OS === 'web') {
    // Lightweight placeholder on web
    return <View style={[styles.map, { backgroundColor: bg }]} onLayout={onLayout} />;
  }

  return (
    <View style={[styles.map, { backgroundColor: bg }]} onLayout={onLayout}>
      {afterInteractions && lazyReady && dims.w > 0 && dims.h > 0 && (
        <MapboxGL.MapView
          styleURL={styleURLRef.current}
          style={StyleSheet.absoluteFill}
          compassEnabled={false}
          scaleBarEnabled={false}
          logoEnabled={false}
        >
          <MapboxGL.Camera ref={cameraRef} />
          {/* Live user puck */}
          <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} />

          {/* Route line */}
          {line && (
            <MapboxGL.ShapeSource id="trip-line" shape={line}>
              <MapboxGL.LineLayer
                id="trip-line-layer"
                style={{
                  lineColor: isDark ? '#7FB3FF' : '#2D7FF9',
                  lineWidth: 4,
                  lineOpacity: 0.9,
                }}
              />
            </MapboxGL.ShapeSource>
          )}

          {/* Start/current points */}
          {points && (
            <MapboxGL.ShapeSource id="trip-points" shape={points}>
              <MapboxGL.CircleLayer
                id="trip-start"
                filter={['==', ['get', 'kind'], 'start']}
                style={{
                  circleColor: '#34C759',
                  circleRadius: 5,
                  circleStrokeColor: '#fff',
                  circleStrokeWidth: 1,
                }}
              />
              <MapboxGL.CircleLayer
                id="trip-current"
                filter={['==', ['get', 'kind'], 'current']}
                style={{
                  circleColor: isDark ? '#7FB3FF' : '#2D7FF9',
                  circleRadius: 5,
                  circleStrokeColor: '#fff',
                  circleStrokeWidth: 1,
                }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, width: '100%' },
});
