# Gym Manager — Sistema de Gestión para Gimnasio

> **Trabajo Final Integrador — Tecnicatura Universitaria en Programación**
> **Estado:** Etapa 2 (Diseño y Módulos) — correcciones del tutor aplicadas, pendiente de aprobación final
> **Nombre:** Gym Manager

---

## 1. Descripción del proyecto

Gym Manager es una aplicación web para la gestión interna de un gimnasio real. Centraliza la gestión de clientes, ejercicios, rutinas, turnos y pagos, reemplazando progresivamente el uso de planillas de Excel y registros en papel.

El personal administra la información desde una única plataforma. Los clientes con cuenta consultan su rutina, sus ejercicios y su turno asignado desde cualquier dispositivo (especialmente el celular). El sistema también permite administrar clientes **sin cuenta**, para no excluir a quienes no puedan o no quieran usar la plataforma.

**Visión de producto:** a futuro, el objetivo es que Gym Manager pueda ofrecerse como plataforma para gimnasios en general (no solo el gimnasio base), con un esquema de suscripción y funcionalidades adicionales como servicios pagos. Para el **Trabajo Final Integrador, el MVP se mantiene acotado a un único gimnasio** (el gimnasio real de referencia), diseñado con una separación de responsabilidades que no impide crecer hacia ese modelo más adelante. El detalle de esa visión está en la Sección 7.

---

## 2. Problemática

> **Quién lo sufre:** el personal administrativo y los entrenadores del gimnasio.
> **Problema:** la información de ejercicios, rutinas, turnos, clientes y pagos está dispersa entre una planilla de Excel y registros en papel, sin relación entre sí.
> **Impacto:** *(completar con datos del relevamiento — ver Sección 14. Ej.: tiempo semanal dedicado a armar rutinas y turnos manualmente, cantidad de clientes activos, errores de seguimiento de pagos detectados)*.
> **Qué haría la solución:** centralizar ejercicios, rutinas, turnos, clientes, historia clínica básica y pagos en una sola plataforma, permitiendo crear rutinas seleccionando ejercicios ya cargados, coordinar turnos y consultar el estado de pagos sin cruzar planillas.

El problema no es "falta una app": es la ausencia de relación entre los datos y la dependencia de tareas manuales repetitivas para armar rutinas, coordinar turnos y hacer seguimiento de pagos.

### Diferenciación

Existen soluciones comerciales de gestión de gimnasios. GymManager no busca competir con ellas en esta etapa, sino resolver el caso puntual del gimnasio base con acceso directo a sus procesos reales, sin costo de licencia y adaptado a que conviven clientes con y sin cuenta.

---

## 3. Actores

| Actor | Responsabilidades principales |
|---|---|
| **Administrador / Dueño** | Gestiona clientes, entrenadores y ejercicios; registra y consulta pagos; define turnos; administra historia clínica de los clientes. |
| **Entrenador** | Consulta el catálogo de ejercicios; crea, asigna y modifica rutinas; asigna clientes a turnos (clientes con y sin cuenta). |
| **Cliente** | Inicia sesión, consulta su perfil, su rutina y sus ejercicios asignados, ve su turno, carga y actualiza su historia clínica. No modifica su rutina ni su turno. |

**Sobre el rol de Súper Admin:** el equipo del proyecto va a operar como administrador general de la plataforma, pero ese rol solo tiene sentido cuando existe más de un gimnasio usando el sistema (multi-tenant). Como el MVP del TFI está acotado a un único gimnasio, **el rol de Administrador/Dueño ya cubre esa función para esta entrega** — no se implementa un actor "Súper Admin" separado todavía. Ese rol queda documentado como parte de la visión a futuro (Sección 7), cuando exista más de un gimnasio y haya que gestionar altas y suscripciones entre ellos.

---

## 4. Propuesta de solución y valor agregado

La aplicación usará una base de datos NoSQL (MongoDB) para ejercicios, usuarios, rutinas, turnos, historia clínica y pagos. El entrenador seleccionará ejercicios ya cargados en el sistema y los asociará a la rutina de un cliente, reemplazando la consulta manual del Excel.

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

1. Registro e inicio de sesión, con sistema de roles y permisos.
2. Gestión de clientes (con y sin cuenta).
3. Catálogo de ejercicios genérico (alta, modificación y baja lógica).
4. Creación y asignación de rutinas por parte de los entrenadores.
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
- Login con Google, carga/generación de comprobantes, historial detallado de pagos, alertas automáticas, estadísticas y reportes avanzados.

### Criterios de éxito del MVP

- Un entrenador puede crear una rutina completa usando solo el catálogo cargado en el sistema, sin recurrir al Excel.
- El administrador puede identificar, para cualquier cliente, si tiene pagos vencidos.
- Un cliente registrado puede ver su rutina, sus ejercicios y su turno asignado desde el celular.
- Un cliente puede cargar su historia clínica cuando decida hacerlo y actualizarla si reporta una lesión.
- El sistema funciona correctamente tanto para clientes con cuenta como sin cuenta.

