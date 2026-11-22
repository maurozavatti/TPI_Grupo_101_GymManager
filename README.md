# Gym Manager — Sistema de Gestión para Gimnasio

> **Trabajo Final Integrador — Tecnicatura Universitaria en Programación**
> **Alcance:** MVP para un gimnasio · primeras dos entregas académicas aprobadas
> **Nombre:** Gym Manager

[Demostración en Render](https://gymmanager-grupo-101.onrender.com/) · [Instalación y ejecución](#12-tecnologías-instalación-y-demostración) · [Documentación](#16-documentación-del-proyecto)

---

## 1. Descripción del proyecto

Gym Manager es una aplicación web para la gestión interna de un gimnasio real. Centraliza la gestión de clientes, ejercicios, rutinas, turnos y pagos, reemplazando progresivamente el uso de planillas de Excel y registros en papel.

El personal administra la información desde una única plataforma. Los clientes con cuenta consultan su rutina, sus ejercicios y su turno asignado desde cualquier dispositivo (especialmente el celular). El sistema también permite administrar clientes **sin cuenta**, para no excluir a quienes no puedan o no quieran usar la plataforma.

**Visión de producto:** a futuro, el objetivo es que Gym Manager pueda ofrecerse como plataforma para gimnasios en general (no solo el gimnasio base), con un esquema de suscripción y funcionalidades adicionales como servicios pagos. Para el **Trabajo Final Integrador, el MVP se mantiene acotado a un único gimnasio** (el gimnasio real de referencia), diseñado con una separación de responsabilidades que no impide crecer hacia ese modelo más adelante. El detalle de esa visión está en la Sección 7.

---

## 2. Problemática

> **Quién lo sufre:** el personal administrativo y los entrenadores del gimnasio.
> **Problema:** la información de ejercicios, rutinas, turnos, clientes y pagos está dispersa entre una planilla de Excel y registros en papel, sin relación entre sí.
> **Impacto:** dispersión de información y tareas manuales de coordinación y seguimiento. El ahorro de tiempo y la reducción de errores son beneficios esperados, sin una medición cuantitativa publicada.
> **Qué haría la solución:** centralizar ejercicios, rutinas, turnos, clientes, historia clínica básica y pagos en una sola plataforma, permitiendo crear rutinas seleccionando ejercicios ya cargados, coordinar turnos y consultar el estado de pagos sin cruzar planillas.

El problema no es "falta una app": es la ausencia de relación entre los datos y la dependencia de tareas manuales repetitivas para armar rutinas, coordinar turnos y hacer seguimiento de pagos.

### Diferenciación

Existen soluciones comerciales de gestión de gimnasios. GymManager no busca competir con ellas en esta etapa, sino resolver el caso puntual del gimnasio base con acceso directo a sus procesos reales, sin costo de licencia y adaptado a que conviven clientes con y sin cuenta.

---

## 3. Actores

| Actor | Responsabilidades principales |
|---|---|
| **Administrador / Dueño** | Administra cuentas y sus roles; asigna y modifica rutinas; gestiona clientes (alta, modificación y baja); administra el catálogo de ejercicios (alta, modificación y baja, incluida la carga masiva por Excel); registra y consulta pagos (operación exclusiva de este rol); crea turnos y asigna o retira clientes de ellos; crea, modifica y consulta la historia clínica de cualquier cliente. |
| **Entrenador** | Consulta el catálogo de ejercicios, sin poder modificarlo; crea, asigna y modifica rutinas; crea turnos y asigna o retira clientes de ellos; crea, modifica y consulta la historia clínica de cualquier cliente; no tiene acceso al módulo de Pagos. |
| **Cliente** | Inicia sesión, consulta su perfil, su rutina y sus ejercicios asignados, ve su turno, carga y actualiza su propia historia clínica. No modifica su rutina ni su turno, y no accede a datos de otros clientes. |

Una cuenta puede tener varios roles en `usuarios.rol`, siempre como arreglo no vacío y sin repetidos. `['ADMIN', 'ENTRENADOR']` conserva el alcance administrativo y permite figurar como entrenador. La cuenta de acceso y la ficha de cliente son entidades distintas; su vinculación es opcional y uno a uno.

**Sobre el rol de Súper Admin:** el equipo del proyecto va a operar como administrador general de la plataforma, pero ese rol solo tiene sentido cuando existe más de un gimnasio usando el sistema (multi-tenant). Como el MVP del TFI está acotado a un único gimnasio, **el rol de Administrador/Dueño ya cubre esa función para esta entrega** — no se implementa un actor "Súper Admin" separado. Ese rol queda documentado como parte de la visión a futuro (Sección 7), cuando exista más de un gimnasio y haya que gestionar altas y suscripciones entre ellos.

---

## 4. Propuesta de solución y valor agregado

La aplicación utiliza MongoDB Atlas, base `gym_manager`, con siete colecciones: `usuarios`, `clientes`, `ejercicios`, `turnos`, `pagos`, `configuracion` y `sesiones`. Las rutinas y la historia clínica se almacenan embebidas en las fichas de clientes. El personal selecciona ejercicios ya cargados en el sistema y los asocia a la rutina de un cliente, reemplazando la consulta manual del Excel.

**Valor agregado:**

- Reduce el tiempo de armado de rutinas y turnos al eliminar la búsqueda y coordinación manual.
- Relaciona clientes, rutinas, turnos y pagos en una misma plataforma (hoy están separados).
- Facilita el seguimiento de vencimientos de pago.
- Permite a los clientes consultar su rutina, sus ejercicios y su turno desde el celular.
- Centraliza información básica de salud (historia clínica y lesiones) que hoy no se registra de forma sistemática.
- No excluye a los clientes que prefieren seguir de forma presencial/impresa.

---

## 5. Alcance del MVP

**Incluido:**

1. Registro, inicio y cierre de sesión, roles múltiples, administración de cuentas y cambio de contraseña desde una sesión autenticada.
2. Gestión de clientes (con y sin cuenta).
3. Catálogo de ejercicios genérico (alta, modificación, baja lógica e importación de archivos XLSX).
4. Creación, asignación, edición y consulta de rutinas por Administrador o Entrenador, con una vigente y hasta 12 conservadas por cliente.
5. Consulta de rutina y ejercicios desde el perfil del cliente; impresión para clientes sin cuenta.
6. **Historia clínica del cliente:** carga opcional de antecedentes y lesiones previas por parte del cliente con cuenta o, cuando corresponda, por el administrador/entrenador, con posibilidad de actualizar la información posteriormente.
7. **Turnero básico:** el administrador/entrenador define turnos (día, horario, cupo) y asigna clientes; el cliente con cuenta consulta su turno asignado.
8. Registro y consulta básica de pagos: **inscripción inicial** y **cuota periódica**, con fechas de vencimiento.
9. **Dashboard y reportes básicos**: consulta de cantidad de clientes activos, cuotas vencidas y próximas a vencer, ocupación de turnos e ingresos mensuales.

**Fuera de alcance del MVP** (ver Sección 7 — roadmap):

- Plataforma multi-tenant (múltiples gimnasios, súper admin, suscripciones y corte de servicio).
- Personalización visual por gimnasio (colores, modo oscuro, layout editable).
- Catálogo de ejercicios propio por gimnasio (más allá del catálogo genérico único del MVP).
- Investigación e integración de IA de entrenamiento.
- Control de acceso por molinete con llavero NFC.
- Login con Google, recuperación de contraseña por correo, verificación de correo mediante códigos, pagos en línea, facturación, comprobantes, notificaciones externas y reportes avanzados. La consulta de pagos registrados sí integra el MVP.

### Criterios de éxito del MVP

- Un entrenador puede crear una rutina completa usando solo el catálogo cargado en el sistema, sin recurrir al Excel.
- El administrador puede identificar, para cualquier cliente, si tiene pagos vencidos.
- Un cliente registrado puede ver su rutina, sus ejercicios y su turno asignado desde el celular.
- Un cliente puede cargar su historia clínica cuando decida hacerlo y actualizarla si reporta una lesión.
- El sistema funciona correctamente tanto para clientes con cuenta como sin cuenta.

---

## 6. Limitaciones del MVP

- El sistema opera sobre un único gimnasio y no ofrece aislamiento multi-tenant.
- Las obligaciones de pago se cargan manualmente: no hay generación automática de cuotas sucesivas ni cálculo automático de ciclos de cobro al reactivar una ficha.
- La compatibilidad del circuito de pagos con importes Decimal128 de Atlas es limitada. El tipo de referencia del modelo sigue siendo Decimal128.
- No se garantiza el respeto del cupo y de los solapamientos ante asignaciones simultáneas; el uso concurrente requiere considerar esta limitación.
- La impresión de rutinas utiliza el navegador; la distribución en páginas depende del contenido y de la configuración de impresión.
- Google, recuperación de contraseña por correo, verificación mediante códigos, notificaciones externas, pagos en línea, facturación y comprobantes no están incluidos. El cambio autenticado de contraseña sí forma parte del MVP.

La demostración permite explorar el sistema. La definición del alcance no equivale a una certificación de todas sus funciones o atributos de calidad.

---

## 7. Visión a futuro: plataforma multi-tenant (fuera del alcance del TFI)

Estas funcionalidades **no forman parte de la entrega académica**. Se documentan porque son la dirección de producto que el equipo quiere explorar después del TFI, ofreciéndolas como servicio a otros gimnasios (potencialmente como plan pago superior al básico):

- **Multi-tenencia:** la plataforma pasa de servir a un gimnasio a servir a varios, cada uno con sus propios clientes, entrenadores y datos aislados entre sí.
- **Rol Súper Admin (el equipo):** da de alta nuevos gimnasios, controla el estado de su suscripción y puede cortar el acceso al servicio si un gimnasio no abona.
- **Personalización visual por gimnasio:** cada gimnasio puede editar aspectos de su propia web (colores, orden de secciones, modo oscuro).
- **Catálogo de ejercicios propio por gimnasio:** cada gimnasio carga sus propios ejercicios y arma sus rutinas a partir de ese catálogo particular (en lugar del catálogo genérico compartido del MVP).
- **IA de entrenamiento:** explorar asistencia por IA para sugerir o ajustar rutinas — en fase de investigación, sin compromiso de implementación.
- **Control de acceso físico:** integración con molinetes mediante llavero NFC, si el tiempo del equipo lo permite más adelante.

La priorización y el modelo de negocio de estas funcionalidades (qué es gratis y qué es plan pago) se van a definir después de validar el MVP con el gimnasio base.

---

## 8. Clientes sin cuenta

El sistema permite gestionar clientes sin cuenta. El personal carga sus datos identificatorios, les asigna rutina y turno, registra sus pagos y, cuando es necesario, carga o actualiza su historia clínica básica. La rutina dispone de una vista imprimible. Si el cliente se registra más adelante, la administración puede vincular su cuenta con la ficha existente sin duplicarla.

---

## 9. Gestión de ejercicios

El catálogo genérico identifica cada ejercicio mediante código, nombre, grupo muscular y descripción opcional. El alta, la modificación y la baja lógica son exclusivas del Administrador, incluyendo la posibilidad de cargar o actualizar ejercicios en lote mediante la importación de un archivo Excel. El Entrenador puede consultar el catálogo, pero no modificarlo.

> **Nota sobre el catálogo:** el gimnasio utiliza una metodología de entrenamiento contratada a un profesional externo, a la que el equipo no tiene acceso ni derecho de uso. Por eso, el MVP utiliza un **catálogo de ejercicios genérico** (de uso común y libre), único y compartido. La posibilidad de que cada gimnasio cargue su propio catálogo queda para la fase multi-tenant (Sección 7).

---

## 10. Gestión de rutinas, turnos y pagos

**Rutinas:** el Administrador o Entrenador selecciona ejercicios activos del catálogo y los asigna a un cliente activo, indicando series, repeticiones, peso, descanso, orden y observaciones. Se conserva una rutina vigente y hasta 12 rutinas en total por cliente.

**Turnos:** el administrador o entrenador define turnos (día, horario, cupo máximo), asigna clientes a ellos y puede retirarlos de un turno. Se incluyen turnos semanales de una hora, edición, baja y reactivación, control de solapamientos y operaciones administrativas en lote. La reasignación automática de clientes y las reservas con fecha puntual quedan fuera del MVP. Desactivar un turno conserva sus datos y asignaciones; eliminarlo definitivamente requiere confirmación y pierde su historial.

**Pagos:** el administrador registra **inscripción inicial** y **cuotas**, consulta las obligaciones de cada cliente y registra su cobro. Los pendientes tienen vencimiento y la fecha de pago se completa al cobrar. Esta es una operación exclusiva del Administrador; el Entrenador no gestiona pagos.

---

## 11. Gestión de historia clínica

El cliente con cuenta de usuario puede cargar información básica de salud de manera opcional: antecedentes y lesiones previas relevantes para el entrenamiento, y actualizarla si posteriormente sufre una lesión.

El administrador y los entrenadores también pueden crear y modificar la historia clínica de un cliente, incluso cuando este no tiene una cuenta de usuario. La consulta presenta los datos autorizados sin modificarlos. La carga y edición son operaciones diferenciadas, habilitadas para el titular y para el personal según sus permisos. El resto de los clientes no tiene acceso a la historia clínica de otros clientes.

La información se mantiene restringida a estos roles porque se trata de datos sensibles. Se registran antecedentes, lesiones y observaciones de texto. Los archivos médicos adjuntos quedan fuera del MVP.

**Auditoría:** al igual que en los pagos (donde se registra `usuarioRegistroId`), cada carga o modificación de la historia clínica registra el `usuarioModificacionId` del actor que la realizó, además de la fecha de actualización (`fechaActualizacion`). Esto permite auditar no solo cuándo se modificó un registro clínico, sino quién lo hizo, dado lo sensible de esta información. El diseño detallado del control de acceso a esta información está documentado en `docs/SEGURIDAD.md`.

---

## 12. Tecnologías, instalación y demostración

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | HTML, CSS, TypeScript y Vite | Permite construir las pantallas y compilar sus recursos. Lucide aporta iconos y ExcelJS permite leer la plantilla XLSX de ejercicios. |
| **Backend** | Node.js y TypeScript, módulo `node:http` | Comparte lenguaje con el frontend y expone la API HTTP sin un framework adicional. |
| **Persistencia** | MongoDB Atlas y driver oficial `mongodb` | Representa fichas, rutinas e historia clínica embebidas y conserva referencias a cuentas, ejercicios, turnos y pagos. |
| **Autenticación** | Cookie `HttpOnly` y sesiones en MongoDB | El token aleatorio se valida mediante su hash, vencimiento y cuenta activa. Las contraseñas se protegen con `bcryptjs`. |
| **Control de versiones** | Git y GitHub | Repositorio compartido y trazabilidad del trabajo del equipo. |
| **Demostración** | Render | Un servicio Node.js entrega la API y `frontend/dist` desde el mismo origen HTTPS. El equipo selecciona manualmente qué versión despliega. |

La demostración está en [gymmanager-grupo-101.onrender.com](https://gymmanager-grupo-101.onrender.com/).

**Base de datos:** `gym_manager` contiene siete colecciones. El modelo utiliza `pagos.monto` BSON Decimal128 y `usuarios.rol` como arreglo no vacío, admitiendo varios roles por cuenta. El [esquema NoSQL](docs/ESQUEMA_NOSQL.md) describe los campos, referencias y restricciones.

La relación uno a uno entre cuentas y fichas utiliza índices únicos `sparse` y referencias recíprocas. La historia clínica se embebe en `clientes` y se consulta mediante su endpoint específico.

### Instalación y ejecución local

Se utiliza Node.js 24 y npm. Desde la raíz, instalar dependencias y seguir las instrucciones de [backend](backend/README.md) y [frontend](frontend/README.md). Para conectar con Atlas se crea `backend/.env` a partir de `backend/.env.ejemplo` y se completan las credenciales privadas.

```bash
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix frontend run build
npm --prefix backend run build
npm --prefix backend start
```

Con el entorno configurado y `PORT=3000`, la aplicación compilada se abre en `http://localhost:3000/`. La alternativa con Vite está explicada en el README del frontend.

---

## 13. Viabilidad

**Técnica:** viable con tecnologías conocidas por el equipo; no requiere alta concurrencia ni procesamiento masivo de datos.

**Operativa:** el equipo tiene contacto directo con personal administrativo del gimnasio, lo que permite relevar el proceso real (ver Sección 14) aunque no haya acceso a la metodología de entrenamiento propietaria.

**Temporal:** los tres integrantes cursan otras materias en simultáneo. Por eso se decidió mantener el MVP acotado a un solo gimnasio y dejar la multi-tenencia (Sección 7) fuera de esta entrega, aun sabiendo que es la dirección de producto a futuro. Turnos e historia clínica sí entran al MVP porque son parte del funcionamiento real del gimnasio base, no una funcionalidad nueva de plataforma.

---

## 14. Criterios de diseño del MVP

Los criterios siguientes sintetizan las decisiones descritas en los requisitos, las reglas de negocio y el modelo NoSQL:

- **Clientes y cuentas:** la ficha y la cuenta de acceso son entidades distintas, con vinculación opcional uno a uno. Se gestionan clientes con y sin cuenta.
- **Rutinas:** se asignan a clientes activos usando ejercicios del catálogo, con series, repeticiones, peso, descanso, orden y observaciones. Se conserva una rutina vigente y hasta 12 en total por cliente. La consulta digital y la impresión permiten atender a clientes con y sin cuenta.
- **Turnos:** el MVP utiliza turnos semanales recurrentes de una hora, con entrenador responsable y cupo configurable. Las reservas puntuales y la reasignación automática quedan fuera del alcance.
- **Historia clínica:** es opcional y se limita a antecedentes, lesiones y observaciones relevantes para el entrenamiento. El acceso corresponde al titular y al personal autorizado; no se incluyen adjuntos médicos.
- **Pagos:** se registran inscripciones y cuotas, con estados `PAGADO`, `PENDIENTE` y `VENCIDO`. La carga de obligaciones es manual. Las restricciones de fechas de Atlas se describen en el [esquema NoSQL](docs/ESQUEMA_NOSQL.md).
- **Evaluación del valor:** centralizar información y facilitar la gestión son los beneficios esperados. No se publican mediciones cuantitativas de ahorro de tiempo o reducción de errores.

---

## 15. Riesgos

| Riesgo | Mitigación |
|---|---|
| Disponibilidad de tiempo (cursada simultánea) | MVP acotado a un solo gimnasio; multi-tenencia y funciones premium quedan como roadmap (Sección 7). |
| Aumento de alcance por sumar turnero e historia clínica | Se acotan a lo esencial (turnero básico, historia clínica mínima) y se dejan afuera funciones que no son del gimnasio base. |
| Manejo de datos sensibles (historia clínica) | Acceso del titular y del personal autorizado; se pide solo información mínima necesaria. |
| Falta de acceso a la metodología de rutinas del gimnasio | Catálogo de ejercicios genérico para el MVP (Sección 9). |
| Integración de datos y aplicaciones | Mantener contratos de datos consistentes con el modelo de Atlas y considerar las limitaciones de la Sección 6. |
| Integridad de pagos y referencias | Validaciones, índices y operaciones consistentes entre documentos, conforme al esquema acordado. |
| Despliegue | Selección manual de versiones en Render y comprobación del servicio de demostración. |
| Crecimiento de alcance hacia la visión multi-tenant | Explícitamente fuera del MVP (Sección 7); no se toca hasta después de la entrega. |

---

## 16. Documentación del proyecto

La documentación describe el alcance, el diseño y los criterios de aceptación del MVP. Las dos primeras entregas académicas están aprobadas. Los requisitos y las verificaciones previstas no constituyen por sí mismos resultados de pruebas.

| Documento | Contenido |
|---|---|
| [Frontend](frontend/README.md) | Instalación, pantallas, archivos y comunicación con la API. |
| [Backend](backend/README.md) | Entorno, ejecución, rutas, sesiones y servicios. |
| [Arquitectura](docs/ARQUITECTURA.md) | Capas, tecnologías y comunicación. |
| [Módulos](docs/MODULOS.md) | Funcionalidades y permisos por área. |
| [Requerimientos funcionales](docs/REQUERIMIENTOS_FUNCIONALES.md) | Funciones del MVP y criterios de aceptación. |
| [Requerimientos no funcionales](docs/REQUERIMIENTOS_NO_FUNCIONALES.md) | Seguridad, integridad, usabilidad y objetivos operativos. |
| [Casos de uso](docs/CASOS_DE_USO.md) | Actores y flujos de interacción. |
| [Historias de usuario](docs/HISTORIAS_DE_USUARIO.md) | Necesidades y criterios de aceptación. |
| [Reglas de negocio](docs/REGLAS_DE_NEGOCIO.md) | Restricciones del dominio. |
| [Matriz de trazabilidad](docs/MATRIZ_DE_TRAZABILIDAD.md) | Correspondencia de requisitos, casos, reglas y verificaciones. |
| [Esquema NoSQL](docs/ESQUEMA_NOSQL.md) | Colecciones, tipos, relaciones e índices. |
| [Diagrama UML](docs/DIAGRAMA_UML.md) | Representación del modelo documental. |
| [Despliegue](docs/DIAGRAMA_DE_DESPLIEGUE.md) | Componentes de la demostración. |
| [Diagramas de actividad](docs/DIAGRAMAS_DE_ACTIVIDAD.md) | Flujos de rutinas, historia clínica y pagos. |
| [Diagramas de secuencia](docs/DIAGRAMAS_DE_SECUENCIA.md) | Interacción entre componentes. |
| [Seguridad](docs/SEGURIDAD.md) | Autenticación, permisos y datos sensibles. |
| [Mockups](docs/MOCKUPS.md) | Referencias conceptuales de la interfaz. |

---

## 17. Equipo y tutor

**Equipo:** Fernando Joaquín Aguillón Basabilbaso · Emanuel Aaron Brahim Pollini · Mauro Alberto Zavatti

**Tutor:** Gerardo Adrian Herrera Molas

**Repositorio:** [TPI_Grupo_101_GymManager en GitHub](https://github.com/maurozavatti/TPI_Grupo_101_GymManager)

**Estructura del repositorio:** `/frontend` (aplicación web), `/backend` (API REST), `/database` (scripts de creación de la base de datos) y `/docs` (diseño de base de datos, módulos, diagramas, casos de uso, reglas de negocio y seguridad).
