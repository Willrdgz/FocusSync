# Arquitectura del Proyecto FocusSync

Fecha: 2026-08-25

## Proposito

FocusSync es un prototipo frontend mobile first construido con Expo y React Native. Su objetivo es simular una app de productividad academica que combina planificacion con IA, sesiones Pomodoro y eventos IoT del celular para reducir distracciones.

Este documento separa dos niveles de lectura:

- Estado actual del repositorio: prototipo navegable con datos simulados.
- Arquitectura funcional objetivo: comportamiento esperado de la aplicacion final para documentacion, diagramas UML e integracion posterior.

El prototipo permite probar el flujo completo de UI:

- Acceso y registro simulado.
- Dashboard estadistico.
- Chat IA simulado para generar planes.
- Modo enfoque con temporizador.
- Simulacion de interrupcion por giroscopio/acelerometro.
- Gestor y detalle de planes de estudio.
- Historial con retroalimentacion analitica.

## Arquitectura Funcional Objetivo

La version funcional de FocusSync debe conservar el flujo visual del prototipo, pero reemplazar las simulaciones por servicios reales. Esta arquitectura objetivo es la base recomendada para los diagramas UML, diagramas de flujo y modelo de datos.

### Servicios principales

- Aplicacion movil: Expo SDK 54 con React Native y Expo Router.
- Autenticacion: Supabase Auth con correo/contraseña y proveedor Google.
- Base de datos: PostgreSQL administrado por Supabase.
- Seguridad de datos: politicas RLS para aislar la informacion por usuario autenticado.
- IA generativa: Gemini API consumida desde Supabase Edge Functions.
- Sensores del dispositivo: acelerometro y giroscopio para detectar orientacion/movimiento durante el modo enfoque.
- Notificaciones o audio local: aviso de finalizacion de bloque y retroalimentacion de sesion.

### Flujo funcional esperado

1. El estudiante se registra o inicia sesion mediante Supabase Auth.
2. El usuario solicita un plan de estudio desde IA Coach usando lenguaje natural.
3. La app envia la solicitud a una Supabase Edge Function.
4. La Edge Function llama a Gemini API y recibe un plan estructurado en bloques.
5. La app guarda el plan y sus bloques en PostgreSQL asociados al usuario.
6. El estudiante inicia un bloque de enfoque desde IA Coach o desde el detalle del plan.
7. El temporizador se ejecuta localmente mientras los sensores monitorean el dispositivo.
8. Si el dispositivo es levantado durante el bloque, la app pausa el temporizador y registra la distraccion.
9. Al finalizar la sesion, la app guarda el resumen de tiempo planificado, tiempo real e interrupciones.
10. El historial consulta las sesiones guardadas y muestra retroalimentacion personalizada generada por IA.

### Entidades recomendadas para diagramas y base de datos

- Usuario: perfil autenticado del estudiante.
- PlanEstudio: rutina generada por IA y asociada a un usuario.
- BloqueEstudio: unidad de teoria, practica o descanso dentro de un plan.
- SesionEnfoque: ejecucion real de un bloque de estudio.
- Distraccion: evento detectado por sensores durante una sesion.
- MensajeIA: intercambio entre usuario y asistente en IA Coach.
- RetroalimentacionIA: consejo generado desde el historial del usuario.

### Diferencia con el prototipo actual

Actualmente el repositorio implementa el flujo visual con datos mock y eventos simulados. Por eso, los diagramas academicos pueden representar la arquitectura funcional objetivo, siempre que el documento indique que Supabase, Gemini, sensores reales y persistencia son integraciones posteriores al prototipo actual.

## Stack Tecnologico

- Expo SDK 54.
- React 19.1.
- React Native 0.81.5.
- Expo Router 6.
- TypeScript 5.9.
- NativeWind 4 configurado para nuevos componentes.
- Tailwind CSS 3.4.
- `@expo-google-fonts/inter` para fuente Inter.
- `@expo/vector-icons` para iconos existentes.
- `lucide-react-native` instalado para futura iconografia.
- `react-native-safe-area-context` para areas seguras.
- `react-native-reanimated` 4 con `react-native-worklets`.