---

## 6. Funcionalidades futuras del MVP (mismo gimnasio, condicionadas al tiempo disponible)

Se incorporarán **solo si el avance del MVP y los tiempos disponibles lo permiten**: login con Google, carga y generación de comprobantes, historial detallado de pagos, notificaciones automáticas de vencimiento y otras funcionalidades detectadas durante el relevamiento.

El dashboard, los reportes básicos y la identificación de cuotas vencidas o próximas a vencer forman parte del alcance actual del MVP.

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

El sistema no obligará a ningún cliente a registrarse. El personal podrá cargar un cliente solo con sus datos identificatorios, asignarle una rutina y un turno (imprimibles), registrar sus pagos y, cuando sea necesario, cargar o actualizar su historia clínica básica en nombre del cliente, sin necesidad de una cuenta de usuario. Si más adelante el cliente decide registrarse, su información podrá asociarse a la cuenta sin duplicar datos.

---

## 9. Gestión de ejercicios

El sistema tendrá un catálogo propio de ejercicios (nombre, descripción, y los campos que surjan del relevamiento), administrable con baja lógica para conservar el historial.

> **Nota sobre el catálogo:** el gimnasio utiliza una metodología de entrenamiento contratada a un profesional externo, a la que el equipo no tiene acceso ni derecho de uso. Por eso, el MVP se construirá con un **catálogo de ejercicios genérico** (de uso común y libre), único y compartido. La posibilidad de que cada gimnasio cargue su propio catálogo queda para la fase multi-tenant (Sección 7).

---

## 10. Gestión de rutinas, turnos y pagos

**Rutinas:** el entrenador selecciona ejercicios del catálogo y los asocia a un cliente, indicando series, repeticiones, peso, orden y observaciones. La estructura definitiva se ajustará luego del relevamiento (ver Sección 14).

**Turnos:** el administrador o entrenador define turnos (día, horario, cupo máximo) y asigna clientes a ellos. El cliente con cuenta consulta su turno asignado desde su perfil. La estructura definitiva (por ejemplo, si los turnos son por clase grupal, por entrenador, o ambos) se define en el relevamiento.

**Pagos:** el administrador podrá registrar, como mínimo, la **inscripción inicial** (pago único al ingresar) y la **cuota periódica**, con fecha de pago y de próximo vencimiento, y consultar qué clientes están al día o vencidos.

---

## 11. Gestión de historia clínica

El cliente con su cuenta de usuario podrá cargar información básica de salud de manera opcional: antecedentes y lesiones previas relevantes para el entrenamiento. Si posteriormente sufre una lesión, podrá actualizar esa información.

En el caso de clientes sin cuenta, el administrador o los entrenadores también podrán cargar y actualizar esta información en nombre del cliente, cuando sea necesario.

La información será visible únicamente para el administrador, los entrenadores y el propio cliente si tiene un usuario asociado a su cuenta (no es pública ni la ven otros clientes), dado que se trata de datos sensibles. El detalle de los campos a relevar (por ejemplo, si se permite adjuntar documentación médica) se define en la Etapa 2, priorizando pedir solo la información mínima necesaria.

---

## 12. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | HTML, CSS, TypeScript, Vite | Conocidas por el equipo; Vite agiliza el desarrollo. Requiere Node.js solo como entorno de build, no como backend de la aplicación. |
| **Backend** | Java + Spring Boot | Es la tecnología con la que el equipo tiene más experiencia acumulada durante la carrera. Encaja con el escenario "entornos empresariales, seguridad de tipado" y evita sumar una segunda tecnología de servidor (Node.js) sin necesidad real. |
| **Base de datos** | MongoDB (NoSQL) | El equipo ya la conoce y la maneja con comodidad. El modelo de documentos se adapta bien a ejercicios, rutinas y turnos (estructura flexible). *Ver aclaración sobre pagos abajo.* |
| **Control de versiones** | GitHub | Repositorio único, requisito del TFI. |
| **Despliegue** | A definir — ver recomendación abajo | Prioriza costo cero/bajo y facilidad de configuración. |

**Sobre la elección de MongoDB:** la razón principal y honesta es que el equipo ya la domina, no que el proyecto la necesite técnicamente. El módulo de **pagos** es el que más se beneficiaría de un modelo relacional (relaciones cliente–pago–vencimiento e integridad transaccional). Como mitigación, se prestará especial atención al diseño del esquema de pagos en MongoDB durante la etapa de diseño de base de datos. La **historia clínica**, al ser información sensible, se diseñará como una colección con acceso restringido (no expuesta en los mismos endpoints públicos que el resto del perfil).

**Herramientas adicionales a definir en la Etapa 2:** Spring Data MongoDB (persistencia), Spring Security + JWT (autenticación/roles), y documentación de API (OpenAPI/Swagger).

**Hosting sugerido** (gratuito o de bajo costo):

- **Frontend:** Vercel o Netlify (build estático de Vite).
- **Backend:** Render o Google Cloud Run (contenedor Docker con la app Spring Boot).
- **Base de datos:** MongoDB Atlas (tier gratuito M0).

