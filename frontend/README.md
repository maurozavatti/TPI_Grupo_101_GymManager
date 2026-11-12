# Frontend — Gym Manager

> **Tecnologías:** HTML, CSS, TypeScript, Vite e iconos SVG de Lucide.

---

## 1. Descripción

Esta carpeta contiene el frontend de **Gym Manager**, desarrollado con HTML, CSS y TypeScript mediante Vite y su plantilla `vanilla-ts`.

La página inicial es un documento mínimo que consulta la sesión y redirige. Sin una sesión válida dirige al login; con `ADMIN` o `ENTRENADOR` dirige al inicio del panel. Las cuentas que solo tienen `USUARIO` se dirigen a Mi perfil. Si existen varios roles, los del personal tienen prioridad para este destino inicial.

La carpeta `src/autenticacion` contiene login y registro con formularios, validaciones, mensajes propios y comunicación con el backend. Sus enlaces permiten navegar entre ambas páginas cuando no hay sesión; si ya existe una sesión, dirigen al inicio autenticado. Los colores, fuentes, espaciados y estilos generales de la web se definen en `src/style.css`.

La carpeta `src/servicios` centraliza la comunicación con la API, la consulta de sesiones y los permisos de navegación para uno o varios roles. `src/cuenta` contiene los datos de la cuenta propia y el cambio de contraseña. `src/panel` reúne la estructura compartida y las pantallas de inicio, cuentas, clientes, ejercicios, rutinas, turnos y pagos. `src/cliente` contiene el perfil y la historia clínica.

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

La instalación del frontend incluye `lucide`, que se utiliza para los iconos de acciones y paginación. No requiere agregar scripts externos al HTML.

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

Con ambos procesos funcionando, abrir la raíz de la web dirige al login si no hay sesión. Si existe una sesión válida, `main.ts` decide el destino: inicio del panel para el personal y Mi perfil para `USUARIO`. Registro y login correctos vuelven a la raíz para resolver ese mismo recorrido.

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
3. Registrar una cuenta de prueba. La operación guarda la cuenta en la base configurada, crea su sesión y dirige a Mi perfil.
4. Cerrar sesión e intentar registrar el mismo correo. Debe mostrar el error de duplicado y marcar el correo.
5. Probar el login con credenciales incorrectas y con un correo inexistente. Ambos casos deben mostrar el mismo mensaje de credenciales incorrectas.
6. Iniciar sesión correctamente, recargar Mi perfil y comprobar que se conserva la sesión.
7. Con sesión iniciada, abrir directamente login y registro. Deben volver al inicio autenticado.
8. Cerrar sesión y volver a abrir la raíz. Debe dirigir al login.
9. Achicar la ventana y comprobar que el menú pasa arriba del contenido y conserva la separación visual de sus opciones.

Para consultar la sesión recibida por el navegador puede abrirse `/api/sesion` desde la misma dirección y navegador utilizados para ingresar. La sesión guardada por una prueba de PowerShell es independiente de la cookie del navegador.

### 6.2 Pruebas de cuenta propia y administración

Con una cuenta de prueba se puede verificar el cambio de contraseña actual incorrecta, nueva contraseña corta, confirmación distinta y cambio correcto. Después de guardar, el navegador actual debe conservar su sesión; al cerrar e ingresar nuevamente, la clave anterior debe fallar y la nueva permitir el acceso.

Desde Cuentas, como `ADMIN`, se comprueban alta, correo duplicado, selección de al menos un rol, edición y cancelación de roles, baja y reactivación. Una cuenta dada de baja no debe poder ingresar y sus sesiones anteriores quedan eliminadas. El backend rechaza quitarse `ADMIN` o darse de baja desde la propia cuenta.

La búsqueda debe encontrar nombre, apellido o correo sin distinguir mayúsculas ni tildes. Los filtros por rol y estado se combinan: una cuenta `ADMIN` + `ENTRENADOR` debe aparecer al elegir cualquiera de esos roles. Actualizar el listado conserva los filtros elegidos.

