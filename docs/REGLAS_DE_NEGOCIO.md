# Catálogo de Reglas de Negocio — Gym Manager

## Descripción

Este catálogo reúne las reglas del MVP y conserva sus identificadores para facilitar la consulta y trazabilidad. Las reglas se contrastan con el esquema, los módulos y los casos de uso.

---

| ID | Regla | Módulo / Colección afectada | Fuente |
|---|---|---|---|
| RN-01 | Toda baja de `usuarios`, `clientes` o `ejercicios` es lógica: se marca `activo: false` y se completa `fechaBaja`, sin eliminar el documento ni su historial asociado. | Autenticación y Roles, Gestión de Clientes, Catálogo de Ejercicios | `ESQUEMA_NOSQL.md` |
| RN-02 | La vinculación entre cuenta y ficha es opcional y uno a uno. Los índices únicos `sparse` evitan referencias duplicadas presentes; la aplicación mantiene `usuarios.clienteId` y `clientes.usuarioId` de forma recíproca mediante una transacción y omite las referencias cuando no existe vínculo. | Autenticación y Roles, Gestión de Clientes | `ESQUEMA_NOSQL.md` (Índices únicos) |
| RN-03 | En el arreglo `rutinas[]` de un cliente, solo un elemento puede tener `activo: true` a la vez (la rutina vigente). Al asignar una rutina nueva, la anterior pasa a `activo: false`. | Rutinas | `ESQUEMA_NOSQL.md`, `DIAGRAMA_UML.md` |
| RN-04 | El historial de `rutinas[]` por cliente está limitado a 12 elementos. Al superar el límite, se elimina físicamente la rutina inactiva más antigua (nunca la vigente). | Rutinas | `ESQUEMA_NOSQL.md`, `DIAGRAMA_UML.md` |
| RN-05 | La historia clínica (`clientes.historiaClinica`) es un campo opcional (cardinalidad `0..1`): no se exige al registrarse, se carga cuando corresponde. | Historia Clínica | `ESQUEMA_NOSQL.md`, `DIAGRAMA_UML.md` |
| RN-06 | Solo el propio Cliente (si tiene cuenta), el Administrador o el Entrenador pueden crear/modificar la historia clínica de un cliente. El Administrador y el Entrenador pueden hacerlo incluso si el cliente no tiene cuenta. El resto de los clientes no tiene acceso. | Historia Clínica | `MODULOS.md` |
| RN-07 | Los turnos son recurrentes semanales (un mismo turno se repite todas las semanas mientras esté `activo`), no clases de fecha puntual. Por eso no existe un campo `fecha` en `turnos`. | Turnos | `ESQUEMA_NOSQL.md` |
| RN-08 | Un turno no puede tener más clientes asignados que su `capacidad`. | Turnos | `MODULOS.md` |
| RN-09 | El campo `pagos.monto` utiliza BSON Decimal128, conforme al modelo de Atlas confirmado por el equipo. Las conversiones, operaciones y presentación deben preservar la precisión monetaria. | Pagos | `ESQUEMA_NOSQL.md` |
| RN-10 | Todo pago registra `usuarioRegistroId`, el usuario con rol `ADMIN` que lo cargó, para permitir auditoría. La gestión de pagos (alta, modificación y consulta) es exclusiva del Administrador; el Entrenador no gestiona pagos. | Pagos | `ESQUEMA_NOSQL.md`, `MODULOS.md` |
| RN-11 | Una obligación impaga cambia de `PENDIENTE` a `VENCIDO` cuando supera `fechaVencimiento`. Una obligación cobrada permanece `PAGADO`. Registrar otra cuota no cancela automáticamente una deuda anterior. | Pagos | `MODULOS.md` |
| RN-12 | `usuarios.email`, `clientes.dni` y `ejercicios.codigo` son únicos a nivel de base de datos (no solo validados desde el backend). | Autenticación y Roles, Gestión de Clientes, Catálogo de Ejercicios | `ESQUEMA_NOSQL.md` (Índices únicos) |
| RN-13 | Las "alertas de vencimiento próximo" del módulo de Pagos son indicadores visibles en el Dashboard del administrador, no notificaciones automáticas (email/push) al cliente — esas quedan fuera del alcance del MVP. | Pagos, Dashboard y Reportes | `README.md`, `MODULOS.md` |
| RN-14 | El Administrador y el Entrenador pueden asignar clientes activos a un turno activo que tenga cupo y retirar clientes ya asignados para liberar lugar. El sistema no permite crear, editar ni reactivar un turno cuyo horario se superponga con otro turno activo del mismo entrenador, ni asignar a un cliente a dos turnos superpuestos el mismo día. El Administrador puede, además, generar turnos en lote a partir de franjas horarias de apertura y los días de trabajo de cada entrenador (ver RN-17), y dar de baja o eliminar varios turnos a la vez mediante una selección múltiple. | Turnos | `MODULOS.md`, `CASOS_DE_USO.md`, `ESQUEMA_NOSQL.md` |
| RN-15 | El Administrador puede dar de alta o actualizar ejercicios de forma individual o mediante la importación masiva de un archivo Excel; en ambos casos se valida la unicidad de `codigo` antes de persistir. | Catálogo de Ejercicios | `MODULOS.md`, `CASOS_DE_USO.md` |
| RN-16 | Un Entrenador solo puede crear, modificar, dar de baja o asignar/retirar clientes en los turnos donde él mismo es el entrenador responsable (`turnos.entrenadorId`); no puede operar sobre turnos de otro entrenador. El Administrador no tiene esta restricción. | Turnos | `MODULOS.md`, `ESQUEMA_NOSQL.md` |
| RN-17 | Las franjas horarias de apertura y el cupo por defecto de los turnos son configuración global, exclusiva del Administrador. Un Entrenador puede definir sus propios días de trabajo dentro de esas franjas, pero no puede modificar el horario de apertura general ni el cupo por defecto. | Turnos | `MODULOS.md` |
| RN-18 | Al dar de baja a un cliente, se lo retira automáticamente de todos los turnos en los que estaba anotado, liberando esos cupos, y se registra el movimiento en el historial del turno (`turnos.historialClientes`) para no perder el rastro de la baja. | Clientes, Turnos | `ESQUEMA_NOSQL.md` |
| RN-19 | Todo turno dura exactamente una hora (`horaFin` es siempre `horaInicio + 1h`), tanto si se crea individualmente como si se genera en bloque con "Generar agenda". | Turnos | `MODULOS.md` |

