# Matriz de trazabilidad — Gym Manager

## 1. Objetivo

La matriz de trazabilidad relaciona los casos de uso, las reglas de negocio, los módulos del sistema y las verificaciones previstas para el MVP de Gym Manager.

Se utiliza para comprobar que las funcionalidades documentadas tengan una regla o necesidad asociada y que puedan verificarse mediante pruebas durante la futura implementación.

Esta matriz mantiene como referencia la documentación vigente del proyecto, especialmente `CASOS_DE_USO.md`, `REGLAS_DE_NEGOCIO.md`, `MODULOS.md`, `SEGURIDAD.md` y `ARQUITECTURA.md`.

**Nota:** las verificaciones indicadas son propuestas de prueba. No implican que el sistema ya esté implementado ni que las pruebas hayan sido ejecutadas.

## 2. Matriz de trazabilidad funcional

| ID | Requisito funcional | Caso de uso relacionado | Regla de negocio relacionada | Módulo | Verificación prevista |
|---|---|---|---|---|---|
| RF-01 | Permitir el inicio de sesión mediante credenciales y reconocer el rol del usuario autenticado. | CU-01 | RN-06, RN-12 | Autenticación y roles | VER-01: comprobar que las credenciales válidas permitan acceder y que las inválidas sean rechazadas. |
| RF-02 | Permitir solicitar la recuperación de contraseña mediante un mecanismo de un solo uso y con vencimiento. | CU-02 | Reglas de seguridad de `SEGURIDAD.md` | Autenticación y roles | VER-02: comprobar que un token vencido o utilizado no permita completar la recuperación. |
| RF-03 | Permitir cambiar la contraseña verificando la contraseña actual. | CU-03 | Reglas de seguridad de `SEGURIDAD.md` | Autenticación y roles | VER-03: comprobar que una contraseña actual incorrecta impida el cambio. |
| RF-04 | Registrar clientes y evitar la duplicación de DNI. | CU-04 | RN-01, RN-02, RN-12 | Clientes | VER-04: registrar un DNI nuevo y comprobar que un DNI duplicado sea rechazado. |
| RF-05 | Dar de baja lógica a un cliente sin eliminar físicamente su registro. | CU-05 | RN-01 | Clientes | VER-05: comprobar que el cliente quede inactivo y que el registro permanezca almacenado. |
| RF-06 | Registrar ejercicios utilizando un código único. | CU-06 | RN-01, RN-12 | Ejercicios | VER-06: comprobar que se acepte un código nuevo y se rechace uno duplicado. |
| RF-07 | Asignar rutinas respetando la existencia de una sola rutina activa por cliente y el límite de historial establecido. | CU-07 | RN-03, RN-04 | Rutinas | VER-07: comprobar que la rutina anterior quede inactiva, la nueva quede activa y, cuando corresponda, se elimine la rutina inactiva más antigua. |
| RF-08 | Permitir que los clientes con cuenta consulten su rutina vigente. Los clientes sin cuenta son atendidos por el personal del gimnasio según el alcance documentado. | CU-08 | RN-03, RN-06 | Rutinas | VER-08: comprobar que el cliente consulte su propia rutina y no pueda acceder a la de otro cliente. |
| RF-09 | Registrar y consultar la historia clínica básica respetando los permisos por rol y la titularidad del cliente. | CU-09, CU-10 | RN-05, RN-06 | Historia clínica | VER-09: comprobar los permisos de administración y entrenamiento, así como la restricción de acceso del cliente a su propia historia. |
| RF-10 | Crear turnos de recurrencia semanal. | CU-11 | RN-07 | Turnos | VER-10: comprobar que el turno se defina por día de la semana y horarios, sin tratarlo como una cita de fecha única. |
| RF-11 | Asignar clientes a turnos sin superar la capacidad configurada. | CU-12 | RN-08 | Turnos | VER-11: comprobar que se permita una asignación dentro de la capacidad y se rechace una que la supere. |
| RF-12 | Registrar pagos conservando el usuario que realizó el registro. | CU-13 | RN-09, RN-10 | Pagos | VER-12: comprobar la persistencia del importe y del identificador del usuario registrante. |
| RF-13 | Reflejar los pagos vencidos según su fecha de vencimiento y permitir consultar los vencimientos. | CU-14 | RN-11, RN-13 | Pagos | VER-13: comprobar que un pago impago vencido se identifique como vencido y que los próximos vencimientos se presenten como indicadores internos. |
| RF-14 | Mostrar indicadores generales de la actividad del gimnasio. | CU-15 | RN-11, RN-13 y reglas de los módulos correspondientes | Dashboard y reportes | VER-14: comprobar la visualización de clientes activos, cuotas vencidas y próximas, ocupación de turnos e ingresos mensuales. |

