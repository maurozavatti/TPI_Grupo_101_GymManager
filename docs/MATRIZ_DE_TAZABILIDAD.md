# Matriz de Trazabilidad — Gym Manager

**Proyecto:** Gym Manager · Grupo 101  
**Versión:** 2.0 — Propuesta para validación  
**Convención:** esta matriz relaciona identificadores; no reproduce las descripciones completas de los RF, RNF ni reglas. Las definiciones oficiales se mantienen en sus documentos fuente.

## 1. Objetivo y documentos fuente

La matriz permite seguir cada requerimiento hacia sus casos de uso, reglas de negocio y verificaciones. Para evitar duplicación, el texto de cada requisito se mantiene únicamente en su catálogo correspondiente.

| Elemento | Fuente oficial |
|---|---|
| `RF-XXX` | `REQUERIMIENTOS_FUNCIONALES.md` |
| `RNF-XXX` | `REQUERIMIENTOS_NO_FUNCIONALES.md` |
| `CU-XX` | `CASOS_DE_USO.md` |
| `RN-XX` | `REGLAS_DE_NEGOCIO.md` |
| Diseño de controles de seguridad | `SEGURIDAD.md` |
| Diseño y arquitectura | `DIAGRAMA_UML.md`, `ESQUEMA_NOSQL.md`, `ARQUITECTURA.md` |

**Importante:** una relación indicada en la matriz identifica la cobertura documental prevista; no demuestra por sí misma que la función esté implementada ni que la prueba haya sido ejecutada.

## 2. Trazabilidad de requerimientos funcionales

| Identificador | Caso(s) de uso | Regla(s) de negocio | Verificación |
|---|---|---|---|
| RF-001 | CU-01 | — | CP-01 |
| RF-002 | CU-01 | — | CP-01 |
| RF-003 | CU-01 | — | CP-02 |
| RF-004 | CU-01 | — | CP-01 |
| RF-005 | CU-03 | — | CP-03 |
| RF-006 | CU-04 (cobertura parcial; alta/vinculación requiere aclaración) | RN-02 | CP-04 |
| RF-007 | CU-04 | RN-02, RN-12 | CP-04 |
| RF-008 | Pendiente de ampliar CU | RN-01 | CP-05 |
| RF-009 | Pendiente de ampliar CU | — | CP-05 |
| RF-010 | CU-05 | RN-01 | CP-05 |
| RF-011 | Pendiente de ampliar CU | — | CP-05 |
| RF-012 | CU-06 | RN-12 | CP-06 |
| RF-013 | Pendiente de ampliar CU | RN-12 | CP-06 |
| RF-014 | Pendiente de ampliar CU | RN-12 | CP-06 |
| RF-015 | Pendiente de ampliar CU | RN-01, RN-12 | CP-06 |
| RF-016 | CU-07 | RN-03, RN-04 | CP-07, CP-08 |
| RF-017 | CU-07 | — | CP-07 |
| RF-018 | CU-08 | RN-03 | CP-09 |
| RF-019 | CU-07 | RN-03 | CP-07 |
| RF-020 | CU-07 | RN-04 | CP-08 |
| RF-021 | CU-08 (flujo alternativo) | — | CP-09 |
| RF-022 | CU-09 | RN-05, RN-06 | CP-10 |
| RF-023 | CU-09 | RN-05, RN-06 | CP-10 |
| RF-024 | CU-10 | RN-05, RN-06 | CP-11 |
| RF-025 | CU-10 | RN-06 | CP-11, CP-12 |
| RF-026 | CU-11 | RN-07 | CP-13 |
| RF-027 | CU-11, CU-12 (consulta del cliente pendiente de detalle) | RN-07 | CP-13 |
| RF-028 | CU-12 | RN-08 | CP-14 |
| RF-029 | CU-12 | RN-08 | CP-14 |
| RF-030 | Pendiente de ampliar CU | RN-08 | CP-14 |
| RF-031 | CU-13 | RN-09, RN-10 | CP-15 |
| RF-032 | CU-13 | RN-09 | CP-15 |
| RF-033 | CU-13 | RN-10 | CP-15 |
| RF-034 | CU-13, CU-14 | — | CP-16 |
| RF-035 | CU-14 | RN-11 | CP-16 |
| RF-036 | CU-15 | RN-13 | CP-17 |
| RF-037 | CU-15 | — | CP-17 |
| RF-038 | CU-15 | RN-11 | CP-17 |
| RF-039 | CU-15 | RN-13 | CP-17 |
| RF-040 | CU-15 | — | CP-17 |
| RF-041 | CU-15 | — | CP-17 |

