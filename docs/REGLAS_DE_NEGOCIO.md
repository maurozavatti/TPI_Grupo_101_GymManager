# Catálogo de Reglas de Negocio — Gym Manager

## Descripción

Este documento reúne en un solo lugar las reglas de negocio del sistema que hoy están distribuidas entre `ESQUEMA_NOSQL.md`, `MODULOS.md` y `DIAGRAMA_UML.md`, para facilitar su consulta y trazabilidad.

---

| ID | Regla | Módulo / Colección afectada | Fuente |
|---|---|---|---|
| RN-01 | Toda baja de `usuarios`, `clientes` o `ejercicios` es lógica: se marca `activo: false` y se completa `fechaBaja`, sin eliminar el documento ni su historial asociado. | Autenticación y Roles, Gestión de Clientes, Catálogo de Ejercicios | `ESQUEMA_NOSQL.md` |
| RN-02 | Un cliente puede tener una cuenta de usuario asociada o no (`usuarioId` es opcional). Si la tiene, la relación `usuarios.clienteId` ↔ `clientes.usuarioId` es estrictamente uno a uno, garantizada por índices únicos y `sparse`. | Autenticación y Roles, Gestión de Clientes | `ESQUEMA_NOSQL.md` (Índices únicos) |
| RN-03 | En el arreglo `rutinas[]` de un cliente, solo un elemento puede tener `activo: true` a la vez (la rutina vigente). Al asignar una rutina nueva, la anterior pasa a `activo: false`. | Rutinas | `ESQUEMA_NOSQL.md`, `DIAGRAMA_UML.md` |
| RN-04 | El historial de `rutinas[]` por cliente está limitado a 12 elementos. Al superar el límite, se elimina físicamente la rutina inactiva más antigua (nunca la vigente). | Rutinas | `ESQUEMA_NOSQL.md`, `DIAGRAMA_UML.md` |
| RN-05 | La historia clínica (`clientes.historiaClinica`) es un campo opcional (cardinalidad `0..1`): no se exige al registrarse, se carga cuando corresponde. | Historia Clínica | `ESQUEMA_NOSQL.md`, `DIAGRAMA_UML.md` |
| RN-06 | Solo el propio Cliente (si tiene cuenta), el Administrador o el Entrenador pueden crear/modificar la historia clínica de un cliente. El Administrador y el Entrenador pueden hacerlo incluso si el cliente no tiene cuenta. El resto de los clientes no tiene acceso. | Historia Clínica | `MODULOS.md` |
| RN-07 | Los turnos son recurrentes semanales (un mismo turno se repite todas las semanas mientras esté `activo`), no clases de fecha puntual. Por eso no existe un campo `fecha` en `turnos`. | Turnos | `ESQUEMA_NOSQL.md` |
| RN-08 | Un turno no puede tener más clientes asignados que su `capacidad`. | Turnos | `MODULOS.md` |
| RN-09 | El campo `monto` de `pagos` se almacena como `Decimal128` (no `Number`) para evitar errores de precisión en operaciones con dinero. | Pagos | `ESQUEMA_NOSQL.md` |
| RN-10 | Todo pago registra `usuarioRegistroId`, el usuario (`ADMIN` o `ENTRENADOR`) que lo cargó, para permitir auditoría. | Pagos | `ESQUEMA_NOSQL.md` |
| RN-11 | Un pago cambia su `estado` a `VENCIDO` automáticamente cuando se supera `fechaVencimiento` sin que se haya registrado un nuevo pago. | Pagos | `MODULOS.md` |
| RN-12 | `usuarios.email`, `clientes.dni` y `ejercicios.codigo` son únicos a nivel de base de datos (no solo validados desde el backend). | Autenticación y Roles, Gestión de Clientes, Catálogo de Ejercicios | `ESQUEMA_NOSQL.md` (Índices únicos) |
| RN-13 | Las "alertas de vencimiento próximo" del módulo de Pagos son indicadores visibles en el Dashboard del administrador, no notificaciones automáticas (email/push) al cliente — esas quedan fuera del alcance del MVP. | Pagos, Dashboard y Reportes | `README.md`, `MODULOS.md` |