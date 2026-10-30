# Frontend — Gym Manager

> **Tecnologías:** HTML, CSS, TypeScript y Vite.

---

## 1. Descripción

Esta carpeta contiene el frontend de **Gym Manager**, desarrollado con HTML, CSS y TypeScript mediante Vite y su plantilla `vanilla-ts`.

La página inicial consulta la sesión actual. Sin una sesión válida dirige al login; con una sesión válida muestra Mi cuenta dentro de la estructura compartida del panel y permite cerrar sesión.

La carpeta `src/autenticacion` contiene login y registro con formularios, validaciones, mensajes propios y comunicación con el backend. Sus enlaces permiten navegar entre ambas páginas cuando no hay sesión; si ya existe una sesión, dirigen al inicio autenticado. Los colores, fuentes, espaciados y estilos generales de la web se definen en `src/style.css`.

La carpeta `src/servicios` centraliza la comunicación con la API, la consulta de sesiones y los permisos de navegación. `src/panel` contiene el encabezado, menú, cierre de sesión y estilos compartidos que pueden reutilizar las pantallas.

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

Con ambos procesos funcionando, abrir la raíz de la web muestra el login si no hay sesión o Mi cuenta si existe una sesión válida. El registro y el login correctos también dirigen a Mi cuenta.

La comprobación directa del servidor se conserva en `http://localhost:5173/api/salud`, ajustando el puerto al informado por Vite. Devuelve el mensaje `Backend de GymManager funcionando`.

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

1. Con el backend encendido, abrir `/api/salud` desde la dirección de Vite y comprobar que devuelve el mensaje de funcionamiento.
2. Detener solamente el backend y abrir o recargar la raíz de la web. Debe informarse el problema de consulta; no se presenta como un ingreso o cierre de sesión exitoso.
3. Iniciar nuevamente el backend y recargar para recuperar el funcionamiento.

Esta prueba comprueba la comunicación HTTP entre ambos proyectos. Para probar específicamente el acceso a Atlas se ejecuta `npm --prefix backend run check:db` desde la raíz, con `backend/.env` completo.

### 6.1 Pruebas de registro, login y sesión

Con ambos servidores funcionando:

1. Sin sesión, abrir la raíz y comprobar que dirige al login.
2. Probar campos vacíos, correo inválido y contraseñas que no coincidan en el registro. Los campos incorrectos deben marcarse y mostrar mensajes propios.
3. Registrar una cuenta de prueba. La operación guarda la cuenta en la base configurada, crea su sesión y dirige a Mi cuenta.
4. Cerrar sesión e intentar registrar el mismo correo. Debe mostrar el error de duplicado y marcar el correo.
5. Probar el login con credenciales incorrectas y con un correo inexistente. Ambos casos deben mostrar el mismo mensaje de credenciales incorrectas.
6. Iniciar sesión correctamente, recargar Mi cuenta y comprobar que se conserva la sesión.
7. Con sesión iniciada, abrir directamente login y registro. Deben volver al inicio autenticado.
8. Cerrar sesión y volver a abrir la raíz. Debe dirigir al login.
9. Achicar la ventana y comprobar que el menú pasa arriba del contenido y conserva la separación visual de sus opciones.

Para consultar la sesión recibida por el navegador puede abrirse `/api/sesion` desde la misma dirección y navegador utilizados para ingresar. La sesión guardada por una prueba de PowerShell es independiente de la cookie del navegador.

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

La configuración de Vite incluye `index.html` y detecta automáticamente todos los archivos `.html` de `src` y sus subcarpetas en cada compilación. Cada página incorpora los recursos que referencia, como CSS y módulos TypeScript. No es necesario mantener una lista manual de páginas.

Las rutas de los HTML se conservan dentro de `dist`. Por ejemplo, `src/autenticacion/login/login.html` se genera como `dist/src/autenticacion/login/login.html`. El backend puede entregar esa página mediante `/src/autenticacion/login/login.html`.

La detección automática incluye las páginas en la compilación; los enlaces de navegación se definen en sus HTML o en su código TypeScript. Agregar páginas dentro de `src` no requiere cambiar los comandos de compilación o arranque de Render.

---

## 8. Archivos principales

