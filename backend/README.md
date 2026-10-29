# Backend — Gym Manager

> **Tecnologías:** Node.js, TypeScript y MongoDB Atlas.

---

## 1. Descripción

Esta carpeta contiene el backend de **Gym Manager**, desarrollado con TypeScript y Node.js. El servidor utiliza el módulo `http` nativo para recibir las peticiones y el driver oficial `mongodb` para acceder a MongoDB Atlas.

Incluye una conexión reutilizable a la base de datos, ejecución de transacciones, una prueba de conexión y la ruta `GET /api/salud`. También incorpora registro, login, consulta y cierre de sesión, y funciones comunes para comprobar permisos por rol. Entrega los archivos del frontend compilado desde la misma dirección que la API.

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

Al abrir `http://localhost:3000/`, la página inicial consulta la sesión. Si no hay una sesión válida, dirige al login. Si existe una sesión, muestra Mi cuenta dentro de la estructura compartida del panel, con los datos públicos de la cuenta y la opción de cerrar sesión.

La comprobación de funcionamiento del servidor se conserva en `http://localhost:3000/api/salud`, con el mensaje `Backend de GymManager funcionando`.

En este modo el backend entrega el contenido de `frontend/dist` y atiende las peticiones `/api`. No es necesario iniciar el servidor de desarrollo de Vite. Después de modificar el frontend, se debe volver a compilar para actualizar los archivos que entrega el backend.

La ejecución de Vite y el backend en terminales separadas se describe en el [README del frontend](../frontend/README.md).

---

## 7. Archivos principales

| Archivo | Objetivo |
|---|---|
| `src/server.ts` | Inicia el servidor después de conectar a Atlas. Conecta las rutas de salud, registro, login, consulta y cierre de sesión; responde a rutas de API inexistentes y delega la entrega de la web. |
| `src/db.ts` | Comparte un solo `MongoClient`, conecta y cierra la conexión, y permite ejecutar varias operaciones dentro de una transacción con `ejecutarTransaccion`. |
| `src/check-connection.ts` | Comprueba la conexión a Atlas con un ping y cierra la conexión al finalizar. |
| `src/servicios/archivos.ts` | Entrega HTML, CSS, JavaScript e imágenes del frontend compilado. Limita el acceso a `frontend/dist` y a las extensiones permitidas. |
| `src/compartidos/http.ts` | Lee objetos JSON con límite de tamaño, envía respuestas JSON y define `ErrorHTTP` con estado, mensaje y campos incorrectos. |
| `src/controladores/register.ts` | Valida el registro, normaliza el correo y crea una cuenta con rol `USUARIO` junto con su sesión dentro de una transacción. |
| `src/controladores/login.ts` | Comprueba correo, contraseña, cuenta activa y rol; crea una nueva sesión cuando las credenciales son correctas. |
| `src/controladores/sesion.ts` | Identifica al usuario mediante la cookie y la base de datos, responde la consulta de sesión y permite cerrarla. |
| `src/servicios/contrasenas.ts` | Genera hashes bcrypt y compara contraseñas sin guardar el valor original. Comprueba los límites de las nuevas contraseñas. |
| `src/servicios/autenticacion.ts` | Genera tokens y sus hashes, prepara los índices de sesiones y administra las cookies de inicio y cierre. |
| `src/servicios/permisos.ts` | Define `exigirSesion` y `exigirRol` para rechazar operaciones sin sesión válida o con un rol no autorizado. |
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

Cada consulta comprueba el vencimiento, que la cuenta siga activa y que su rol actual sea `ADMIN`, `ENTRENADOR` o `USUARIO`. La comprobación de vencimiento no depende de que el índice TTL ya haya eliminado el documento. La respuesta incluye únicamente datos públicos: identificador, nombre, apellido, correo, rol y cliente asociado.

### 10.3 Cierre de sesión

El cierre elimina el documento correspondiente al hash del token recibido y luego indica al navegador que elimine la cookie. Conserva las sesiones de otros navegadores. Si no hay una sesión, el cierre también puede responder correctamente. Si falla la operación de base de datos, informa el error sin afirmar que la sesión se cerró.

---

## 11. Funciones compartidas y pruebas

### 11.1 Transacciones y permisos

`ejecutarTransaccion` recibe una función con la base de datos y la sesión transaccional de MongoDB. Cada operación relacionada debe utilizar `{ session: transaccion }`. La sesión de MongoDB se libera al terminar. Como MongoDB puede reintentar el bloque, las respuestas HTTP y otros efectos externos se realizan después de confirmar la transacción. Esta sesión transaccional es distinta de la sesión de acceso de un usuario.

`exigirSesion(solicitud)` devuelve el usuario autenticado o lanza `ErrorHTTP` con estado `401`. `exigirRol(solicitud, rolesPermitidos)` exige además uno de los roles indicados y lanza un error `403` cuando el rol no está autorizado. Los controladores deben capturar esos errores y responder con el estado y mensaje correspondientes.

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
