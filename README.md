## RideTrackingFrontend

App móvil en React Native con Expo Router para tracking de viajes, mapa de calor con recomendaciones y estadísticas. UI con Gluestack.

### Requisitos

- Node.js 18+ o 20+
- npm 9+ (o yarn/pnpm)
- Xcode (iOS) / Android Studio (Android) si vas a usar simuladores/emuladores

### Instalación

```bash
npm install
```

### Ejecutar en desarrollo

```bash
# Abre el Dev Server y elige iOS, Android o Web
npm start

# Opcional: destinos directos
npm run ios
npm run android
npm run web
```

### Lint

```bash
npm run lint
```

## Funcionalidades

- Trip (pestaña principal):
	- Iniciar/terminar viaje con temporizador.
	- Métricas en vivo: distancia (haversine), velocidad promedio y puntos capturados.
	- Al terminar, modal para registrar monto y plataforma (Uber, DiDi, inDrive, Taxi).
	- Tracking de ubicación simulado: genera puntos cada ~6s (no usa GPS real todavía).

- Heatmap:
	- Visualización de hotspots mock por hora (sin dependencia de mapas, render placeholder).
	- Recomendación rápida según origen y hora; sugerencias en chips.

- Stats:
	- Resumen de hoy: viajes, tiempo en carrera, ingresos y $/hora (calculado de los viajes guardados).

- Settings:
	- Modo de tema: sistema, claro u oscuro (ThemeProvider propio + Gluestack UI).
	- Toggle “tracking solo durante la carrera” (placeholder).
	- Exportar CSV (mock) y “Borrar todo” para limpiar datos locales.

## Stack técnico

- Expo ~53, React Native ~0.79, React 19, Expo Router ~5
- Gluestack UI (`@gluestack-ui/themed` + `@gluestack-ui/config`)
- React Navigation (usado por Expo Router)

## Estructura relevante

- `app/(tabs)/`: pestañas principales (`index.tsx` = Trip, `heatmap.tsx`, `stats.tsx`, `settings.tsx`).
- `core/state/tripStore.tsx`: store de viajes, mock tracker, y utilidades de estadísticas.
- `core/theme/ThemeProvider.tsx`: modo de tema (system/light/dark) y hook `useResolvedColorScheme`.
- `core/ui/GluestackProvider.tsx`: proveedor de Gluestack con colorMode.
- `features/trip/`: UI de viaje (incluye `FareModal` y `PlatformPicker`).
- `features/heatmap/`: mock de hotspots, recomendador y vista.
- `features/stats/`: pantalla de estadísticas.
- `components/ui/`: `Button`, `Card`, `Chip` sobre Gluestack.

## Datos y persistencia

- Los datos viven en memoria (contexto React); se pierden al recargar la app.
- `services/mock/api.ts` incluye funciones mock para simular sincronización futura.

## Configuración del proyecto

- `app.json` define iconos, splash, esquema `ridetrackingfrontend` y typedRoutes.
- `expo-router` está habilitado en plugins.

## Scripts útiles

```bash
npm start           # Dev server
npm run ios         # Abrir iOS
npm run android     # Abrir Android
npm run web         # Abrir Web
npm run lint        # Linting
npm run reset-project  # Script de limpieza del template
```

## Limitaciones actuales

- Sin permisos de ubicación ni tracking en background; el tracking es simulado.
- Heatmap sin mapa real (render de círculos placeholder).
- Sin almacenamiento persistente ni backend real (por ahora).

## Licencia

Privado por defecto. Actualiza si corresponde.
