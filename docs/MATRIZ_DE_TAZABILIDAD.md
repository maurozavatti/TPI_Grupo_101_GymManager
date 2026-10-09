# Matriz de Trazabilidad — Gym Manager

## 1. Objetivo

La matriz de trazabilidad relaciona los requisitos funcionales y no funcionales del sistema Gym Manager con los casos de uso, las reglas de negocio y las verificaciones previstas.

Su objetivo es comprobar que las funcionalidades definidas para el proyecto estén contempladas en el diseño y que puedan verificarse durante las pruebas.

## 2. Trazabilidad de requisitos funcionales

| ID | Requisito funcional | Casos de uso relacionados | Reglas de negocio relacionadas | Verificación prevista |
|---|---|---|---|---|
| RF-01 | El sistema debe permitir iniciar sesión mediante credenciales válidas y reconocer el rol del usuario. | CU-01 | RN-01, RN-12 | CP-01 |
| RF-02 | El sistema debe permitir recuperar y cambiar contraseñas de manera segura. | CU-02, CU-03 | RN-01 | CP-02 |
| RF-03 | El administrador debe poder dar de alta y dar de baja clientes, conservando sus registros históricos. | CU-04, CU-05 | RN-01, RN-02, RN-12 | CP-03 |
| RF-04 | El administrador debe poder gestionar el catálogo de ejercicios, respetando la unicidad del código. | CU-06 | RN-01, RN-12 | CP-04 |
| RF-05 | El entrenador debe poder asignar rutinas a los clientes, respetando las restricciones de vigencia y conservación del historial. | CU-07 | RN-03, RN-04 | CP-05 |
| RF-06 | El sistema debe permitir consultar la rutina vigente de un cliente según su modalidad de acceso. | CU-08 | RN-03, RN-04 | CP-06 |
| RF-07 | El sistema debe permitir cargar o actualizar la historia clínica de un cliente con los permisos correspondientes. | CU-09 | RN-05, RN-06 | CP-07 |
| RF-08 | El sistema debe permitir consultar la historia clínica únicamente a usuarios autorizados. | CU-10 | RN-05, RN-06 | CP-08 |
| RF-09 | El administrador o entrenador debe poder crear turnos semanales recurrentes. | CU-11 | RN-07 | CP-09 |
| RF-10 | El sistema debe permitir asignar clientes a turnos activos sin superar su capacidad. | CU-12 | RN-07, RN-08 | CP-10 |
| RF-11 | El administrador debe poder registrar pagos de inscripción y cuotas, incluyendo el monto y las fechas correspondientes. | CU-13 | RN-09, RN-10 | CP-11 |
| RF-12 | El sistema debe detectar cuotas vencidas y actualizar su estado según las condiciones definidas. | CU-14 | RN-11 | CP-12 |
| RF-13 | El sistema debe mostrar un dashboard con indicadores de clientes, pagos, vencimientos y ocupación de turnos. | CU-15 | RN-11, RN-13 | CP-13 |
| RF-14 | El sistema debe mantener la relación opcional entre las cuentas de usuario y los registros de clientes, evitando asociaciones duplicadas. | CU-04, CU-09 | RN-02 | CP-14 |

## 3. Trazabilidad de requisitos no funcionales

| ID | Requisito no funcional | Relación con el diseño | Verificación prevista |
|---|---|---|---|
| RNF-01 | Seguridad de autenticación y autorización. | CU-01, CU-02, CU-03, CU-09, CU-10; documento `SEGURIDAD.md`. | CP-15 |
| RNF-02 | Protección de contraseñas mediante almacenamiento de hashes, nunca en texto plano. | CU-01, CU-02, CU-03; documento `SEGURIDAD.md`. | CP-16 |
| RNF-03 | Protección de los datos sensibles de la historia clínica mediante controles de acceso. | CU-09, CU-10; reglas RN-05 y RN-06. | CP-17 |
| RNF-04 | Separación de responsabilidades entre frontend, backend y persistencia. | Arquitectura documentada en `ARQUITECTURA.md`. | CP-18 |
| RNF-05 | Integridad de los datos mediante validaciones y restricciones de unicidad. | RN-02, RN-08, RN-12; documentos `ESQUEMA_NOSQL.md` y `SEGURIDAD.md`. | CP-19 |
| RNF-06 | Comunicación entre frontend y backend mediante una API REST sobre HTTPS en el entorno desplegado. | Documento `ARQUITECTURA.md` y diagrama de despliegue. | CP-20 |

