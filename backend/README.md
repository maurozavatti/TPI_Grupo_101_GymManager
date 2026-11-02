# Backend — Gym Manager

> **Tecnologías:** Node.js, TypeScript y MongoDB Atlas.

---

## 1. Descripción

Esta carpeta contiene el backend de **Gym Manager**, desarrollado con TypeScript y Node.js. El servidor utiliza el módulo `http` nativo para recibir las peticiones y el driver oficial `mongodb` para acceder a MongoDB Atlas.

Incluye una conexión reutilizable a la base de datos, ejecución de transacciones, una prueba de conexión y la ruta `GET /api/salud`. También incorpora registro, login, consulta y cierre de sesión, cambio de contraseña propia, administración de cuentas y funciones comunes para comprobar uno o varios roles. Entrega los archivos del frontend compilado desde la misma dirección que la API.

Los controladores de clientes, turnos, pagos y resumen del inicio también están incorporados y conectados en `server.ts`. Sus operaciones y el estado de integración de roles múltiples se describen en las secciones 13 y 14.

Las dependencias de ejecución declaradas son `mongodb` y `bcryptjs`. La compilación y comprobación del código se realizan con TypeScript.

---

## 2. Requisitos

Para ejecutar el proyecto se utiliza:

- Node.js 24 y npm.
- Acceso a la base de datos de MongoDB Atlas.
- Un usuario de base de datos con los permisos correspondientes.
- Acceso de red autorizado desde la computadora en Atlas.

Las versiones instaladas se pueden comprobar con:

```bash
node --version
npm --version
```

---

## 3. Configuración local del entorno

**Para ejecutar el proyecto en una computadora local es necesario crear `backend/.env`, usando `backend/.env.ejemplo` como base.** La plantilla por sí sola no configura la conexión.

Se debe copiar `.env.ejemplo` dentro de la misma carpeta, renombrar la copia como `.env` y completar los valores reales:

```dotenv
MONGODB_URI=mongodb+srv://USUARIO:CONTRASENA@CLUSTER/
MONGODB_DB=NOMBRE_REAL_DE_LA_BASE
PORT=3000
```

| Variable | Uso |
|---|---|
| `MONGODB_URI` | URI real de conexión proporcionada por Atlas, manteniendo sus opciones. |
| `MONGODB_DB` | Nombre exacto de la base de datos utilizada por el proyecto. |
| `PORT` | Puerto del backend. Para el desarrollo local se utiliza `3000`. |
| `NODE_ENV` | En producción se configura como `production` para exigir HTTPS en la cookie mediante `Secure`. Para probar localmente por HTTP no se utiliza ese valor. |

El `.env` queda fuera de Git porque contiene credenciales. El repositorio incluye solamente `.env.ejemplo` con valores de muestra.

**No se debe dejar `PORT=` vacío:** ese valor se convierte en `0` y Node.js elige un puerto disponible. Si la variable no existe, el servidor utiliza `3000` como valor predeterminado.

La conexión a Atlas se realiza desde el backend. La URI y la contraseña no se envían al frontend.

---

## 4. Instalación y prueba de conexión

Desde la **raíz del repositorio**, donde están `backend` y `frontend`, se instalan las dependencias del backend:

```bash
npm --prefix backend ci
```

Después de crear y completar `backend/.env`, se ejecuta:

```bash
npm --prefix backend run check:db
```

Este comando compila el backend, carga el `.env` y realiza un ping a Atlas. No crea ni modifica documentos. Al terminar cierra la conexión.

El resultado esperado es:

```text
Conexion y ping a MongoDB Atlas exitosos.
```

---

## 5. Ejecución local del backend

Desde la **raíz del repositorio**, se ejecutan estos comandos uno por uno:

```bash
npm --prefix backend run build
npm --prefix backend start
```

El servidor primero se conecta a Atlas y después empieza a recibir peticiones. Con `PORT=3000`, la ruta de comprobación es:

```text
http://localhost:3000/api/salud
```

La respuesta esperada es:

```json
{"mensaje":"Backend de GymManager funcionando"}
```

Esta ruta comprueba que el servidor responde. La conexión a Atlas se establece durante el arranque; la prueba específica de ping se ejecuta con `check:db`.

Después de modificar el código del backend, se debe detener el proceso con `Ctrl+C`, volver a compilar y ejecutar `start` nuevamente. El comando `start` ejecuta los archivos compilados de `dist`.

