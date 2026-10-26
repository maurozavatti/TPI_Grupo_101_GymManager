# Casos de Uso — Gym Manager

## Descripción

Este documento detalla los casos de uso principales del sistema, organizados por módulo (ver `MODULOS.md`). Cada caso de uso describe el actor que lo inicia, la condición necesaria para ejecutarlo, el flujo principal, los flujos alternativos o de excepción, y el resultado esperado.

---

## Módulo 1 — Autenticación y Roles

### CU-01: Iniciar sesión

- **Actor:** Administrador, Entrenador, Cliente con cuenta.
- **Precondición:** El usuario posee una cuenta activa (`activo: true`).
- **Flujo principal:**
  1. El usuario ingresa email y contraseña.
  2. El sistema valida las credenciales contra `usuarios.passwordHash`.
  3. El sistema genera un token de sesión (JWT) con el rol del usuario.
  4. El usuario accede a las funcionalidades correspondientes a su rol.
- **Flujo alternativo:** Si las credenciales son incorrectas, el sistema muestra un error y no genera el token.
- **Flujo alternativo:** Si la cuenta está dada de baja (`activo: false`), el sistema rechaza el inicio de sesión.
- **Postcondición:** El usuario queda autenticado y el sistema conoce su rol para autorizar las siguientes acciones.

### CU-02: Recuperar contraseña

- **Actor:** Administrador, Entrenador, Cliente con cuenta.
- **Precondición:** El usuario tiene una cuenta registrada con email válido.
- **Flujo principal:**
  1. El usuario solicita recuperar su contraseña ingresando su email.
  2. El sistema genera un enlace de recuperación con un token de un solo uso y lo envía por correo.
  3. El usuario abre el enlace e ingresa una nueva contraseña.
  4. El sistema actualiza `passwordHash` y `fechaModificacion`.
- **Flujo alternativo:** Si el token expiró o ya fue usado, el sistema rechaza el cambio y pide solicitar uno nuevo.
- **Postcondición:** La contraseña queda actualizada y el usuario puede iniciar sesión con la nueva.

### CU-03: Cambiar contraseña

- **Actor:** Administrador, Entrenador, Cliente con cuenta.
- **Precondición:** El usuario está autenticado.
- **Flujo principal:**
  1. El usuario ingresa su contraseña actual y la nueva.
  2. El sistema valida la contraseña actual contra `passwordHash`.
  3. El sistema actualiza `passwordHash` y `fechaModificacion`.
- **Flujo alternativo:** Si la contraseña actual no coincide, el sistema rechaza el cambio.
- **Postcondición:** La contraseña queda actualizada.

---

## Módulo 2 — Gestión de Clientes

### CU-04: Dar de alta un cliente

- **Actor:** Administrador.
- **Precondición:** El administrador está autenticado.
- **Flujo principal:**
  1. El administrador carga los datos identificatorios del cliente (nombre, apellido, DNI, contacto).
  2. El sistema valida que el DNI no esté ya registrado (índice único `clientes.dni`).
  3. El sistema crea el documento en `clientes` con `activo: true` y `fechaCreacion`.
- **Flujo alternativo:** Si el DNI ya existe, el sistema rechaza el alta.
- **Postcondición:** El cliente queda registrado, con o sin cuenta de usuario asociada.

### CU-05: Dar de baja un cliente

- **Actor:** Administrador.
- **Precondición:** El cliente existe y está activo.
- **Flujo principal:**
  1. El administrador selecciona el cliente y confirma la baja.
  2. El sistema marca `activo: false` y completa `fechaBaja`, sin eliminar el documento.
- **Postcondición:** El cliente queda inhabilitado pero su historial (rutinas, pagos, turnos) se conserva.

### CU-16: Modificar un cliente

- **Actor:** Administrador.
- **Precondición:** El cliente existe.
- **Flujo principal:**
  1. El administrador selecciona el cliente y edita sus datos identificatorios y de contacto.
  2. Si se modifica el DNI, el sistema valida que no pertenezca a otro cliente activo.
  3. El sistema actualiza el documento y su `fechaModificacion`.
- **Flujo alternativo:** Si el nuevo DNI ya pertenece a otro cliente, el sistema rechaza la modificación.
- **Postcondición:** Los datos del cliente quedan actualizados.

### CU-20: Consultar el listado de clientes

- **Actor:** Administrador, Entrenador.
- **Precondición:** El actor está autenticado.
- **Flujo principal:**
  1. El actor solicita el listado de clientes.
  2. El sistema muestra los clientes activos, con la posibilidad de buscar o filtrar por nombre, apellido o DNI.
  3. El actor selecciona un cliente para ver su detalle completo.