## 3. Trazabilidad de requerimientos no funcionales

| Identificador | Caso(s) de uso | Regla(s) de negocio | Verificación |
|---|---|---|---|
| RNF-001 | CU-01, CU-03 | — | CP-18 |
| RNF-002 | CU-01, CU-09, CU-10, CU-13 | RN-06 | CP-02, CP-12 |
| RNF-003 | CU-01 | — | CP-19 |
| RNF-004 | CU-09, CU-10 | RN-06 | CP-11, CP-12 |
| RNF-005 | CU-09, CU-10 | RN-05, RN-06 | CP-12 |
| RNF-006 | CU-09, CU-10, CU-12, CU-15 | RN-06 | CP-12 |
| RNF-007 | Despliegue | — | CP-20 |
| RNF-008 | Despliegue/configuración | — | CP-21 |
| RNF-009 | Persistencia/configuración | RN-12 | CP-21 |
| RNF-010 | CU-04, CU-06, CU-12 | RN-02, RN-12 | CP-22 |
| RNF-011 | CU-13 | RN-09 | CP-23 |
| RNF-012 | CU-07, CU-13, CU-14 | RN-03, RN-04, RN-11 | CP-07, CP-16 |
| RNF-013 | Arquitectura | — | CP-24 |
| RNF-014 | Arquitectura | — | CP-24 |
| RNF-015 | Arquitectura | — | CP-25 |
| RNF-016 | Despliegue/configuración | — | CP-21 |
| RNF-017 | Todos los documentos | RN-01–RN-13 | CP-26 |
| RNF-018 | CU-08, CU-15 | — | CP-27 |
| RNF-019 | Casos con formularios | — | CP-28 |
| RNF-020 | CU-01, CU-07, CU-13, CU-15 | — | CP-29 (umbral pendiente) |
| RNF-021 | Despliegue | — | CP-30 (objetivo pendiente) |

## 4. Catálogo único de verificaciones previstas

La matriz referencia las pruebas mediante `CP-XX`. Sus descripciones se mantienen únicamente en esta sección para que no haya una segunda lista de pruebas en los catálogos de requisitos.