---

## 6. Ejecución de la web completa desde el backend

Para ejecutar la página y la API desde una sola dirección, primero se instalan las dependencias de ambos proyectos. Desde la **raíz del repositorio**:

```bash
npm --prefix frontend ci
npm --prefix backend ci
```

Con el `.env` del backend completo, se compilan los proyectos y se inicia el servidor:

```bash
npm --prefix frontend run build
npm --prefix backend run build
npm --prefix backend start
```

Al abrir `http://localhost:3000/`, la página inicial consulta la sesión. Si no hay una sesión válida, dirige al login. Si la cuenta posee `ADMIN` o `ENTRENADOR`, dirige al inicio del panel. Las cuentas que solo poseen `USUARIO` se dirigen a Mi cuenta. Esta página tiene su propio HTML y permite consultar los datos de sesión y cambiar la contraseña.

La comprobación de funcionamiento del servidor se conserva en `http://localhost:3000/api/salud`, con el mensaje `Backend de GymManager funcionando`.

En este modo el backend entrega el contenido de `frontend/dist` y atiende las peticiones `/api`. No es necesario iniciar el servidor de desarrollo de Vite. Después de modificar el frontend, se debe volver a compilar para actualizar los archivos que entrega el backend.

La ejecución de Vite y el backend en terminales separadas se describe en el [README del frontend](../frontend/README.md).

---

## 7. Archivos principales

| Archivo | Objetivo |
|---|---|
| `src/server.ts` | Inicia el servidor después de conectar a Atlas. Conecta salud, autenticación, cuenta propia, administración de cuentas, clientes, turnos, pagos y resumen; responde a rutas de API inexistentes y delega la entrega de la web. |
| `src/db.ts` | Comparte un solo `MongoClient`, conecta y cierra la conexión, y permite ejecutar varias operaciones dentro de una transacción con `ejecutarTransaccion`. |
| `src/check-connection.ts` | Comprueba la conexión a Atlas con un ping y cierra la conexión al finalizar. |
| `src/servicios/archivos.ts` | Entrega HTML, CSS, JavaScript e imágenes del frontend compilado. Limita el acceso a `frontend/dist` y a las extensiones permitidas. |
| `src/compartidos/http.ts` | Lee objetos JSON con límite de tamaño, envía respuestas JSON y define `ErrorHTTP`. También valida textos, identificadores, enteros y fechas de Argentina. |
| `src/compartidos/modelos.ts` | Define los tipos `ConfiguracionAgenda` y `Turno`, con franjas, cupos, entrenador, clientes e historial de asignaciones. |
| `src/compartidos/reglas.ts` | Define los días de la semana admitidos y comprueba el formato y orden de los horarios. |
| `src/controladores/register.ts` | Valida el registro, normaliza el correo y crea una cuenta con rol `USUARIO` junto con su sesión dentro de una transacción. |
| `src/controladores/login.ts` | Comprueba correo, contraseña, cuenta activa y formato de uno o varios roles; crea una sesión cuando las credenciales son correctas. |
| `src/controladores/sesion.ts` | Identifica al usuario mediante la cookie y la base de datos, responde la consulta de sesión y permite cerrarla. |
| `src/servicios/contrasenas.ts` | Genera hashes bcrypt y compara contraseñas sin guardar el valor original. Comprueba los límites de las nuevas contraseñas. |
| `src/servicios/autenticacion.ts` | Genera tokens y sus hashes, prepara los índices de sesiones y administra las cookies de inicio y cierre. |
| `src/controladores/cuenta.ts` | Cambia la contraseña de la cuenta autenticada, cierra sus sesiones anteriores y crea una nueva para mantener abierto el navegador actual. |
| `src/controladores/cuentas.ts` | Lista y crea cuentas; modifica sus roles; aplica baja lógica o reactivación. Todas sus operaciones requieren `ADMIN`. |
| `src/controladores/clientes.ts` | Lista, crea y edita fichas; aplica baja lógica o reactivación y vincula una cuenta con una ficha. La baja libera los turnos asignados. |
| `src/controladores/turnos.ts` | Gestiona turnos semanales, configuración de agenda, generación por horas, asignación/retiro de clientes y operaciones en lote. |
| `src/controladores/pagos.ts` | Lista pagos, registra inscripciones o cuotas pagadas/pendientes y marca una obligación como pagada. Actualiza los pendientes vencidos al listar. |
| `src/controladores/resumen.ts` | Consulta ocupación y turnos del día, clientes activos, ingresos del mes y cuotas vencidas o próximas a vencer. |
| `src/servicios/permisos.ts` | Define `tieneRol`, `exigirSesion` y `exigirRol`; comprueba pertenencia a los roles permitidos y rechaza con `401` o `403`. |
| `src/servicios/roles.ts` | Define `RolesCuenta` y las funciones `esRolCuenta`, `obtenerRoles` e `incluyeRol` para interpretar un rol como texto o varios como array. |
| `pruebas/permisos.test.mjs` | Comprueba la lógica de sesiones y roles con consultas simuladas, sin acceder a Atlas. |
| `.env.ejemplo` | Contiene la plantilla para crear la configuración local sin publicar credenciales. |
| `tsconfig.json` | Configura TypeScript para compilar desde `src` hacia `dist`. |
| `package.json` | Declara las dependencias y los comandos del backend. |
| `package-lock.json` | Registra las versiones de las dependencias para reproducir la instalación. |