También se comprueba el comportamiento visual y de navegación:

1. Al entrar en Cuentas debe verse primero el listado y permanecer oculto el formulario de alta. Nueva cuenta abre una tarjeta encima del listado; Cancelar limpia los datos y errores, cierra la tarjeta y permite abrirla nuevamente.
2. La selección de roles se despliega tanto en el alta como al editar una cuenta. Los cambios del editor se descartan con Cancelar si todavía no se guardaron.
3. Con más de 15 resultados aparecen flechas y números de página. La página actual queda marcada y los puntos suspensivos reemplazan números intermedios cuando hay muchas páginas. Una búsqueda o un filtro nuevo vuelve a la primera página.
4. Las filas se desplazan dentro del cuadro y los nombres de las columnas permanecen visibles. En una pantalla angosta se puede desplazar la tabla horizontalmente sin comprimir las palabras.
5. Los botones con iconos muestran su descripción al pasar el mouse, recibir foco con teclado o mantenerlos pulsados en una pantalla táctil. La pulsación larga muestra la ayuda sin ejecutar la acción.
6. Mi cuenta presenta las iniciales, el nombre, el correo y las etiquetas de roles. Cambiar contraseña abre el formulario; Cancelar lo cierra y limpia las claves. Después de un cambio correcto permanece abierto para mostrar la confirmación.