```text
frontend/
├── index.html
├── src/
│   ├── main.ts
│   ├── style.css
│   ├── servicios/
│   │   ├── api.ts
│   │   ├── sesion.ts
│   │   └── permisos.ts
│   ├── panel/
│   │   ├── estructura.ts
│   │   └── estructura.css
│   └── autenticacion/
│       ├── acceso.ts
│       ├── autenticacion.css
│       ├── validaciones.ts
│       ├── login/
│       │   ├── login.html
│       │   └── login.ts
│       └── register/
│           ├── register.html
│           └── register.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

| Archivo | Objetivo |
|---|---|
| `index.html` | Define el documento inicial en español, el estado de carga y el contenido de Mi cuenta dentro de `#vista`; carga `src/main.ts`. |
| `src/main.ts` | Prepara Mi cuenta para los tres roles mediante la estructura compartida y completa nombre, correo y rol con los datos de sesión. |
| `src/style.css` | Define variables y estilos globales de colores, fondos, tipografía, espaciados, bordes y estados de los elementos. |
| `src/autenticacion/login/login.html` | Define correo, contraseña, mensajes, botón de ingreso y enlace hacia el registro. |
| `src/autenticacion/login/login.ts` | Valida el formulario, envía las credenciales al backend, marca los errores y dirige al inicio después del ingreso correcto. |
| `src/autenticacion/register/register.html` | Define nombre, apellido, correo, contraseña, confirmación, mensajes y enlace al login. |
| `src/autenticacion/register/register.ts` | Valida y envía el registro, marca campos rechazados y dirige al inicio después de crear la cuenta y su sesión. |
| `src/autenticacion/autenticacion.css` | Comparte tarjeta, campos, botones, mensajes de éxito y error, y adaptación a pantallas pequeñas. |
| `src/autenticacion/validaciones.ts` | Comprueba los campos de ambos formularios y los marca mediante `aria-invalid`, con mensajes propios. |
| `src/autenticacion/acceso.ts` | Consulta la sesión antes de habilitar login o registro y redirige si ya existe una sesión válida. |
| `src/servicios/api.ts` | Centraliza las peticiones JSON, el envío de cookies y los errores HTTP mediante `solicitarAPI` y `ErrorAPI`. |
| `src/servicios/sesion.ts` | Define los datos públicos de sesión, valida la respuesta del backend y permite consultar o cerrar la sesión actual. |
| `src/servicios/permisos.ts` | Comprueba roles con `tieneRol` y exige sesión o roles permitidos mediante `exigirAcceso` antes de cargar una pantalla. |
| `src/panel/estructura.ts` | Prepara sesión y permisos, encabezado, menú filtrado, cierre de sesión y contenido de cada pantalla dentro de la estructura compartida. |
| `src/panel/estructura.css` | Define barra lateral, encabezado, tarjetas y botones comunes; adapta el menú a la parte superior en pantallas pequeñas. |
| `vite.config.ts` | Reenvía las peticiones `/api` al backend durante el desarrollo local e incluye automáticamente `index.html` y los HTML de `src` al compilar. |
| `tsconfig.json` | Configura la comprobación del código TypeScript del frontend. |
| `package.json` | Declara las herramientas y los comandos del frontend. |
| `package-lock.json` | Registra las versiones de las dependencias para reproducir la instalación. |
| `.gitignore` | Excluye dependencias instaladas, archivos generados y otros archivos locales. |

### 8.1 Páginas de autenticación

Las páginas se pueden abrir desde Vite o desde el backend que entrega la compilación. Con el backend ejecutándose y el frontend compilado, las direcciones son:

```text
http://localhost:3000/src/autenticacion/login/login.html
http://localhost:3000/src/autenticacion/register/register.html
```

Los enlaces relativos permiten pasar del login al registro y regresar cuando no hay sesión. Antes de habilitar cada formulario se consulta la sesión. Si ya existe una sesión válida, se dirige a `/`; el ingreso y el registro correctos también dirigen a esa raíz, donde se muestra Mi cuenta.

Durante la consulta o el envío se bloquean los envíos repetidos y se muestra el estado de espera. Los errores conservan los datos del formulario para corregirlos y marcan los campos que indique el backend. El mensaje de éxito se muestra después de recibir una respuesta correcta del servidor.

El navegador administra la cookie HttpOnly. El frontend no lee el token ni lo guarda en localStorage. El servicio de sesión devuelve `null` ante un `401`; los errores de conexión, de formato o del servidor se propagan para informar el problema, sin interpretarlos como una sesión cerrada.

### 8.2 Estilos globales

El archivo `src/style.css` centraliza las variables CSS en `:root`. Sus nombres están en español y se reutilizan mediante `var(...)`:

```css
color: var(--color-texto);
background-color: var(--color-fondo);
```

Las variables agrupan colores principales, superficies, textos, bordes, estados, fuentes, tamaños, pesos, interlineados, espaciados, radios, sombra y transición. La base visual utiliza celeste como color principal, blanco para las superficies y un fondo crema claro.

