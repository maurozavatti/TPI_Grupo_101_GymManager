# Historias de Usuario — Gym Manager

## Descripción

Historias de usuario correspondientes a los casos de uso definidos en `CASOS_DE_USO.md`, en formato "Como [actor], quiero [acción], para [beneficio]", con sus criterios de aceptación.

---

## Autenticación y Roles

### HU-01: Iniciar sesión

**Como** Administrador, Entrenador o Cliente con cuenta, **quiero** iniciar sesión con mi email y contraseña, **para** acceder a las funcionalidades correspondientes a mi rol.

**Criterios de aceptación:**
- Si las credenciales son correctas y la cuenta está activa, el sistema me da acceso.
- Si las credenciales son incorrectas, el sistema muestra un error sin indicar cuál de los dos datos falló.
- Si mi cuenta está dada de baja, el sistema rechaza el inicio de sesión.

*(Relacionada con CU-01)*

### HU-02: Recuperar contraseña

**Como** usuario que olvidó su contraseña, **quiero** solicitar un enlace de recuperación por email, **para** poder volver a acceder a mi cuenta.

**Criterios de aceptación:**
- Recibo un enlace de un solo uso, con tiempo de expiración.
- Si el enlace expiró o ya fue usado, el sistema no permite cambiar la contraseña con él.
- Al completar el cambio, puedo iniciar sesión con la nueva contraseña.

*(Relacionada con CU-02)*

### HU-03: Cambiar contraseña

**Como** usuario autenticado, **quiero** cambiar mi contraseña ingresando la actual y la nueva, **para** mantener mi cuenta segura.

**Criterios de aceptación:**
- El sistema valida la contraseña actual antes de aceptar la nueva.
- Si la contraseña actual es incorrecta, rechaza el cambio.

*(Relacionada con CU-03)*

---

## Gestión de Clientes

### HU-04: Dar de alta un cliente

**Como** Administrador, **quiero** registrar un cliente con sus datos identificatorios, **para** poder asignarle rutinas, turnos y pagos, tenga o no cuenta de usuario.

**Criterios de aceptación:**
- No puedo registrar dos clientes con el mismo DNI.
- El cliente queda creado con `activo: true`, con o sin cuenta asociada.

*(Relacionada con CU-04)*

### HU-05: Dar de baja un cliente

**Como** Administrador, **quiero** dar de baja a un cliente que deja el gimnasio, **para** dejar de contarlo como activo sin perder su historial.

**Criterios de aceptación:**
- El cliente pasa a `activo: false` con `fechaBaja` registrada.
- Sus rutinas, pagos e historia clínica anteriores siguen disponibles para consulta.

*(Relacionada con CU-05)*

---

## Catálogo de Ejercicios

### HU-06: Dar de alta un ejercicio

**Como** Administrador, **quiero** cargar un ejercicio nuevo en el catálogo con un código identificatorio, **para** que los entrenadores lo puedan usar al armar rutinas.

**Criterios de aceptación:**
- No puedo cargar dos ejercicios con el mismo código.
- El ejercicio queda disponible inmediatamente para armar rutinas.

*(Relacionada con CU-06)*

---

## Rutinas

### HU-07: Asignar una rutina a un cliente

**Como** Entrenador, **quiero** armar una rutina eligiendo ejercicios del catálogo y asignarla a un cliente, **para** que tenga un plan de entrenamiento actualizado.

**Criterios de aceptación:**
- Al asignar una rutina nueva, la anterior queda marcada como no vigente, pero no se borra (salvo que se supere el límite de 12).
- El cliente solo tiene una rutina vigente a la vez.

*(Relacionada con CU-07)*

### HU-08: Consultar mi rutina vigente

**Como** Cliente con cuenta, **quiero** ver mi rutina actual con los ejercicios asignados, **para** saber qué entrenamiento me corresponde hacer.

**Criterios de aceptación:**
- Veo únicamente la rutina marcada como vigente, con series, repeticiones y peso de cada ejercicio.

*(Relacionada con CU-08)*

---

## Historia Clínica

### HU-09: Cargar mi historia clínica

**Como** Cliente con cuenta, **quiero** cargar mis antecedentes y lesiones previas cuando yo decida hacerlo, **para** que el entrenador tenga en cuenta mi condición física al armar mi rutina.

**Criterios de aceptación:**
- No es obligatorio completarla al registrarme.
- Puedo actualizarla si sufro una lesión nueva.

*(Relacionada con CU-09)*

### HU-10: Consultar la historia clínica de un cliente

**Como** Administrador o Entrenador, **quiero** consultar (y, de ser necesario, cargar) la historia clínica de cualquier cliente, incluso sin cuenta, **para** entrenarlo de forma segura.

**Criterios de aceptación:**
- Puedo ver y cargar la historia clínica de cualquier cliente.
- No puedo ver la historia clínica si soy otro cliente (no soy el titular).

*(Relacionada con CU-09, CU-10)*

---

## Turnos

### HU-11: Crear un turno

**Como** Administrador o Entrenador, **quiero** crear un turno con día, horario y cupo máximo, **para** organizar las clases de la semana.

**Criterios de aceptación:**
- El turno queda disponible para asignar clientes.
- El día/horario representa una recurrencia semanal, no una fecha puntual.

*(Relacionada con CU-11)*

### HU-12: Asignar un cliente a un turno

**Como** Administrador o Entrenador, **quiero** anotar a un cliente en un turno, **para** que asista a esa clase.

**Criterios de aceptación:**
- No puedo asignar un cliente si el turno ya alcanzó su cupo máximo.

*(Relacionada con CU-12)*

---

## Pagos

### HU-13: Registrar un pago

**Como** Administrador, **quiero** registrar la inscripción o la cuota de un cliente, **para** llevar el control de quién está al día.

**Criterios de aceptación:**
- El pago queda asociado al cliente, con fecha de pago y de vencimiento.
- Queda registrado qué usuario cargó el pago (auditoría).

*(Relacionada con CU-13)*

### HU-14: Ver clientes con cuotas vencidas

**Como** Administrador, **quiero** ver un listado de clientes con cuotas vencidas, **para** poder contactarlos y regularizar la situación.

**Criterios de aceptación:**
- El sistema marca automáticamente como `VENCIDO` el pago cuya fecha de vencimiento ya pasó sin un pago nuevo.

*(Relacionada con CU-14)*

---

## Dashboard y Reportes

### HU-15: Consultar el estado general del gimnasio

**Como** Administrador, **quiero** ver un panel con clientes activos, cuotas vencidas, ocupación de turnos e ingresos del mes, **para** tener una visión general sin revisar cliente por cliente.

**Criterios de aceptación:**
- Los datos del dashboard se calculan en base a la información ya cargada (no requiere carga manual adicional).

*(Relacionada con CU-15)*