Estas indicaciones describen comprobaciones manuales; no constituyen una suite automática del frontend. Las pantallas de clientes, turnos, pagos e inicio requieren los ajustes de roles descritos en la sección 8.8 antes de dar por correcto el flujo completo con cuentas que guardan arrays.

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
│   │   ├── permisos.ts
│   │   ├── roles.ts
│   │   ├── botones-icono.ts
│   │   └── botones-icono.css
│   ├── cuenta/
│   │   ├── cuenta.html
│   │   ├── cuenta.ts
│   │   └── cuenta.css
│   ├── panel/
│   │   ├── estructura.ts
│   │   ├── estructura.css
│   │   ├── inicio/       (inicio.html, inicio.ts, inicio.css)
│   │   ├── cuentas/      (cuentas.html, cuentas.ts, cuentas.css, formulario-cuentas.ts)
│   │   ├── clientes/     (clientes.html, clientes.ts, clientes.css)
│   │   ├── turnos/       (turnos.html, turnos.ts, turnos.css)
│   │   └── pagos/        (pagos.html, pagos.ts, pagos.css)
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
| `index.html` | Define el documento inicial mínimo en español y el mensaje de comprobación de sesión; carga `src/main.ts`. |
| `src/main.ts` | Consulta la sesión y redirige al login, al inicio del personal o a Mi perfil; da prioridad a los roles del personal cuando hay varios. |
| `src/style.css` | Define variables y estilos globales de colores, fondos, tipografía, espaciados, bordes y estados de los elementos. |
| `src/autenticacion/login/login.html` | Define correo, contraseña, mensajes, botón de ingreso y enlace hacia el registro. |
| `src/autenticacion/login/login.ts` | Valida el formulario, envía las credenciales al backend, marca los errores y dirige al inicio después del ingreso correcto. |
| `src/autenticacion/register/register.html` | Define nombre, apellido, correo, contraseña, confirmación, mensajes y enlace al login. |
| `src/autenticacion/register/register.ts` | Valida y envía el registro, marca campos rechazados y dirige al inicio después de crear la cuenta y su sesión. |
| `src/autenticacion/autenticacion.css` | Comparte tarjeta, campos, botones, mensajes de éxito y error, y adaptación a pantallas pequeñas. |
| `src/autenticacion/validaciones.ts` | Comprueba campos obligatorios, correo, longitudes y confirmación de contraseña; se reutiliza también en cuenta propia y módulos del panel. Marca errores mediante `aria-invalid`. |
| `src/autenticacion/acceso.ts` | Consulta la sesión antes de habilitar login o registro y redirige si ya existe una sesión válida. |
| `src/servicios/api.ts` | Centraliza las peticiones JSON, el envío de cookies y los errores HTTP mediante `solicitarAPI` y `ErrorAPI`. |
| `src/servicios/sesion.ts` | Define los datos públicos de sesión, valida la respuesta del backend y permite consultar o cerrar la sesión actual. |
| `src/servicios/permisos.ts` | Comprueba roles con `tieneRol` y exige sesión o roles permitidos mediante `exigirAcceso` antes de cargar una pantalla. |
| `src/servicios/roles.ts` | Define `RolesCuenta`; valida e interpreta roles como texto o array mediante `esRolCuenta`, `obtenerRoles` e `incluyeRol`. |
| `src/servicios/botones-icono.ts` | Aplica iconos de Lucide a los botones mediante `ponerIconoBoton`, asigna nombres accesibles y comparte una ayuda flotante para mouse, teclado y pulsación larga. |
| `src/servicios/botones-icono.css` | Define el tamaño de los botones con iconos, el estado visual de reactivación y la presentación de la ayuda flotante. |
| `src/cuenta/cuenta.html` | Define la tarjeta de identidad, los bloques de correo y roles y el formulario de contraseña inicialmente oculto. |
| `src/cuenta/cuenta.ts` | Prepara el panel para los tres roles, muestra iniciales y etiquetas de roles, abre o cancela el formulario y envía el cambio de contraseña con validación y mensajes propios. |
| `src/cuenta/cuenta.css` | Diseña la identidad, los bloques de datos, las etiquetas de roles y el formulario compacto de contraseña, con adaptación a pantallas pequeñas y estados de error y éxito. |
| `src/panel/estructura.ts` | Prepara sesión y permisos, encabezado, menú filtrado, cierre de sesión y contenido de cada pantalla dentro de la estructura compartida. |
| `src/panel/estructura.css` | Define barra lateral, encabezado, tarjetas y botones comunes. En escritorio mantiene la barra visible con altura de pantalla; en celulares coloca el menú arriba. |
| `src/panel/inicio/inicio.html` | Define el saludo, indicadores administrativos y tabla de turnos del día. |
| `src/panel/inicio/inicio.ts` | Consulta `/api/resumen`, muestra los turnos del día y completa los indicadores que devuelve el backend. |
| `src/panel/inicio/inicio.css` | Distribuye las tarjetas de indicadores y la tabla del inicio. |
| `src/panel/cuentas/cuentas.html` | Define el alta inicialmente oculta en una tarjeta encima del listado, búsqueda, filtros, tabla con desplazamiento y controles de paginación. |
| `src/panel/cuentas/cuentas.ts` | Carga y filtra cuentas, muestra 15 por página, genera números y flechas de navegación, crea cuentas y conecta edición de roles, iconos y confirmación de bajas/reactivaciones. |
| `src/panel/cuentas/formulario-cuentas.ts` | Abre el alta, prepara el resumen desplegable de roles y conecta Cancelar para limpiar y cerrar. Impide cancelar durante el envío y devuelve el foco al botón Nueva cuenta. |
| `src/panel/cuentas/cuentas.css` | Diseña el formulario compacto, selectores de roles, filtros, tabla con encabezados fijos, acciones apiladas, paginación centrada y diálogo de confirmación. |
| `src/panel/clientes/clientes.html` | Define tabla de fichas y formularios de alta/edición y vinculación con una cuenta. |
| `src/panel/clientes/clientes.ts` | Consulta fichas, crea o edita sus datos, solicita baja/reactivación y envía la vinculación confirmada por correo. |
| `src/panel/clientes/clientes.css` | Diseña formularios, listado, acciones y estados de las fichas. |
| `src/panel/turnos/turnos.html` | Define listado de turnos y formularios de horario, asignación de clientes y generación de agenda; incluye acciones en lote. |
| `src/panel/turnos/turnos.ts` | Consulta turnos y configuración, crea/edita horarios, asigna/retira clientes, genera la agenda y solicita operaciones en lote. |
| `src/panel/turnos/turnos.css` | Diseña tabla, formularios, franjas, días de trabajo y controles de agenda. |
| `src/panel/pagos/pagos.html` | Define tabla, filtro por cliente y formulario para registrar inscripción o cuota. |
| `src/panel/pagos/pagos.ts` | Consulta clientes y pagos, registra operaciones enviando el monto como número y permite marcar obligaciones como pagadas. |
| `src/panel/pagos/pagos.css` | Diseña formulario, filtro, tabla y etiquetas de estado de pagos. |
| `vite.config.ts` | Reenvía las peticiones `/api` al backend durante el desarrollo local e incluye automáticamente `index.html` y los HTML de `src` al compilar. |
| `tsconfig.json` | Configura la comprobación del código TypeScript del frontend. |
| `package.json` | Declara las herramientas, la dependencia de iconos Lucide y los comandos del frontend. |
| `package-lock.json` | Registra las versiones de las dependencias para reproducir la instalación. |
| `.gitignore` | Excluye dependencias instaladas, archivos generados y otros archivos locales. |