- **Postcondición:** El actor visualiza el listado y puede acceder al detalle de cada cliente.

---

## Módulo 3 — Catálogo de Ejercicios

### CU-06: Dar de alta un ejercicio

- **Actor:** Administrador.
- **Precondición:** El administrador está autenticado.
- **Flujo principal:**
  1. El administrador carga nombre, descripción, grupo muscular y un `codigo` identificatorio.
  2. El sistema valida que el `codigo` no esté repetido (índice único `ejercicios.codigo`).
  3. El sistema crea el documento en `ejercicios`.
- **Flujo alternativo:** Si el `codigo` ya existe, el sistema rechaza el alta.
- **Postcondición:** El ejercicio queda disponible para que los entrenadores lo usen en rutinas.

### CU-17: Modificar un ejercicio

- **Actor:** Administrador.
- **Precondición:** El ejercicio existe.
- **Flujo principal:**
  1. El administrador selecciona el ejercicio y edita nombre, descripción, grupo muscular o `codigo`.
  2. Si se modifica el `codigo`, el sistema valida que no esté repetido.
  3. El sistema actualiza el documento en `ejercicios`.
- **Flujo alternativo (carga masiva):** El administrador puede importar un archivo Excel con varios ejercicios, respetando una plantilla con las columnas `código`, `nombre`, `grupo muscular` y `descripción` (en ese orden, una fila por ejercicio). El sistema valida cada fila (columnas obligatorias `código` y `nombre`, `código` único) y crea o actualiza los ejercicios correspondientes, informando los errores encontrados fila por fila.
- **Postcondición:** El catálogo queda actualizado.

### CU-18: Dar de baja un ejercicio

- **Actor:** Administrador.
- **Precondición:** El ejercicio existe y está activo.
- **Flujo principal:**
  1. El administrador selecciona el ejercicio y confirma la baja.
  2. El sistema marca `activo: false` y completa `fechaBaja`, sin eliminar el documento.
- **Postcondición:** El ejercicio deja de estar disponible para nuevas rutinas; las rutinas existentes que ya lo incluían conservan la referencia.

### CU-21: Consultar el catálogo de ejercicios

- **Actor:** Administrador, Entrenador.
- **Precondición:** El actor está autenticado.
- **Flujo principal:**
  1. El actor solicita el catálogo de ejercicios.
  2. El sistema muestra los ejercicios activos, con la posibilidad de buscar o filtrar por nombre o grupo muscular.
- **Postcondición:** El actor visualiza el catálogo disponible para armar rutinas.

---

## Módulo 4 — Rutinas

### CU-07: Asignar una rutina a un cliente

- **Actor:** Entrenador.
- **Precondición:** El cliente existe y está activo; el catálogo de ejercicios tiene al menos un ejercicio cargado.
- **Flujo principal:**
  1. El entrenador selecciona un cliente y arma la rutina eligiendo ejercicios del catálogo (series, repeticiones, peso, orden).
  2. El sistema marca `activo: false` en la rutina anteriormente vigente del cliente (si existía) y completa su `fechaBaja`.
  3. El sistema agrega la rutina nueva al arreglo `rutinas[]` con `activo: true`.
  4. Si el arreglo ya tiene 12 rutinas, el sistema elimina físicamente la inactiva más antigua antes de agregar la nueva.
- **Postcondición:** El cliente tiene una única rutina vigente, y el historial no supera las 12 rutinas.

### CU-08: Consultar la rutina vigente

- **Actor:** Cliente con cuenta.
- **Precondición:** El cliente está autenticado y tiene al menos una rutina asignada.
- **Flujo principal:**
  1. El cliente accede a su perfil.
  2. El sistema muestra la rutina con `activo: true` y sus ejercicios asociados.
- **Flujo alternativo:** Para clientes sin cuenta, el administrador/entrenador imprime la rutina en papel.
- **Postcondición:** El cliente conoce su rutina actual.

---

## Módulo 5 — Historia Clínica

### CU-09: Cargar historia clínica

- **Actor:** Cliente con cuenta, Administrador, Entrenador.
- **Precondición:** El cliente existe (con o sin cuenta).
- **Flujo principal:**
  1. El actor carga antecedentes y lesiones previas del cliente.
  2. El sistema guarda la información en `clientes.historiaClinica` con `fechaActualizacion`.
- **Regla aplicada:** Un cliente con cuenta solo puede cargar su propia historia clínica; el administrador y el entrenador pueden cargarla en nombre de cualquier cliente, incluso sin cuenta.
- **Postcondición:** La historia clínica queda registrada (es un campo opcional, `0..1`).