| ID | Verificación prevista | Relación principal |
|---|---|---|
| CP-01 | Probar inicio de sesión correcto, credenciales incorrectas, cuenta inactiva y cierre de sesión. | RF-001, RF-002, RF-004 |
| CP-02 | Intentar operaciones protegidas con cada rol y comprobar que el backend rechace permisos insuficientes. | RF-003, RNF-002 |
| CP-03 | Cambiar la contraseña autenticado; comprobar que no se acepte una contraseña actual incorrecta. | RF-005 |
| CP-04 | Registrar clientes con y sin cuenta y comprobar que la asociación usuario-cliente no se duplique. | RF-006, RF-007 |
| CP-05 | Consultar, buscar, modificar y dar de baja un cliente; comprobar que la baja conserve el historial. | RF-008–RF-011 |
| CP-06 | Ejecutar alta, consulta/búsqueda, modificación y baja lógica de ejercicios; probar un código duplicado. | RF-012–RF-015 |
| CP-07 | Asignar una rutina con ejercicios válidos; comprobar que la nueva rutina quede activa y la anterior inactiva. | RF-016, RF-017, RF-019 |
| CP-08 | Superar el límite de historial en un escenario controlado y comprobar que solo se elimina la rutina inactiva más antigua. | RF-020 |
| CP-09 | Consultar la rutina vigente y generar la versión imprimible para un cliente sin cuenta. | RF-018, RF-021 |
| CP-10 | Crear y actualizar historia clínica opcional con actores habilitados y comprobar fecha de actualización. | RF-022, RF-023 |
| CP-11 | Probar lectura/modificación de historia propia y ajena con los distintos roles; denegar el acceso a otro cliente. | RF-024, RF-025 |
| CP-12 | Comprobar que endpoints generales no devuelvan datos de historia clínica a solicitudes que no los requieren. | RF-025, RNF-004–RNF-006 |
| CP-13 | Crear y consultar un turno semanal con día, horarios, entrenador y capacidad. | RF-026, RF-027 |
| CP-14 | Asignar, retirar y consultar clientes de turnos; rechazar una asignación que exceda la capacidad. | RF-028–RF-030 |
| CP-15 | Registrar inscripción/cuota y comprobar cliente, monto, fechas, estado y usuario que registró la operación. | RF-031–RF-033 |
| CP-16 | Probar el proceso de vencimiento con pagos vencidos impagos y obligaciones ya pagadas; comprobar el estado final. | RF-034, RF-035 |
| CP-17 | Comparar indicadores del dashboard con un conjunto de datos de prueba conocido. | RF-036–RF-041 |
| CP-18 | Inspeccionar el almacenamiento para comprobar que no persistan contraseñas en texto plano. | RNF-001 |
| CP-19 | Probar tokens válidos, expirados, inválidos y ausentes. | RNF-003 |
| CP-20 | En el entorno desplegado, comprobar HTTPS y un certificado válido. | RNF-007 |
| CP-21 | Revisar configuración, secretos, CORS y permisos de acceso a MongoDB para verificar que no haya credenciales en código fuente. | RNF-008, RNF-009, RNF-016 |
| CP-22 | Ejecutar los scripts de índices y comprobar que email, DNI, código de ejercicio y relación uno-a-uno rechacen duplicados. | RNF-010 |
| CP-23 | Comprobar que el monto se persista como `Decimal128` y que sus operaciones no sufran redondeo inesperado. | RNF-011 |
| CP-24 | Revisar que frontend, backend, controladores, servicios, repositorios y persistencia mantengan las responsabilidades documentadas. | RNF-013, RNF-014 |
| CP-25 | Inspeccionar solicitudes y respuestas de API para verificar REST/JSON y los contratos publicados. | RNF-015 |
| CP-26 | Comparar identificadores y referencias entre RF, RNF, reglas, casos de uso, seguridad y matriz. | RNF-017 |
| CP-27 | Probar las pantallas principales en tamaños de pantalla móvil y escritorio. | RNF-018 |
| CP-28 | Probar validaciones y mensajes de error de formularios con datos válidos e inválidos. | RNF-019 |
| CP-29 | Ejecutar mediciones de rendimiento cuando el equipo haya aprobado los umbrales y condiciones de carga. | RNF-020 |
| CP-30 | Verificar disponibilidad y recuperación según los objetivos que el equipo defina tras seleccionar el hosting. | RNF-021 |

## 5. Gaps de trazabilidad detectados

Los siguientes puntos no deben ocultarse marcándolos como cumplidos; requieren una actualización posterior de los documentos:

1. **Casos de uso por ampliar:** las operaciones de consulta/edición/búsqueda de clientes, modificación y baja de ejercicios, baja de asignación de un turno y ciertos flujos de cuenta no tienen un caso de uso específico completo en la versión actual. Se indica en la tabla como pendiente de ampliar.
2. **Recuperación de contraseña:** `CU-02` y su historia de usuario siguen en el repositorio, pero la especificación actual del MVP la excluye. El equipo debe retirar esos elementos del alcance del MVP o aprobar explícitamente un cambio de alcance; no deben mantenerse como requisito vigente y excluido al mismo tiempo.
3. **Permisos de ejercicios:** `MODULOS.md` y `CASOS_DE_USO.md` no asignan de manera idéntica los permisos del catálogo. Debe aprobarse una política única.
4. **Pagos vencidos:** definir la relación entre vencimiento, estado impago y registro de una cuota posterior, de modo que el proceso periódico no marque incorrectamente una obligación ya saldada.
5. **Permisos de pagos:** `MODULOS.md` y `CU-13` reservan el registro de pagos al Administrador, pero `RN-10` dice que `usuarioRegistroId` puede corresponder a `ADMIN` o `ENTRENADOR`. El equipo debe acordar una política única y alinear el RF y los casos de uso.
6. **RNF-020 y RNF-021:** los umbrales cuantitativos de rendimiento, disponibilidad y recuperación no figuran definidos; las verificaciones correspondientes no pueden aprobarse hasta que se establezcan.

## 6. Estado de ejecución

Todas las entradas `CP-XX` de esta versión son **verificaciones previstas**. Debe agregarse el resultado de ejecución (pendiente/aprobada/rechazada), fecha, responsable y evidencia cuando se realicen las pruebas. No se considera que una prueba esté aprobada por estar documentada.