### 8.1 Páginas de autenticación

Las páginas se pueden abrir desde Vite o desde el backend que entrega la compilación. Con el backend ejecutándose y el frontend compilado, las direcciones son:

```text
http://localhost:3000/src/autenticacion/login/login.html
http://localhost:3000/src/autenticacion/register/register.html
```

Los enlaces relativos permiten pasar del login al registro y regresar cuando no hay sesión. Antes de habilitar cada formulario se consulta la sesión. Si ya existe una sesión válida, se dirige a `/`; el ingreso y el registro correctos también dirigen a esa raíz, donde `main.ts` decide entre el inicio del personal y Mi perfil.

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

`exigirAcceso()` exige una sesión antes de cargar una página. Si no hay sesión, dirige al login y devuelve `null`. Al recibir una lista de roles, como `exigirAcceso(['ADMIN'])`, comprueba además que alguno de los roles de la cuenta coincida; si no coincide, dirige a `/` y devuelve `null`. Los errores de consulta se propagan para informar el fallo. `tieneRol(usuario, rolesPermitidos)` permite decidir qué opciones mostrar.

El campo `rol` puede ser un texto, como `'ADMIN'`, o un array, como `['ADMIN', 'ENTRENADOR']`. `esRolCuenta` valida ambos formatos, `obtenerRoles` devuelve una lista e `incluyeRol` comprueba pertenencia. El encabezado presenta los roles separados por `/`; Mi cuenta utiliza una etiqueta individual por rol. Las comparaciones directas contra un texto no sustituyen estas funciones.

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

El menú utiliza una lista común de opciones y filtra por pertenencia a los roles permitidos. Además, detecta los HTML existentes dentro de `src` mediante Vite para evitar enlaces a páginas ausentes. Mi cuenta está disponible en `/src/cuenta/cuenta.html` y Mi perfil en `/src/cliente/perfil/perfil.html`. La marca dirige a `/`, que resuelve el destino inicial. Para incorporar un módulo al menú, su ruta debe coincidir con una opción definida en `opcionesMenu`; la detección de archivos se actualiza al ejecutar o recompilar el frontend.

La opción actual se identifica mediante `aria-current="page"`. Los nombres y roles se incorporan como texto. Al volver a una página del panel desde el historial del navegador se vuelve a cargar para comprobar la sesión. En escritorio la barra lateral permanece visible al desplazar una página larga y permite desplazamiento interno si no cabe. En pantallas de hasta 800 px, el menú pasa a la parte superior con fondo celeste.

### 8.5 Cuenta propia

`/src/cuenta/cuenta.html` admite los tres roles. Presenta una tarjeta compacta con las iniciales y el nombre de la persona, un bloque de correo y etiquetas individuales para los roles actuales. Los colores distinguen `ADMIN`, `ENTRENADOR` y `USUARIO` utilizando las variables generales de la web.