## Reglas complementarias de cuentas y sesiones

| ID | Regla | Módulo / Colección afectada | Fuente |
|---|---|---|---|
| RN-20 | `usuarios.rol` es un arreglo no vacío y sin repetidos de `ADMIN`, `ENTRENADOR` y/o `USUARIO`. Si incluye `ADMIN` conserva el alcance administrativo. | Cuentas y permisos | `ESQUEMA_NOSQL.md` |
| RN-21 | El registro público crea cuenta y sesión con `['USUARIO']`, sin crear una ficha ni una inscripción al gimnasio. | Autenticación, Clientes | `CASOS_DE_USO.md` |
| RN-22 | Una cuenta inactiva o una sesión vencida no autoriza operaciones. La sesión dura ocho horas y el backend comprueba su vencimiento independientemente de la limpieza TTL. | Usuarios, Sesiones | `SEGURIDAD.md` |
| RN-23 | Cambiar la contraseña exige la actual, renueva la sesión del navegador que realiza el cambio y elimina las anteriores. | Cuenta propia, Sesiones | `SEGURIDAD.md` |
| RN-24 | La historia clínica es texto opcional y registra la fecha y el usuario de su última modificación. | Historia Clínica | `ESQUEMA_NOSQL.md` |

## Aplicación de las reglas

El estado activo de un cliente depende de `clientes.activo`. Las obligaciones de pago se registran manualmente y conservan su historial; registrar una cuota nueva no cancela una deuda anterior.

La capacidad de un turno es un entero positivo configurable. La versión admite cupos de hasta 100. Los índices, las validaciones y las operaciones de la aplicación participan en la aplicación de estas reglas. Las limitaciones de la versión se describen en el [README principal](../README.md#6-limitaciones-del-mvp).
