# Backend — Gym Manager

> **Tecnologías:** Node.js, TypeScript y MongoDB Atlas.

---

## 1. Descripción

Esta carpeta contiene el backend de **Gym Manager**, desarrollado con TypeScript y Node.js. El servidor utiliza el módulo `http` nativo para recibir las peticiones y el driver oficial `mongodb` para acceder a MongoDB Atlas.

Incluye una conexión reutilizable a la base de datos, una prueba de conexión y la ruta `GET /api/salud`. También entrega los archivos del frontend compilado desde la misma dirección que la API.

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

Al abrir `http://localhost:3000/`, la página inicial muestra:

```text
GymManager — Backend de GymManager funcionando
```

En este modo el backend entrega el contenido de `frontend/dist` y atiende las peticiones `/api`. No es necesario iniciar el servidor de desarrollo de Vite. Después de modificar el frontend, se debe volver a compilar para actualizar los archivos que entrega el backend.

La ejecución de Vite y el backend en terminales separadas se describe en el [README del frontend](../frontend/README.md).

---

## 7. Archivos principales

| Archivo | Objetivo |
|---|---|
| `src/server.ts` | Inicia el servidor después de conectar a Atlas. Atiende `/api/salud`, responde a rutas de API inexistentes y delega la entrega de la web. |
| `src/db.ts` | Comparte un solo `MongoClient` y define las funciones para conectar y cerrar la conexión. |
| `src/check-connection.ts` | Comprueba la conexión a Atlas con un ping y cierra la conexión al finalizar. |
| `src/servicios/archivos.ts` | Entrega HTML, CSS, JavaScript e imágenes del frontend compilado. Limita el acceso a `frontend/dist` y a las extensiones permitidas. |
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

Las carpetas `dist` y `node_modules`, junto con el `.env` real, están excluidas del repositorio mediante `.gitignore`.

---

## 9. Variables en Render

El servidor permite ejecutar la web y la API juntas en Render. Los comandos de instalación, compilación y arranque se configuran en el servicio. `MONGODB_URI` y `MONGODB_DB` se cargan como variables de entorno, sin subir el `.env`. Se utiliza Node.js 24 y el puerto `PORT` proporcionado por Render.

El comando `start` permite que el archivo `.env` no exista, pero los datos reales de conexión siguen siendo necesarios para que el servidor arranque.