El formulario permanece oculto hasta pulsar Cambiar contraseña. Se adapta al ancho disponible y mantiene juntas la nueva contraseña y su confirmación. Cerrar o Cancelar limpia las claves, quita los errores y devuelve el foco al botón de apertura.

El formulario envía `actual`, `nueva` y `confirmacion` a `/api/cuenta/contrasena`. Reutiliza las validaciones, muestra los campos rechazados y toma los colores de `--color-error` y `--color-exito`. Si hay varios campos incorrectos muestra un mensaje general y conserva sus bordes marcados; con un solo error mantiene el mensaje específico.

Mientras se envía se bloquean otro envío, el cierre del formulario y la edición de los valores. El formulario se limpia después de recibir éxito y permanece abierto para mostrar la confirmación. El backend renueva la sesión del navegador actual y elimina las anteriores de esa cuenta. La clave nueva requiere al menos ocho caracteres; los límites completos se comprueban también en el backend.

### 8.6 Administración de cuentas

`/src/panel/cuentas/cuentas.html` exige `ADMIN` y muestra primero las cuentas registradas. El botón Nueva cuenta abre una tarjeta independiente encima del listado y conserva su nombre; queda deshabilitado mientras el formulario está abierto. Crear y Cancelar aparecen juntos al pie del formulario. Cancelar descarta los datos y errores, cierra la tarjeta y devuelve el foco a Nueva cuenta. Durante el envío no se permite cancelar.

El formulario distribuye nombre, apellido, correo y roles en una fila cuando hay espacio. Las dos contraseñas se mantienen juntas y la distribución se adapta a pantallas menores. El selector de roles contiene casillas dentro de un desplegable y resume la selección; debe quedar al menos un rol marcado. Cuando hay varios campos incorrectos se muestra un mensaje breve y se conservan sus marcas de error. La creación no cambia la sesión del administrador y no crea fichas de cliente.

El listado muestra nombre y apellido, correo, roles como texto y estado. El icono de lápiz habilita la edición y muestra un selector desplegable de roles y las acciones de guardar, baja o reactivación y cancelar. Los botones se apilan para ocupar menos ancho y tienen iconos y descripciones accesibles. Cancelar descarta la edición local. La baja/reactivación requiere un diálogo de confirmación con los estilos de la web y admite cancelar con Escape. El diálogo advierte que la actualización del listado descarta cambios de roles que no se hayan guardado.

La búsqueda se realiza sobre las cuentas ya cargadas, por palabras de nombre/apellido/correo, sin distinguir mayúsculas ni tildes. Los filtros de rol y estado se combinan y se conservan al actualizar. Las cuentas con varios roles coinciden con cualquiera de ellos.

La paginación se realiza en el navegador sobre los resultados filtrados, con un máximo de **15 cuentas por página**, definido por `cuentasPorPagina` en `cuentas.ts`. No limita la cantidad que devuelve la API. Si hay varias páginas se informa el intervalo mostrado respecto del total filtrado; si todo entra en una página se informa solamente la cantidad encontrada.

Los controles centrados incluyen flechas, números y puntos suspensivos cuando no entran todos los números. La página actual queda identificada y las flechas se deshabilitan en los extremos. Una búsqueda o un filtro nuevo vuelve a la primera página. Al cambiar de página, el desplazamiento vertical de las filas vuelve al inicio.

La tabla tiene desplazamiento propio y una altura máxima relativa a la pantalla. Sus encabezados permanecen visibles dentro del cuadro; los filtros y la paginación quedan fuera de ese desplazamiento. En celulares conserva un ancho mínimo y permite deslizar horizontalmente para evitar comprimir las columnas.

El frontend envía los roles como array a `/api/cuentas` o `/api/cuentas/roles`. Al modificar la propia cuenta se recarga para actualizar también el menú y encabezado. El backend impide quitarse `ADMIN` o desactivar la cuenta propia. Ante `401` se vuelve al login y ante `403` a la entrada principal.