## Estructura General

```text
FocusSync/
  app/
    index.tsx
    _layout.tsx
    (auth)/
      login.tsx
      register.tsx
    (tabs)/
      _layout.tsx
      dashboard.tsx
      ia-coach.tsx
      focus.tsx
      history.tsx
    plans/
      _layout.tsx
      index.tsx
      [id].tsx

  features/
    auth/
      screens/
        RegisterScreen.tsx
    plans/
      screens/
        PlansScreen.tsx
        PlanDetailScreen.tsx

  components/
    ui/
      Badge.tsx
      Button.tsx
      Card.tsx
      Input.tsx
      MetricCard.tsx
      Modal.tsx
      ProgressRing.tsx
    chat/
      ChatBubble.tsx
      ChatInput.tsx
      MessageList.tsx
    focus/
      InstructionText.tsx
      MockIoTButton.tsx
      SensorBadge.tsx
      TimerDisplay.tsx

  constants/
    mockData.ts
    theme.ts

  hooks/
    index.ts
    useAuth.tsx
    useFocusTimer.tsx

  types/
    index.ts

  utils/
    formatTime.ts

  assets/
    adaptive-icon.png
    favicon.png
    icon.png
    icon.svg
    splash.png

  app.json
  babel.config.js
  global.css
  metro.config.js
  nativewind-env.d.ts
  package.json
  tailwind.config.js
  tsconfig.json
```

## Rutas de la Aplicacion

### Raiz

`app/index.tsx`

Redirige al login inicial mediante Expo Router.

Destino:

```text
/(auth)/login
```

### Layout raiz

`app/_layout.tsx`

Responsabilidades:

- Importar `global.css` para NativeWind.
- Cargar fuentes Inter.
- Envolver la app con `AuthProvider`.
- Configurar el `Stack` principal sin headers.
- Registrar grupos principales:
  - `(auth)/login`
  - `(auth)/register`
  - `(tabs)`
  - `plans`

### Autenticacion

`app/(auth)/login.tsx`

Pantalla inicial de acceso. Permite iniciar sesion con correo/contraseña o Google simulado. Al iniciar sesion navega al Dashboard.

`app/(auth)/register.tsx`

Ruta del registro. Exporta `RegisterScreen` desde `features/auth/screens/RegisterScreen.tsx`.

`features/auth/screens/RegisterScreen.tsx`

Pantalla de registro simulado. Solicita nombre, correo y contraseña. Al registrarse crea un usuario mock y navega al Dashboard.

### Tabs principales

`app/(tabs)/_layout.tsx`

Configura el Bottom Tab Navigator con 4 pestañas:

- Dashboard.
- IA Coach.
- Enfoque.
- Historial.

Esta estructura conserva el requisito de `especs.md`: 4 tabs principales despues de autenticarse.

### Dashboard

`app/(tabs)/dashboard.tsx`

Proposito:

- Mostrar saludo al usuario.
- Permitir cerrar sesion.
- Mostrar metricas principales.
- Mostrar anillo de progreso de meta diaria.
- Mostrar proxima sesion sugerida.
- Mostrar timeline de actividades diarias.
- Dar acceso al gestor de planes.

Datos usados:

- `mockDashboardMetrics`.
- `mockNextSession`.
- `mockDailyActivities`.

### IA Coach

`app/(tabs)/ia-coach.tsx`

Proposito:

- Simular un chat con IA tipo Gemini.
- Mostrar mensaje inicial del usuario.
- Mostrar respuesta IA con bloques de estudio.
- Renderizar el boton `Iniciar Bloque 1` dentro del chat.
- Permitir enviar mensajes mock.

Componentes usados:

- `MessageList`.
- `ChatBubble`.
- `ChatInput`.

### Modo Enfoque

`app/(tabs)/focus.tsx`

Proposito:

- Ejecutar un temporizador de enfoque.
- Mostrar instruccion de colocar el celular boca abajo.
- Mostrar badge de sensores activos.
- Simular evento IoT de distraccion.
- Permitir pausar, reanudar o terminar la sesion.

Estado de interrupcion:

- Cuando se presiona el boton mock IoT, `useFocusTimer` activa `distractionDetected`.
- El temporizador se pausa.
- El temporizador cambia a color rojo/opaco.
- El badge cambia a `Dispositivo levantado`.
- Se muestra una tarjeta roja con el mensaje de giroscopio.
- Se muestran botones `Reanudar manualmente` y `Terminar sesión`.

Componentes usados:

- `TimerDisplay`.
- `SensorBadge`.
- `InstructionText`.
- `MockIoTButton`.
- `Modal`.

### Historial

`app/(tabs)/history.tsx`

Proposito:

- Mostrar sesiones pasadas.
- Mostrar interrupciones por sesion.
- Mostrar comparacion de tiempo planificado vs tiempo real.
- Mostrar consejo de IA.

Datos usados:

- `mockSessions`.
- `mockAIFeedback`.

### Planes

`app/plans/_layout.tsx`

Layout anidado de planes. Existe para que Expo Router reconozca `plans` como stack y no emita warnings como `No route named "plans" exists`.

`app/plans/index.tsx`

Ruta del gestor de planes. Exporta `PlansScreen`.

`features/plans/screens/PlansScreen.tsx`

Proposito:

- Mostrar biblioteca de planes generados.
- Mostrar dificultad.
- Mostrar tiempo total.
- Mostrar cantidad de bloques.
- Navegar al detalle del plan.

`app/plans/[id].tsx`

Ruta dinamica para detalle de plan.

`features/plans/screens/PlanDetailScreen.tsx`

Proposito:

- Mostrar detalle de un plan especifico.
- Mostrar bloques de teoria, practica o descanso.
- Mostrar recursos necesarios.
- Mostrar pasos metodologicos.
- Permitir iniciar el primer bloque en Modo Enfoque.

## Componentes Compartidos

### UI

`components/ui/Button.tsx`

Boton reutilizable con variantes `primary`, `secondary`, `danger` y `ghost`. Soporta icono, loading, tamaños y texto opcional.

`components/ui/Card.tsx`

Contenedor reutilizable. Puede funcionar como vista simple o como tarjeta presionable.

`components/ui/Input.tsx`

Campo de texto con label, error, foco visual y soporte de props de `TextInput`.

`components/ui/Badge.tsx`

Etiqueta visual para estados como success, danger, warning e info.

`components/ui/MetricCard.tsx`

Tarjeta de metrica con icono, valor y color semantico.

`components/ui/ProgressRing.tsx`

Anillo circular usando `react-native-svg`.

`components/ui/Modal.tsx`

Modal de confirmacion con acciones primaria/secundaria.

### Chat

`components/chat/MessageList.tsx`

Lista scrollable de mensajes.

`components/chat/ChatBubble.tsx`

Burbuja de usuario o IA. Soporta accion embebida, como `Iniciar Bloque 1`.

`components/chat/ChatInput.tsx`

Input inferior para enviar mensajes.

### Focus

`components/focus/TimerDisplay.tsx`

Renderiza el temporizador en formato `mm:ss`.

`components/focus/SensorBadge.tsx`

Muestra estado semantico de sensores.

`components/focus/InstructionText.tsx`

Muestra instruccion animada para colocar el celular boca abajo.

`components/focus/MockIoTButton.tsx`

Boton de prueba para simular que el usuario levanto el dispositivo.

## Hooks

`hooks/useAuth.tsx`

Maneja autenticacion simulada:

- `login`.
- `loginWithGoogle`.
- `register`.
- `logout`.