---

## 13. Viabilidad

**Técnica:** viable con tecnologías conocidas por el equipo; no requiere alta concurrencia ni procesamiento masivo de datos.

**Operativa:** el equipo tiene contacto directo con personal administrativo del gimnasio, lo que permite relevar el proceso real (ver Sección 14) aunque no haya acceso a la metodología de entrenamiento propietaria.

**Temporal:** los tres integrantes cursan otras materias en simultáneo. Por eso se decidió mantener el MVP acotado a un solo gimnasio y dejar la multi-tenencia (Sección 7) fuera de esta entrega, aun sabiendo que es la dirección de producto a futuro. Turnos e historia clínica sí entran al MVP porque son parte del funcionamiento real del gimnasio base, no una funcionalidad nueva de plataforma.

---

## 14. Preguntas de diseño a resolver

Como el proyecto apunta a funcionar para gimnasios en general y no solo para el gimnasio base, estas no son preguntas para un único contacto administrativo, sino preguntas que el equipo se plantea a sí mismo al diseñar cada módulo, para que las decisiones no queden atadas a las particularidades de un solo gimnasio:

**Rutinas:**
- ¿Qué información mínima de un cliente hace falta antes de poder armarle una rutina, sin importar el gimnasio?
- ¿Qué datos por ejercicio son comunes a cualquier rutina (series, repeticiones, peso, descanso, orden) y cuáles dependen del tipo de entrenamiento de cada gimnasio?
- ¿Cómo entregamos la rutina de forma que sirva tanto para un gimnasio que trabaja en papel como para uno 100% digital?

**Turnos:**
- ¿Todos los gimnasios necesitan turnos, o el sistema tiene que soportar tanto "con turno" como "libre"?
- ¿Qué estructura de turno es lo suficientemente genérica como para representar una clase grupal, un turno individual o una franja libre?
- ¿La regla de cupo máximo debería ser fija o configurable por cada gimnasio?

**Historia clínica:**
- ¿Qué información de salud es razonable pedir a cualquier cliente, sin exceder lo necesario ni pedir de más?
- ¿Cómo evitamos recolectar datos sensibles innecesarios sin perder el objetivo de registrar lesiones?

**Pagos:**
- ¿Qué tipos de pago son comunes a cualquier gimnasio (inscripción, cuota) y cuáles varían según el negocio (clases sueltas, planes)?
- ¿Cómo representamos los vencimientos de forma que funcione sin importar la periodicidad que use cada gimnasio (mensual, trimestral, etc.)?

**Impacto:**
- ¿Qué evidencia mínima necesitamos del gimnasio base para validar que el problema es real y que la solución aporta valor, de manera que ese mismo criterio sirva después para validar con otros gimnasios?

---

## 15. Riesgos

| Riesgo | Mitigación |
|---|---|
| Disponibilidad de tiempo (cursada simultánea) | MVP acotado a un solo gimnasio; multi-tenencia y funciones premium quedan como roadmap (Sección 7). |
| Aumento de alcance por sumar turnero e historia clínica | Se acotan a lo esencial (turnero básico, historia clínica mínima) y se dejan afuera funciones que no son del gimnasio base. |
| Manejo de datos sensibles (historia clínica) | Acceso restringido a administrador/entrenador; se pide solo información mínima necesaria. |
| Falta de acceso a la metodología de rutinas del gimnasio | Catálogo de ejercicios genérico para el MVP (Sección 9). |
| Definición tardía de la estructura de rutinas/turnos/pagos | Relevamiento antes de cerrar el diseño de base de datos (Sección 14). |
| Elección de MongoDB para datos relacionales (pagos) | Diseño cuidadoso del esquema en la Etapa 2 (Sección 12). |
| Despliegue | Definido tentativamente en Sección 12; confirmar en Etapa 2. |
| Crecimiento de alcance hacia la visión multi-tenant | Explícitamente fuera del MVP (Sección 7); no se toca hasta después de la entrega. |

---

## 16. Plan de trabajo

1. **Propuesta y relevamiento** — problemática, alcance, repositorio, relevamiento inicial, stack.
2. **Arquitectura y diseño** — base de datos (incluyendo turnos e historia clínica), roles, módulos, framework backend confirmado, plataforma de despliegue.
3. **Desarrollo del MVP** — autenticación, roles, clientes, ejercicios, rutinas, turnero, historia clínica, pagos, clientes sin cuenta, impresión.
4. **Pruebas y refinamiento** — pruebas funcionales, validación con el gimnasio, ajustes de usabilidad y móvil.
5. **Despliegue y documentación** — despliegue online, documentación, informe final, video y defensa oral.

---

## 17. Equipo y tutor

**Equipo:** Fernando Joaquín Aguillón Basabilbaso · Emanuel Aaron Brahim Pollini · Mauro Alberto Zavatti
**Tutor:** Gerardo Adrian Herrera Molas
**Repositorio:** https://github.com/maurozavatti/TPI_Grupo_101_GymManager.git