## 4. Relación con las reglas de negocio

- **RN-01:** baja lógica de usuarios, clientes y ejercicios.
- **RN-02:** relación opcional uno a uno entre usuario y cliente.
- **RN-03:** un solo registro de rutina vigente por cliente.
- **RN-04:** máximo de 12 rutinas conservadas; al agregar una nueva cuando se alcanzó el límite, se elimina físicamente la rutina inactiva más antigua.
- **RN-05:** la historia clínica es opcional.
- **RN-06:** restricciones de acceso a la historia clínica según el rol y la titularidad del registro.
- **RN-07:** los turnos se organizan mediante una recurrencia semanal.
- **RN-08:** no se permite superar la capacidad de un turno.
- **RN-09:** el monto de los pagos se almacena utilizando Decimal128.
- **RN-10:** se registra el identificador del usuario responsable de registrar el pago.
- **RN-11:** una cuota pasa a estado VENCIDO cuando supera su fecha de vencimiento y no se registra un nuevo pago que corresponda a esa obligación.
- **RN-12:** unicidad de los correos electrónicos, DNI y códigos de ejercicios.
- **RN-13:** el dashboard puede mostrar indicadores de próximos vencimientos; no se incluyen notificaciones externas por correo electrónico ni notificaciones push en el MVP.

## 5. Casos de prueba previstos

| ID | Comprobación |
|---|---|
| CP-01 | Rechazar credenciales inválidas y permitir el acceso con credenciales válidas. |
| CP-02 | Validar el cambio de contraseña y rechazar tokens de recuperación vencidos o utilizados. |
| CP-03 | Impedir DNI duplicados y comprobar que la baja lógica conserve el registro histórico. |
| CP-04 | Rechazar códigos de ejercicio duplicados. |
| CP-05 | Verificar que no haya más de una rutina activa y que se respete el límite de 12 rutinas. |
| CP-06 | Mostrar la rutina vigente y respetar las modalidades de consulta definidas. |
| CP-07 | Permitir la carga o actualización de la historia clínica únicamente a actores autorizados. |
| CP-08 | Denegar el acceso a la historia clínica de otro cliente no autorizado. |
| CP-09 | Crear turnos con día, horarios, capacidad y entrenador. |
| CP-10 | Rechazar una asignación cuando el turno alcanzó su capacidad. |
| CP-11 | Registrar pagos con monto, fechas, tipo y usuario responsable. |
| CP-12 | Actualizar el estado de una cuota vencida y comprobar que una obligación pagada no se marque como vencida. |
| CP-13 | Mostrar los indicadores del dashboard a partir de los datos registrados. |
| CP-14 | Impedir que un usuario o cliente quede asociado a más de un registro de la entidad opuesta. |
| CP-15 | Comprobar autenticación, roles y permisos de los endpoints. |
| CP-16 | Comprobar que las contraseñas no se almacenen en texto plano. |
| CP-17 | Comprobar que un cliente no pueda acceder a la historia clínica de otro cliente. |
| CP-18 | Verificar que la comunicación y las responsabilidades respeten la arquitectura documentada. |
| CP-19 | Comprobar las validaciones de datos y las restricciones de unicidad. |
| CP-20 | Verificar la comunicación HTTPS entre frontend y backend en el entorno desplegado. |

## 6. Observaciones

1. La matriz establece relaciones de trazabilidad entre requisitos, casos de uso, reglas de negocio y pruebas previstas.
2. Los casos de prueba son verificaciones planificadas; su inclusión en este documento no implica que ya se hayan ejecutado.
3. La detección de cuotas vencidas de CU-14 y los indicadores de próximos vencimientos de CU-15 son funcionalidades diferentes. La primera actualiza estados de pagos según RN-11; la segunda presenta información en el dashboard según RN-13.
4. La implementación concreta de la autenticación, el almacenamiento y el despliegue deberá ajustarse a los documentos de arquitectura y seguridad del proyecto.