No hay Supabase real conectado. El comportamiento es mock para prototipo frontend.

`hooks/useFocusTimer.tsx`

Maneja estado de temporizador:

- Tiempo restante.
- Running/paused.
- Sensores activos.
- Distraccion detectada.
- Inicio, pausa, reanudacion y detencion.

## Datos Mock

`constants/mockData.ts`

Contiene:

- Usuario mock.
- Sesiones pasadas.
- Mensajes iniciales del chat IA.
- Metricas del dashboard.
- Proxima sesion sugerida.
- Actividades diarias.
- Planes de estudio.
- Bloques de plan con recursos y pasos.
- Consejo IA.

## Design System

`constants/theme.ts`

Centraliza:

- Colores.
- Espaciado.
- Radios.
- Tipografia.
- Pesos.
- Sombras.
- Tamaños de icono.

Colores principales:

- Background: `#0F172A`.
- Primary: `#6366F1`.
- Success: `#22C55E`.
- Danger: `#EF4444`.
- Surface: `#1E293B`.
- Surface hover: `#334155`.
- Text primary: `#F8FAFC`.
- Text secondary: `#94A3B8`.
- Text muted: `#64748B`.

Tipografia:

- Inter Regular: `Inter_400Regular`.
- Inter SemiBold: `Inter_600SemiBold`.
- Inter Bold: `Inter_700Bold`.

## NativeWind

NativeWind esta configurado, aunque la UI actual usa principalmente `StyleSheet`.

Archivos relacionados:

- `global.css`.
- `tailwind.config.js`.
- `metro.config.js`.
- `nativewind-env.d.ts`.
- `babel.config.js`.

Esto permite crear nuevos componentes con `className` sin reescribir toda la UI existente.

## Assets

`assets/` contiene icono, splash, adaptive icon, favicon e icono SVG.

Los PNG fueron regenerados como imagenes validas para evitar errores de MIME durante Expo Web/Android.

## Documentacion Existente

En el repositorio actual se encuentran:

- `README.md`: descripcion breve del proyecto FocusSync.
- `ARQUITECTURA_PROYECTO.md`: este documento de arquitectura.
- `AGENTS.md` y `CLAUDE.md`: notas auxiliares de trabajo para asistentes de desarrollo.

Documentos de analisis usados durante el proceso, pero no presentes actualmente en el repositorio:

- Especificacion de pantallas y refinamiento IoT.
- Descripcion UX/UI por figuras del prototipo.
- Diagnostico de reparacion y migracion a SDK 54.
- Matriz de cumplimiento contra el prototipo.

## Comandos de Desarrollo

Instalar dependencias:

```bash
npm install
```

Iniciar Expo:

```bash
npx expo start --clear
```

Android:

```bash
npx expo start --android
```

Web:

```bash
npx expo start --web --clear
```

Validar TypeScript:

```bash
npx tsc --noEmit
```

Validar dependencias Expo:

```bash
npx expo install --check
```

Validar proyecto con Expo Doctor:

```bash
npx expo-doctor@latest
```

Export web:

```bash
npx expo export --platform web --clear
```

## Estado Actual de Validacion

Ultimas verificaciones realizadas:

- TypeScript sin errores.
- Dependencias Expo alineadas.

Verificaciones pendientes o dependientes del entorno:

- Expo Doctor sin issues.
- Export web funcional.

## Pendientes Recomendados

- Mover pantallas existentes de `app/(tabs)` a `features/*/screens` para completar la reestructuracion.
- Reemplazar progresivamente iconos de `@expo/vector-icons` por `lucide-react-native` si se quiere homogeneidad visual.
- Convertir pantallas a NativeWind solo si se decide abandonar `StyleSheet`.
- Integrar Supabase Auth real si el prototipo pasa a fase funcional.
- Integrar Gemini API real si el chat deja de ser mock.
- Persistir planes, sesiones e interrupciones en backend real.