---

## 8. Comandos disponibles

Los siguientes comandos se ejecutan **dentro de `backend`**:

| Comando | Función |
|---|---|
| `npm run check` | Comprueba TypeScript sin generar archivos ni conectarse a Atlas. |
| `npm run build` | Compila el código y genera `dist`. |
| `npm start` | Ejecuta el servidor compilado y carga `.env` si existe. |
| `npm run check:db` | Compila y prueba la conexión a Atlas usando el `.env` local. |
| `npm test` | Compila el backend y ejecuta las ocho pruebas automáticas de permisos. No necesita `.env` ni se conecta a Atlas. |

Las carpetas `dist` y `node_modules`, junto con el `.env` real, están excluidas del repositorio mediante `.gitignore`.

---

## 9. Variables en Render

El servidor permite ejecutar la web y la API juntas en Render. Los comandos de instalación, compilación y arranque se configuran en el servicio. `MONGODB_URI` y `MONGODB_DB` se cargan como variables de entorno, sin subir el `.env`. Se utiliza Node.js 24 y el puerto `PORT` proporcionado por Render.

El comando `start` permite que el archivo `.env` no exista, pero los datos reales de conexión siguen siendo necesarios para que el servidor arranque.

Para que la cookie exija HTTPS se configura también `NODE_ENV=production`.

---

