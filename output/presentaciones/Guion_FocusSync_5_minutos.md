# FocusSync: guion de cinco minutos

Duración objetivo: 5:00. Los tiempos incluyen pausas y cambios de diapositiva. Ensaya con cronómetro para ajustar tu ritmo.

La sección 6 presenta una decisión real del código. Confirma quién la desarrolló antes de atribuirla a una persona. No se proporcionaron nombres de integrantes ni materia.

## 1. FocusSync (0:00–0:35)

Pensemos en una situación cotidiana: tenemos un examen, nos sentamos a estudiar y dejamos el teléfono a un lado. Poco después lo levantamos, perdemos el hilo y volvemos a empezar. Al terminar, sabemos cuánto tiempo pasó, pero no cuánto aprovechamos. FocusSync parte de ese problema: organizar el estudio y reconocer las interrupciones. Está dirigido a estudiantes que necesitan una rutina más clara y una forma de revisar su actividad.

## 2. El valor de FocusSync (0:35–1:15)

El valor de FocusSync consiste en conectar la planificación con lo que realmente ocurre durante una sesión. El estudiante puede pedir ayuda para organizar un tema, elegir un bloque y comenzar a trabajar. Después puede consultar su historial. Así, la propuesta reúne acciones que suelen quedar separadas: decidir qué estudiar y revisar cómo se estudió. No afirmamos que la aplicación garantice mejores calificaciones. Buscamos ofrecer una herramienta para tomar decisiones sobre la propia rutina a partir de la actividad registrada.

## 3. Una sesión de estudio (1:15–2:05)

Veamos un ejemplo ilustrativo. Un estudiante escribe: tengo cincuenta y cinco minutos para repasar bases de datos. El plan puede dividirse en veinticinco minutos de teoría, cinco de descanso y veinticinco de práctica. El estudiante revisa los pasos y abre un bloque en el modo enfoque. En un teléfono compatible, el cronómetro espera a que el dispositivo esté boca abajo. Si se levanta durante la sesión, la aplicación detecta la interrupción y pausa el enfoque. Luego el estudiante puede retomar el bloque y consultar la actividad. Este ejemplo describe el recorrido. El historial de prueba que preparamos contiene datos simulados y no representa una evaluación con usuarios.

## 4. Beneficios para el estudiante (2:05–2:45)

Los beneficios esperados se relacionan con decisiones concretas. Primero, dividir un tema en bloques ayuda a saber por dónde comenzar. Segundo, registrar interrupciones permite reconocer cuándo se rompe la sesión, en lugar de depender solamente de la memoria. Tercero, el historial y la meta diaria ofrecen una referencia para revisar la constancia. Esto puede servir como apoyo al aprendizaje autónomo. Todavía necesitamos observar el uso real para medir esos beneficios. Por eso distinguimos entre lo que la aplicación permite hacer y el impacto que esperamos comprobar con estudiantes.

## 5. La tecnología que lo sostiene (2:45–3:30)

La implementación utiliza Expo y React Native para la aplicación móvil y el acceso a los sensores. Supabase gestiona la autenticación y la base de datos. Cada plan pertenece a un usuario, los bloques pertenecen a un plan y las sesiones registran su ejecución. Las reglas de acceso buscan que cada persona consulte sus propios datos. Para generar planes, la app llama a una función del servidor que utiliza Gemini. La clave de ese servicio permanece en el servidor. Esta estructura permite relacionar la solicitud de estudio con el plan y con las sesiones guardadas, en lugar de mostrar información aislada.

## 6. Un reto concreto del proyecto (3:30–4:25)

Un reto concreto que podemos explicar está en el modo enfoque. Los sensores notifican cambios continuamente. Si cada lectura generara una distracción, una sola acción podría producir varios registros. El código utiliza una bandera para recordar que esa interrupción ya fue atendida. Cuando comienza o se retoma el enfoque, restablece ese control. Una comprobación útil consiste en iniciar un bloque, levantar el teléfono y revisar que aparezca un solo evento para esa interrupción. Después se reanuda y se repite la acción. Este ejemplo muestra una decisión verificable en el proyecto. Antes de exponer, quien desarrolló esta parte debe explicar su contribución personal y el resultado que realmente observó.

## 7. El siguiente paso (4:25–5:00)

FocusSync propone una forma de organizar el estudio y revisar cómo se lleva a cabo. Su valor está en unir el plan con la actividad del estudiante. El siguiente paso que proponemos es realizar una prueba completa con estudiantes: pedir un plan, ejecutar un bloque y revisar el historial. Queremos escuchar si el recorrido resulta claro y si la información les ayuda a ajustar su rutina. Con esas observaciones podremos priorizar mejoras y evaluar el aporte real de la aplicación. Gracias.