## 3. Matriz de trazabilidad no funcional y de seguridad

| ID | Requisito o restricción | Documento de referencia | Elementos afectados | Verificación prevista |
|---|---|---|---|---|
| RNF-01 | Las operaciones protegidas deben requerir autenticación y aplicar los permisos correspondientes al rol. | `SEGURIDAD.md`, `ARQUITECTURA.md` | API y módulos protegidos | VER-15: comprobar que una petición no autenticada sea rechazada y que un rol sin permisos no pueda ejecutar la operación. |
| RNF-02 | El acceso del cliente a sus recursos debe verificar la titularidad, además del rol. | `SEGURIDAD.md`, RN-06 | Rutinas e historia clínica | VER-16: comprobar que un cliente no pueda acceder a los datos de otro modificando el identificador enviado en la petición. |
| RNF-03 | La historia clínica debe tratarse como información sensible y contar con acceso restringido. | `SEGURIDAD.md`, RN-05, RN-06 | Historia clínica | VER-17: comprobar los permisos por rol y titularidad en las operaciones relacionadas con la historia clínica. |
| RNF-04 | Las contraseñas no deben almacenarse en texto plano. El diseño contempla un mecanismo seguro de hash y restricciones para los tokens de recuperación. | `SEGURIDAD.md` | Autenticación y roles | VER-18: comprobar que no se almacene la contraseña original y que los tokens respeten las restricciones documentadas. |
| RNF-05 | La comunicación entre el frontend y el backend debe protegerse mediante HTTPS en el entorno desplegado. | `ARQUITECTURA.md`, `SEGURIDAD.md` | Frontend y API REST | VER-19: comprobar que los servicios publicados utilicen HTTPS. |
| RNF-06 | La arquitectura debe mantener la separación entre interfaz, lógica de negocio y persistencia. | `ARQUITECTURA.md` | Todo el sistema | VER-20: comprobar que el frontend consuma la API REST y que el acceso a MongoDB se realice desde el backend. |

## 4. Reglas transversales del sistema

Las siguientes reglas deben conservarse en los casos de uso, diagramas e implementación:

- **Baja lógica:** usuarios, clientes y ejercicios se desactivan sin eliminar físicamente sus registros mediante una baja ordinaria (RN-01).
- **Relación entre usuario y cliente:** la asociación es opcional y uno a uno cuando existe, respetando los índices únicos definidos (RN-02).
- **Rutinas:** cada cliente puede tener una sola rutina activa y un historial de hasta 12 rutinas (RN-03 y RN-04).
- **Límite del historial:** cuando se supera el máximo, se elimina la rutina inactiva más antigua. La rutina activa no debe eliminarse mediante esta regla (RN-04).
- **Historia clínica:** es opcional y el acceso debe respetar los permisos establecidos (RN-05 y RN-06).
- **Turnos:** son recurrentes semanalmente y las asignaciones no pueden superar su capacidad (RN-07 y RN-08).
- **Pagos:** deben conservar el importe con precisión decimal adecuada y el identificador del usuario que los registró (RN-09 y RN-10).
- **Vencimientos:** el estado debe actualizarse según las reglas de vencimiento documentadas (RN-11).
- **Notificaciones:** los próximos vencimientos se muestran como indicadores en el sistema. No se incorporan notificaciones externas por correo electrónico, SMS o push al alcance del MVP (RN-13).

## 5. Mantenimiento de la trazabilidad

Cuando se modifique un caso de uso o una regla de negocio, se deberá revisar la fila correspondiente de esta matriz y las verificaciones asociadas.

También se deberán revisar los diagramas que representen el comportamiento modificado y los documentos de arquitectura, seguridad o módulos que resulten afectados.

Los identificadores RF y RNF se utilizan en esta matriz para facilitar la lectura y la trazabilidad. Si el equipo incorpora una nomenclatura formal diferente en la documentación principal, deberán unificarse los identificadores para evitar duplicaciones.