## 10. Registro, login y sesiones

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/api/salud` | Comprueba que el servidor responde. |
| `POST` | `/api/register` | Recibe `nombre`, `apellido`, `email` y `contrasena`; crea una cuenta y su sesión. |
| `POST` | `/api/login` | Recibe `email` y `contrasena`; comprueba las credenciales y crea una sesión. |
| `GET` | `/api/sesion` | Devuelve el usuario autenticado o responde `401` si no hay una sesión válida. |
| `POST` | `/api/logout` | Recibe un objeto JSON, que puede ser `{}`, elimina la sesión actual y borra su cookie. |

Las peticiones POST utilizan `Content-Type: application/json`. Registro y login admiten cuerpos de hasta 16 KiB; el cierre de sesión admite hasta 1 KiB. `leerJSON` comprueba que el contenido sea un objeto y rechaza formatos inválidos o cuerpos demasiado grandes.

### 10.1 Registro y contraseñas

El registro público siempre asigna el rol `USUARIO` y no crea una ficha de cliente. Nombre y apellido son obligatorios y admiten hasta 100 caracteres cada uno. El correo admite hasta 254 caracteres; se guarda sin espacios en los extremos y en minúsculas. Su índice único evita duplicados incluso ante registros simultáneos. Si el correo ya existe, la API responde `409` e indica el campo `correo`.

Las nuevas contraseñas requieren al menos 8 caracteres, no pueden contener solamente espacios y admiten hasta 72 bytes por el límite de bcrypt. Se genera un hash con costo 12; la contraseña original no se guarda, no se recorta ni se convierte a minúsculas.

La cuenta y su primera sesión se guardan en una misma transacción. La cookie se envía después de confirmar ambas inserciones. Las cuentas sin una ficha vinculada omiten `clienteId` en MongoDB para respetar su índice único sparse; en la respuesta pública se representa como `null`.

### 10.2 Inicio y consulta de sesión

El login utiliza el mismo mensaje de credenciales incorrectas para un correo inexistente, una contraseña incorrecta o una cuenta inactiva. Un hash auxiliar permite realizar una comparación también cuando no existe la cuenta, reduciendo diferencias de tiempo. Ese hash no corresponde a un usuario ni permite acceder como cuenta de respaldo.

Cada ingreso correcto genera una sesión nueva de 8 horas. El navegador recibe la cookie `gymmanager_sesion` con `HttpOnly`, `SameSite=Lax`, `Path=/` y una duración de 8 horas. En producción también utiliza `Secure`.

La colección `sesiones` guarda `usuarioId`, `tokenHash`, `fechaCreacion` y `fechaVencimiento`. El token original no se guarda en la base ni se incluye como dato JSON. Un índice único protege el hash y un índice TTL permite limpiar sesiones vencidas.

Cada consulta comprueba el vencimiento, que la cuenta siga activa y que el campo `rol` contenga un texto válido o un array no vacío de valores válidos y sin repetidos. Los valores admitidos son `ADMIN`, `ENTRENADOR` y `USUARIO`. La comprobación de vencimiento no depende de que el índice TTL ya haya eliminado el documento. La respuesta incluye únicamente datos públicos: identificador, nombre, apellido, correo, rol y cliente asociado.

### 10.3 Cierre de sesión

El cierre elimina el documento correspondiente al hash del token recibido y luego indica al navegador que elimine la cookie. Conserva las sesiones de otros navegadores. Si no hay una sesión, el cierre también puede responder correctamente. Si falla la operación de base de datos, informa el error sin afirmar que la sesión se cerró.

---

## 11. Funciones compartidas y pruebas

### 11.1 Transacciones y permisos

`ejecutarTransaccion` recibe una función con la base de datos y la sesión transaccional de MongoDB. Cada operación relacionada debe utilizar `{ session: transaccion }`. La sesión de MongoDB se libera al terminar. Como MongoDB puede reintentar el bloque, las respuestas HTTP y otros efectos externos se realizan después de confirmar la transacción. Esta sesión transaccional es distinta de la sesión de acceso de un usuario.

`exigirSesion(solicitud)` devuelve el usuario autenticado o lanza `ErrorHTTP` con estado `401`. `exigirRol(solicitud, rolesPermitidos)` exige además que alguno de los roles de la cuenta coincida con los indicados y lanza un error `403` cuando ninguno está autorizado. `tieneRol(usuario, rolesPermitidos)` permite efectuar la misma comprobación sobre un usuario ya obtenido. Los controladores deben capturar esos errores y responder con el estado y mensaje correspondientes.

Las funciones se utilizan dentro de cada controlador protegido; no protegen rutas automáticamente. Cada módulo comprueba también el permiso sobre el recurso concreto solicitado. La redirección del frontend y la visibilidad de los botones no reemplazan la autorización del backend.

### 11.2 Pruebas automáticas

Desde la **raíz del repositorio**:

```bash
npm --prefix backend run check
npm --prefix backend test
```

Las pruebas se ejecutan con el módulo `node:test` y utilizan los archivos compilados. Simulan las consultas y verifican estos ocho casos:

1. Ausencia de cookie: rechazo `401` sin consultar la base.
2. Cookie mal formada: rechazo `401`.
3. Sesión inexistente: rechazo `401`.
4. Cuenta inactiva: rechazo `401`.
5. `ADMIN` autorizado para una operación administrativa.
6. `ENTRENADOR` autorizado cuando su rol está permitido.
7. `USUARIO` rechazado con `403` en una operación exclusiva de `ADMIN`.
8. Propagación de un fallo de conexión sin convertirlo en una sesión cerrada.

Estas pruebas no crean cuentas ni modifican Atlas. Las pruebas del flujo real se realizan con el servidor iniciado y el navegador: registro, ingreso, consulta de sesión, recarga y cierre.

Las ocho pruebas actuales utilizan roles individuales como texto. No cubren todavía arrays de roles, altas administrativas, edición de roles, cambio de contraseña, baja/reactivación ni las reglas de clientes, turnos y pagos. Que estas pruebas pasen no certifica la integración completa de esos flujos.

---

## 12. Cuenta propia y administración de cuentas

| Método | Ruta | Datos y comportamiento |
|---|---|---|
| `POST` | `/api/cuenta/contrasena` | Recibe `actual`, `nueva` y `confirmacion`. Requiere una sesión válida de cualquier rol. |
| `GET` | `/api/cuentas` | Lista cuentas activas e inactivas con identificador, nombre, apellido, correo, roles, estado y cliente vinculado. Requiere `ADMIN`. |
| `POST` | `/api/cuentas` | Crea una cuenta con `nombre`, `apellido`, `email`, `contrasena` y `rol`. Requiere `ADMIN`. |
| `POST` | `/api/cuentas/roles` | Recibe `id` y `rol`; actualiza los roles y `fechaModificacion`. Requiere `ADMIN`. |
| `POST` | `/api/cuentas/desactivar` | Recibe `id`; aplica baja lógica y elimina las sesiones de la cuenta en una transacción. Requiere `ADMIN`. |
| `POST` | `/api/cuentas/reactivar` | Recibe `id`; activa la cuenta y elimina `fechaBaja`. Requiere `ADMIN`. |

### 12.1 Cambio de contraseña

Se identifica la cuenta mediante la sesión, sin aceptar un identificador de usuario enviado por el formulario. Se comprueba la contraseña actual, la coincidencia de la confirmación y las reglas compartidas de la nueva contraseña. Se rechaza una nueva contraseña idéntica a la actual.

Una transacción actualiza el hash, elimina las sesiones anteriores e inserta una nueva. La actualización exige que el hash siga siendo el leído para no sobrescribir otro cambio de contraseña simultáneo. Después de confirmar, se renueva la cookie: el navegador actual continúa conectado y las otras sesiones dejan de ser válidas.

### 12.2 Alta, roles y estado

El alta administrativa no inicia sesión como la cuenta creada ni modifica la sesión del administrador. Guarda `rol` como array, incluso si solo se seleccionó un rol. El registro público continúa guardando el texto `USUARIO`; ambos formatos son aceptados por los servicios comunes. El correo se normaliza y su índice único impide duplicados. No se crea una ficha de cliente ni se almacena `clienteId` hasta vincular una ficha.

No se permite quitarse `ADMIN` ni desactivar la propia cuenta desde la sesión administrativa. Esos controles protegen la cuenta que realiza la operación; no implementan una garantía global sobre modificaciones concurrentes entre distintos administradores.

La baja de una cuenta conserva sus datos y su vínculo con el cliente. No da de baja la ficha ni libera sus turnos: esas operaciones corresponden a la gestión de clientes. Reactivar permite ingresar de nuevo, pero no recupera las sesiones eliminadas.

La primera cuenta administrativa se prepara manualmente en MongoDB con un hash compatible y los campos requeridos. El servidor no crea cuentas administrativas ni credenciales predeterminadas al iniciar.

---

## 13. Clientes, turnos, pagos e inicio

Estas rutas ya están conectadas. Los permisos descritos son el alcance de cada módulo; las comprobaciones que aún requieren adaptación al formato array se detallan en la sección 14.

| Método | Ruta | Operación y acceso |
|---|---|---|
| `GET` | `/api/clientes` | Listado para `ADMIN` y `ENTRENADOR`, sin historia clínica. |
| `POST` | `/api/clientes` | Alta de ficha por `ADMIN`. |
| `POST` | `/api/clientes/editar` | Edición por `ADMIN`, usando `clienteId`. |
| `POST` | `/api/clientes/desactivar` / `/api/clientes/reactivar` | Cambio de estado por `ADMIN`. La baja libera cupos de turnos dentro de la misma transacción. |
| `POST` | `/api/clientes/vincular` | Vinculación por `ADMIN` con `clienteId`, `correoCuenta` y `confirmado: true`. Exige ficha y cuenta activas y sin vínculo previo. |
| `GET` | `/api/turnos` | Lista turnos con horario, entrenador, cupo, ocupación y estado para el personal. |
| `GET` | `/api/turnos/configuracion` | Consulta franjas, cupo y días de trabajo. |
| `POST` | `/api/turnos` / `/api/turnos/editar` | Crea o edita un turno. Usa `turnoId` para editar. |
| `POST` | `/api/turnos/estado` | Cambia el estado mediante `turnoId` y `activo`. |
| `POST` | `/api/turnos/asignar` / `/api/turnos/retirar` | Asigna o retira un cliente usando `turnoId` y `clienteId`. |
| `POST` | `/api/turnos/generar` | Recibe `franjas`, `capacidad` y `trabajos`; genera bloques de una hora conservando clientes de turnos coincidentes. |
| `POST` | `/api/turnos/lote` | `ADMIN`: recibe `ids`, `eliminar` y `confirmado: true`; realiza baja lógica o eliminación definitiva de turnos seleccionados. |
| `GET` | `/api/pagos` | `ADMIN`: lista pagos; admite `?clienteId=...`. |
| `POST` | `/api/pagos` | `ADMIN`: registra inscripción o cuota con cliente, monto, observaciones, vencimiento y condición de pagado. |
| `POST` | `/api/pagos/pagar` | `ADMIN`: marca como pagado un pendiente o vencido mediante `pagoId`. |
| `GET` | `/api/resumen` | Personal: turnos y ocupación de hoy; `ADMIN` recibe además indicadores administrativos. |

### 13.1 Datos y reglas implementadas

Clientes exige nombre, apellido y DNI de siete u ocho dígitos. El DNI tiene índice único; la vinculación con cuenta se actualiza en ambos documentos dentro de una transacción. Los datos clínicos no forman parte del listado general.

La agenda guarda su configuración en `configuracion`, con un documento identificado por el backend. Contiene franjas de apertura, capacidad y días de trabajo por entrenador. La implementación actual admite de una a cuatro franjas, cupos enteros de 1 a 100 y hasta 50 entrenadores en una solicitud de generación. El entrenador debe estar activo y poseer `ENTRENADOR`. La agenda y los turnos generados se guardan en una transacción. La generación no elimina automáticamente otros horarios existentes.

Las asignaciones comprueban cupo, cliente activo y superposición horaria antes de escribir; el chequeo y la escritura todavía están separados y no garantizan el cupo ante solicitudes simultáneas.

Pagos admite `INSCRIPCION` y `CUOTA`, montos enteros y estados `PAGADO`, `PENDIENTE` o `VENCIDO`. Las fechas ingresadas como día se interpretan en horario de Argentina. Al listar se promueven a vencidos los pendientes cuya fecha pasó. Las obligaciones se registran manualmente: no se generan cuotas nuevas automáticamente cada 30 días ni se limita el listado exclusivamente a clientes activos.

Resumen calcula el día de los turnos con la zona `America/Argentina/Buenos_Aires`, su ocupación total, clientes activos, ingresos del mes y obligaciones vencidas o próximas a vencer en siete días. El inicio de mes se construye con la zona horaria del proceso; conviene alinear ese cálculo con Argentina al desplegar.

---

## 14. Contrato de roles y compatibilidad de módulos

El campo se sigue llamando `rol`. Los servicios comunes aceptan estos dos formatos:

```js
rol: 'ADMIN'
rol: ['ADMIN', 'ENTRENADOR']
```

`esRolCuenta` valida los valores; `obtenerRoles` devuelve una lista y `incluyeRol` comprueba si alguno coincide con los permitidos. No se agrega un campo separado para indicar que un administrador también es entrenador. Una cuenta que posee `ADMIN` conserva el alcance administrativo aunque también tenga `ENTRENADOR`.

**La adaptación aún no está completa en todos los módulos.** Login, consulta de sesión, permisos comunes, cuenta propia y administración de cuentas ya reconocen arrays. En clientes, turnos, pagos y resumen aún existen comparaciones JavaScript directas como `personal.rol === 'ADMIN'`. Estas comparaciones no reconocen arrays, ni siquiera `['ADMIN']`; requieren usar las funciones compartidas y preservar las restricciones sobre recursos propios cuando la cuenta no posee `ADMIN`.

Los filtros de MongoDB como `{ rol: 'ENTRENADOR' }` sí coinciden con un texto o con un elemento de un array. No deben confundirse con las comparaciones directas de JavaScript ni reescribirse automáticamente.

La validación real de `usuarios.rol` debe admitir ambos formatos. El script versionado `../database/crear_colecciones.js` todavía conserva el enum de texto y requiere actualización para reproducir el esquema compatible en otra base. Modificar el script no actualiza por sí solo una colección existente; su validator se administra en MongoDB. Los documentos del esquema y seguridad también deben alinearse con el contrato de roles múltiples.