Además, el archivo establece el tamaño de caja, los estilos del contenido y los títulos, la fuente de los controles de formulario, el comportamiento de las imágenes, los elementos ocultos y el indicador de foco para navegar con teclado. Los botones deshabilitados utilizan el cursor `not-allowed`.

Los estilos globales se aplican en las páginas que cargan el archivo. La estructura del panel importa `style.css` y `estructura.css`. Los HTML de login y registro cargan `style.css`, `autenticacion.css` y sus respectivos módulos TypeScript. Ambos formularios comparten los estilos de autenticación, por lo que no utilizan CSS individuales.

Los mensajes y campos incorrectos usan `--color-error`; los mensajes de éxito usan `--color-exito`. Cada módulo puede agregar sus estilos propios reutilizando las variables globales.

### 8.3 Sesiones y permisos de navegación

`consultarSesion()` consulta `/api/sesion`, comprueba la estructura de los datos públicos y devuelve el usuario o `null` si no hay una sesión válida. `cerrarSesion()` envía un objeto JSON a `/api/logout`; el backend elimina el registro y el navegador procesa la eliminación de la cookie.

`exigirAcceso()` exige una sesión antes de cargar una página. Si no hay sesión, dirige al login y devuelve `null`. Al recibir una lista de roles, como `exigirAcceso(['ADMIN'])`, comprueba además que la cuenta tenga uno de ellos; si no coincide, dirige a `/` y devuelve `null`. Los errores de consulta se propagan para informar el fallo. `tieneRol(usuario, rolesPermitidos)` permite decidir qué opciones mostrar.

Estas funciones organizan la navegación del frontend. El backend sigue comprobando los permisos de cada operación; ocultar un botón o redirigir una página no reemplaza esa autorización.

### 8.4 Estructura compartida del panel

`prepararPanel(titulo, roles)` comprueba sesión y permisos, genera el encabezado y menú, conecta el cierre de sesión y mueve el contenido de `#vista` al diseño común. Por defecto admite `ADMIN` y `ENTRENADOR`. Devuelve el usuario autenticado o `null` si redirige o no puede preparar la pantalla. El código propio de cada módulo se ejecuta solamente cuando recibe un usuario.

Cada pantalla define su contenido dentro de una sección inicialmente oculta:

```html
<p id="estado-panel" class="estado-panel" role="status">
  Comprobando sesión...
</p>

<section id="vista" hidden>
  <!-- Contenido propio de la pantalla. -->
</section>
```

El HTML carga su módulo TypeScript con un script de tipo `module`. Desde una subcarpeta de `src/panel`, el módulo puede utilizar:

```ts
import { prepararPanel } from '../estructura.ts'

const usuario = await prepararPanel('Titulo de la pantalla')

if (usuario) {
  // Carga de datos y eventos propios de la pantalla.
}
```

Una página exclusiva de administrador utiliza `prepararPanel('Titulo', ['ADMIN'])`. Mi cuenta admite los tres roles. El componente incorpora los estilos globales y del panel, por lo que cada módulo solo necesita agregar su CSS particular cuando corresponda.

El menú utiliza una lista común de opciones y filtra por rol. Además, detecta los HTML existentes dentro de `src` mediante Vite para evitar enlaces a páginas ausentes. Mi cuenta permanece disponible en `/`. Para incorporar un módulo al menú, su ruta debe coincidir con una opción definida en `opcionesMenu`; la detección de archivos se actualiza al ejecutar o recompilar el frontend.

La opción actual se identifica mediante `aria-current="page"`. Los nombres y roles se incorporan como texto. Al volver a una página del panel desde el historial del navegador se vuelve a cargar para comprobar la sesión. En pantallas de hasta 800 px, el menú pasa a la parte superior con fondo celeste.

---

## 9. Comandos disponibles

Los siguientes comandos se ejecutan **dentro de `frontend`**:

| Comando | Función |
|---|---|
| `npm run dev` | Inicia Vite con actualización automática y proxy hacia el backend. |
| `npm run build` | Comprueba TypeScript y genera en `dist` la página principal, los HTML detectados dentro de `src` y sus recursos asociados. |
| `npm run preview` | Muestra una vista previa de la compilación. No inicia el backend ni utiliza el proxy de desarrollo configurado en este proyecto. |

Para probar la web compilada con su API se utiliza el procedimiento de la Sección 7.

Las carpetas `node_modules` y `dist` están excluidas del repositorio. Las dependencias se instalan y la compilación se genera en cada entorno.
