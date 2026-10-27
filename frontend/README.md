# Frontend — Gym Manager

> **Tecnologías:** HTML, CSS, TypeScript y Vite.

---

## 1. Descripción

Esta carpeta contiene el frontend de **Gym Manager**, desarrollado con HTML, CSS y TypeScript mediante Vite y su plantilla `vanilla-ts`.

La página inicial consulta `GET /api/salud` y muestra el resultado de la comunicación con el backend.

Las peticiones se envían a la API. El backend concentra el acceso a MongoDB Atlas y mantiene las credenciales de la base fuera del frontend.

---

## 2. Requisitos y configuración local

Para trabajar con el frontend se utiliza Node.js 24 y npm. El backend debe estar configurado y ejecutándose para probar la comunicación completa.

**Antes de probar el proyecto en una computadora local es necesario crear `backend/.env` usando `backend/.env.ejemplo` como base y completar la URI real de Atlas y el nombre de la base.** Para el desarrollo local se utiliza `PORT=3000`, que coincide con el destino configurado en el proxy de Vite.

La plantilla `.env.ejemplo` no contiene por sí sola una conexión lista para usar. Si la configuración real no está completa, el backend no podrá iniciar y la página mostrará que no pudo conectarse.

Las credenciales de MongoDB se configuran únicamente en el backend. El `.env` real está excluido de Git.

El detalle de las variables y la prueba de Atlas está en el [README del backend](../backend/README.md).

---

## 3. Instalación

Desde la **raíz del repositorio**, donde están `frontend` y `backend`, se instalan las dependencias de ambos:

```bash
npm --prefix frontend ci
npm --prefix backend ci
```

Los archivos `package-lock.json` incluidos en el repositorio permiten reproducir la instalación.

---

## 4. Desarrollo local con Vite

El desarrollo local se realiza con dos terminales abiertas. Los comandos de ambas se ejecutan desde la **raíz del repositorio**.

### Terminal 1 — Backend

Con `backend/.env` creado y completo, se ejecuta:

```bash
npm --prefix backend run build
npm --prefix backend start
```

Con `PORT=3000`, el backend queda disponible en `http://localhost:3000`.

### Terminal 2 — Frontend

Se ejecuta:

```bash
npm --prefix frontend run dev
```

La dirección para abrir en el navegador es la que informa Vite en la terminal. Normalmente es `http://localhost:5173/`. Si ese puerto está ocupado, Vite puede elegir otro.

Con ambos procesos funcionando, la página muestra:

```text
GymManager — Backend de GymManager funcionando
```

Vite actualiza la página al modificar los archivos del frontend. Cada proceso se detiene con `Ctrl+C` en su terminal.

Después de modificar el backend, se debe detener el proceso, volver a compilar y ejecutar el servidor nuevamente.

---

## 5. Comunicación con el backend

El archivo `vite.config.ts` configura un proxy para el desarrollo local. Las peticiones que empiezan con `/api` se reenvían al backend ubicado en `http://localhost:3000`.

Por ejemplo, una petición desde la página se escribe así:

```ts
fetch('/api/salud')
```

Durante el desarrollo la petición sigue este recorrido:

```text
Frontend en localhost:5173/api/salud
                ↓
Backend en localhost:3000/api/salud
```

Esto permite usar rutas relativas sin escribir la dirección completa del backend en cada petición. Si se modifica el puerto local del backend, también se debe actualizar `target` en `vite.config.ts`.

El proxy funciona con el servidor de desarrollo de Vite y reenvía las peticiones HTTP que el código de la página realiza a las rutas `/api`.

---

## 6. Prueba de comunicación

La comunicación se puede comprobar con estas pruebas:

1. Con el backend encendido, abrir la página del frontend y comprobar que muestra el mensaje de funcionamiento.
2. Detener solamente el backend y recargar la página. Debe aparecer `GymManager — No se pudo conectar con el backend.`
3. Iniciar nuevamente el backend y recargar para recuperar la respuesta correcta.

Esta prueba comprueba la comunicación HTTP entre ambos proyectos. Para probar específicamente el acceso a Atlas se ejecuta `npm --prefix backend run check:db` desde la raíz, con `backend/.env` completo.

---

## 7. Compilación y ejecución desde un solo servidor

Para comprobar el frontend compilado junto con el backend, primero se detienen los procesos anteriores. Con las dependencias instaladas y el `.env` completo, se ejecuta desde la **raíz del repositorio**:

```bash
npm --prefix frontend run build
npm --prefix backend run build
npm --prefix backend start
```

La web queda disponible en `http://localhost:3000/`. El backend entrega los archivos de `frontend/dist` y responde a las peticiones `/api` desde la misma dirección. En este modo no es necesario iniciar Vite ni utilizar su proxy.

Después de modificar archivos del frontend, se debe volver a compilar para actualizar la versión que entrega el backend. Esta forma de ejecución también permite el despliegue conjunto en Render.

La compilación incluye `index.html` y los recursos que utiliza.

---

## 8. Archivos principales

| Archivo | Objetivo |
|---|---|
| `index.html` | Define el documento inicial, el idioma español, el título y la carga de `src/main.ts`. |
| `src/main.ts` | Consulta `/api/salud` y muestra el resultado de la comunicación con el backend. |
| `src/style.css` | Define los estilos de la página inicial. |
| `vite.config.ts` | Configura el reenvío de las peticiones `/api` al backend durante el desarrollo local. |
| `tsconfig.json` | Configura la comprobación del código TypeScript del frontend. |
| `package.json` | Declara las herramientas y los comandos del frontend. |
| `package-lock.json` | Registra las versiones de las dependencias para reproducir la instalación. |
| `.gitignore` | Excluye dependencias instaladas, archivos generados y otros archivos locales. |

---

## 9. Comandos disponibles

Los siguientes comandos se ejecutan **dentro de `frontend`**:

| Comando | Función |
|---|---|
| `npm run dev` | Inicia Vite con actualización automática y proxy hacia el backend. |
| `npm run build` | Comprueba TypeScript y genera la web compilada en `dist`. |
| `npm run preview` | Muestra una vista previa de la compilación. No inicia el backend ni utiliza el proxy de desarrollo configurado en este proyecto. |

Para probar la web compilada con su API se utiliza el procedimiento de la Sección 7.

Las carpetas `node_modules` y `dist` están excluidas del repositorio. Las dependencias se instalan y la compilación se genera en cada entorno.
