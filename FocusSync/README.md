# FocusSync

Aplicación móvil desarrollada con Expo, React Native y Supabase para planificar sesiones de estudio, generar planes con IA y registrar bloques de enfoque.

## Requisitos

- Docker Desktop, recomendado para evitar problemas de versiones entre integrantes.
- Expo Go instalado en el teléfono para probar la app.
- Proyecto Supabase configurado.
- Edge Function `generate-study-plan` desplegada en Supabase.

## Variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Completa `.env` con los valores de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-publishable-key
```

La API key de Gemini no debe ir en `.env` porque sería pública en la app. Debe guardarse como secreto en Supabase:

```bash
GEMINI_API_KEY=tu-api-key
```

## Ejecutar con Docker

Desde esta carpeta, donde está `package.json`, ejecuta:

```bash
docker compose up --build
```

Expo se iniciará en modo túnel para facilitar el acceso desde Expo Go aunque cada integrante esté en una red distinta.

Cuando aparezca el código QR:

1. Abre Expo Go en el teléfono.
2. Escanea el QR.
3. Inicia sesión o crea una cuenta.
4. Prueba IA Coach y los planes guardados.

Para detener el contenedor:

```bash
docker compose down
```

Si se instalan nuevas dependencias, reconstruye la imagen:

```bash
docker compose up --build
```

## Ejecutar sin Docker

```bash
npm install
npm run start
```

## Funcionalidades implementadas

- Autenticación real con Supabase Auth.
- Navegación protegida por sesión.
- Dashboard con planes pendientes desde Supabase.
- IA Coach conectado a Edge Function.
- Generación de planes de estudio con Gemini.
- Guardado de planes y bloques en Supabase.
- Vista de detalle del plan con recursos y pasos.
- Modo enfoque con registro inicial de sesiones e interrupciones.
- Configuración inicial de Docker para entorno de desarrollo.

## Nota sobre Supabase y Gemini

La Edge Function se encuentra en:

```txt
supabase/functions/generate-study-plan/index.ts
```

Si se edita desde el panel web de Supabase, copia el contenido completo de ese archivo y vuelve a desplegar la función.