### 8.7 Inicio, clientes, turnos y pagos

| Pantalla | Ruta | Funcionamiento incorporado |
|---|---|---|
| Inicio | `/src/panel/inicio/inicio.html` | Saludo, turnos de hoy y ocupación. Si el backend devuelve el bloque administrativo, muestra clientes activos, ingresos del mes, cuotas vencidas y próximas a vencer. |
| Clientes | `/src/panel/clientes/clientes.html` | Listado con estado y vinculación. Para administración, formularios de alta/edición, baja/reactivación y vinculación por correo con confirmación de identidad. |
| Turnos | `/src/panel/turnos/turnos.html` | Listado con día, horario, identificador de entrenador, capacidad, ocupación y estado. Incluye edición, asignación/retiro de clientes, generación de agenda y selección en lote para administración. |
| Pagos | `/src/panel/pagos/pagos.html` | Pantalla administrativa con filtro por cliente, registro de inscripción o cuota, estado pagado/pendiente y acción para marcar un pendiente como pagado. |
| Ejercicios | `/src/panel/ejercicios/ejercicios.html` | Catálogo con consulta para personal, mantenimiento e importación Excel para `ADMIN`. |
| Rutinas | `/src/panel/rutinas/rutinas.html` | Creación, asignación, edición, historial limitado a 12 y vista imprimible para personal. |
| Mi perfil | `/src/cliente/perfil/perfil.html` | `USUARIO`: ficha vinculada, rutina vigente imprimible y turnos asignados; informa si todavía no tiene ficha. |
| Historia clínica | `/src/cliente/historia/historia.html` | Cliente titular y personal consultan o actualizan antecedentes, lesiones y observaciones. |

Turnos reutiliza una sola pantalla para personal administrativo y entrenadores. En la implementación actual se ingresa el identificador del entrenador en los formularios de turno y agenda; no hay un selector de cuentas por nombre. La capacidad se envía como número. El formulario de pagos también convierte el monto a número antes de enviarlo.

Los pendientes de pagos se registran desde el formulario; no hay generación automática de cuotas sucesivas. Clientes y turnos todavía utilizan algunas confirmaciones nativas del navegador; el diálogo con diseño propio se incorporó en Cuentas.

### 8.8 Estado de integración de roles múltiples

Los módulos del panel, el catálogo y las rutinas usan los servicios comunes para interpretar roles escalares o arrays. El acceso a la historia clínica y a los datos de perfil también se comprueba en el backend por titularidad y rol.

Para completar la integración se deben reutilizar `tieneRol` o `incluyeRol` en cada módulo y dar prioridad al alcance administrativo cuando una cuenta tiene `ADMIN` y `ENTRENADOR`. No basta con que el menú muestre el enlace. El detalle del backend y de la validación de MongoDB está en su README.

El menú incluye ejercicios, rutinas, perfil e historia clínica cuando las rutas corresponden al rol de la persona. Las cuentas que solo poseen `USUARIO` llegan a Mi perfil después del login.

---

### 8.9 Iconos y ayudas de los botones

`src/servicios/botones-icono.ts` importa los iconos utilizados desde `lucide` y los incorpora como SVG mediante `ponerIconoBoton(boton, accion, descripcion)`. Se utiliza para editar, guardar, dar de baja, reactivar, cancelar y navegar entre páginas. El archivo importa su propio CSS.

Cada botón recibe un nombre mediante `aria-label`. Una ayuda flotante compartida muestra la descripción al pasar el mouse, navegar con teclado o mantener pulsado el botón durante aproximadamente 550 ms en una pantalla táctil. Un toque corto ejecuta la acción; una pulsación larga consulta la ayuda y bloquea ese clic. Mover el dedo cancela la espera para permitir el desplazamiento.

La ayuda se coloca fuera de la tabla para evitar recortes y se oculta al desplazarse, cambiar el tamaño de la ventana, salir del botón o tocar otra zona. Los iconos y estados visuales reutilizan las variables globales.

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
