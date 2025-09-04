## RideTrackingFrontend

Aplicación móvil con Expo Router (React Native) para el proyecto RideTracking.

### Requisitos

- Node.js 18+ o 20+
- npm 9+ (o yarn/pnpm si prefieres)
- Expo CLI (opcional, puedes usar `npx`)

### Instalación

```bash
npm install
```

### Ejecutar en desarrollo

Inicia el servidor de Expo y elige el destino (iOS, Android o Web):

```bash
npm start
```

Atajos útiles una vez abierto Expo:
- i: iOS Simulator (macOS con Xcode)
- a: Android emulator (con Android Studio)
- w: Web

También puedes usar scripts directos:

```bash
npm run ios
npm run android
npm run web
```

### Lint

```bash
npm run lint
```

### Estructura

- `app/`: rutas con Expo Router.
- `components/`, `hooks/`, `constants/`: código compartido.
- `assets/`: imágenes y fuentes.

### Variables de entorno

Usa archivos `.env` locales (no se suben al repo). Ejemplo: crea `.env.example` si necesitas documentar claves.

### Reset del template (opcional)

```bash
npm run reset-project
```

### Publicar en GitHub

1. Asegúrate de tener `.gitignore` adecuado (incluido en este repo).
2. Inicializa git y crea el primer commit:

```bash
git init
git add .
git commit -m "chore: inicializa proyecto Expo"
```

3. Crea el repo en GitHub y vincúlalo (reemplaza URL):

```bash
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

### Licencia

Privado por defecto. Actualiza si corresponde.