### CU-10: Consultar historia clínica

- **Actor:** Cliente con cuenta (la propia), Administrador, Entrenador.
- **Precondición:** El cliente tiene historia clínica cargada.
- **Flujo principal:**
  1. El actor solicita ver la historia clínica del cliente.
  2. El sistema verifica el rol: si es Administrador, Entrenador, o el propio Cliente, muestra la información.
- **Flujo alternativo:** Si el solicitante es otro cliente (no el titular), el sistema deniega el acceso.
- **Postcondición:** El actor autorizado visualiza antecedentes, lesiones y observaciones.

---

## Módulo 6 — Turnos

### CU-11: Crear un turno

- **Actor:** Administrador, Entrenador.
- **Precondición:** El actor está autenticado.
- **Flujo principal:**
  1. El actor define día (recurrente semanal), horario de inicio y fin, cupo máximo y entrenador responsable.
  2. El sistema crea el documento en `turnos` con `activo: true`.
- **Flujo alternativo:** Si el actor es Entrenador y el entrenador responsable no es él mismo, el sistema rechaza la operación (RN-16).
- **Postcondición:** El turno queda disponible para asignar clientes.

### CU-12: Asignar un cliente a un turno

- **Actor:** Administrador, Entrenador.
- **Precondición:** El turno existe y está activo.
- **Flujo principal:**
  1. El actor selecciona un cliente y un turno.
  2. El sistema valida que la cantidad de clientes asignados sea menor a `capacidad`.
  3. El sistema agrega el `clienteId` al arreglo `clientes[]` del turno.
- **Flujo alternativo:** Si el turno ya alcanzó el cupo máximo, el sistema rechaza la asignación.
- **Flujo alternativo:** Si el actor es Entrenador y el turno no es suyo, el sistema rechaza la operación (RN-16).
- **Postcondición:** El cliente queda anotado en el turno.

### CU-19: Retirar un cliente de un turno

- **Actor:** Administrador, Entrenador.
- **Precondición:** El cliente está asignado al turno.
- **Flujo principal:**
  1. El actor selecciona el turno y el cliente asignado, y confirma el retiro.
  2. El sistema quita el `clienteId` del arreglo `clientes[]` del turno, liberando un lugar en el cupo.
- **Flujo alternativo:** Si el actor es Entrenador y el turno no es suyo, el sistema rechaza la operación (RN-16).
- **Postcondición:** El cliente deja de estar asignado a ese turno. Su historial de pagos e historia clínica no se ve afectado.
- **Nota:** la cancelación completa de un turno, la reasignación automática de clientes a otro turno y la detección de solapamiento de horarios para un mismo entrenador no forman parte de este MVP; quedan documentadas como funcionalidad a futuro (ver `REGLAS_DE_NEGOCIO.md`).

---

## Módulo 7 — Pagos

### CU-13: Registrar un pago

- **Actor:** Administrador.
- **Precondición:** El cliente existe.
- **Flujo principal:**
  1. El administrador registra el tipo de pago (`INSCRIPCION` o `CUOTA`), el monto (`Decimal128`), la fecha de pago y la fecha de vencimiento de la próxima cuota.
  2. El sistema guarda el pago en `pagos`, incluyendo `usuarioRegistroId` con el usuario que lo cargó.
- **Postcondición:** El pago queda registrado y asociado al cliente, con auditoría de quién lo cargó.

### CU-14: Detectar cuotas vencidas

- **Actor:** Sistema (proceso automático), consultado por el Administrador.
- **Precondición:** Existen pagos con `fechaVencimiento` pasada y sin un pago nuevo registrado.
- **Flujo principal:**
  1. El sistema evalúa periódicamente los pagos cuya `fechaVencimiento` ya pasó.
  2. El sistema actualiza el campo `estado` a `VENCIDO`.
  3. El administrador consulta el listado de clientes con cuotas vencidas.
- **Postcondición:** El administrador identifica qué clientes deben regularizar su pago.

---

## Módulo 8 — Dashboard y Reportes

### CU-15: Consultar el dashboard

- **Actor:** Administrador.
- **Precondición:** El administrador está autenticado.
- **Flujo principal:**
  1. El administrador accede al dashboard.
  2. El sistema calcula y muestra: cantidad de clientes activos, cuotas vencidas y próximas a vencer, ocupación de turnos, e ingresos del mes (a partir de `pagos`).
- **Postcondición:** El administrador obtiene una vista consolidada del estado del gimnasio sin revisar cliente por cliente.