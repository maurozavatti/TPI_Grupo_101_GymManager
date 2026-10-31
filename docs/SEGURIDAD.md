# Seguridad — Gym Manager

## Descripción

Este documento detalla cómo el sistema protege el acceso a la información, con foco particular en la **historia clínica**, por tratarse de datos sensibles de salud. Complementa lo mencionado en la Sección 12 del `README.md` (stack tecnológico) y en `MODULOS.md` (permisos por módulo).

---

## 1. Autenticación

- El sistema usa **sesiones del lado del servidor**: al iniciar sesión, el backend genera un token aleatorio, guarda su hash en la colección `sesiones` (junto con el usuario y la fecha de expiración) y lo envía al navegador como una cookie `HttpOnly` (ver `README.md`, Sección 12). El navegador no puede leer ni manipular el token desde JavaScript.
- Las contraseñas nunca se almacenan en texto plano: se guarda `passwordHash`, un hash generado con la librería `bcryptjs`.
- En cada request, el backend busca el hash del token recibido en `sesiones`; si existe, no está vencido y el usuario sigue activo, identifica al usuario y su `rol` (`ADMIN`, `ENTRENADOR` o `USUARIO`) a partir de ese registro, sin necesidad de volver a enviar la contraseña.
- Las sesiones tienen un tiempo de expiración y, a diferencia de un token sin estado, se pueden invalidar explícitamente al cerrar sesión (se elimina el documento correspondiente en `sesiones`).
- Toda la comunicación entre frontend y backend se realiza sobre **HTTPS**, evitando que las credenciales, la cookie de sesión o los datos sensibles viajen sin cifrar.

---

## 2. Autorización

La autorización se aplica a nivel de **endpoint** del backend (no solo ocultando opciones en el frontend, ya que eso no evita que alguien llame directamente a la API). Cada controlador verifica, antes de ejecutar su lógica, el rol del usuario identificado a partir de su sesión activa (por ejemplo, exigiendo `ADMIN` o `ENTRENADOR` según la operación).

Para los endpoints vinculados a un cliente específico (por ejemplo, consultar su propia rutina o su propia historia clínica), además del rol se valida que el `clienteId` del recurso solicitado corresponda al `clienteId` asociado al usuario autenticado — así un Cliente no puede consultar los datos de otro cliente simplemente cambiando un identificador en la URL.

---

## 3. Acceso a la historia clínica (foco específico)

La historia clínica (`clientes.historiaClinica`) es el dato más sensible del sistema, por lo que tiene el control de acceso más estricto. La siguiente tabla resume quién puede hacer qué, y cómo se aplica técnicamente (ver también `MODULOS.md`, Módulo 5, y `docs/REGLAS_DE_NEGOCIO.md`, RN-06):

| Rol | Crear / Modificar | Consultar | Cómo se verifica |
|---|---|---|---|
| Cliente (titular) | Sí, solo la propia | Sí, solo la propia | El backend obtiene el usuario autenticado a partir de la cookie de sesión (`obtenerUsuarioSesion`) y compara el `clienteId` del recurso contra el `clienteId` asociado a esa sesión. |
| Administrador | Sí, de cualquier cliente | Sí, de cualquier cliente | El controlador del endpoint comprueba que el `rol` de la sesión sea `ADMIN` antes de ejecutar la operación. |
| Entrenador | Sí, de cualquier cliente | Sí, de cualquier cliente | El controlador del endpoint comprueba que el `rol` de la sesión sea `ENTRENADOR` (o `ADMIN`) antes de ejecutar la operación. |
| Otro cliente (no titular) | No | No | El backend rechaza la petición (403) si el `clienteId` de la sesión no coincide con el del recurso y el rol no es `ADMIN`/`ENTRENADOR`. |

**Separación de endpoints:** los campos de `historiaClinica` no se exponen en los mismos endpoints públicos que el resto del perfil del cliente (por ejemplo, el endpoint que lista clientes para armar un turno no incluye `historiaClinica` en la respuesta). Se accede a través de un endpoint específico, con su propio control de autorización, para reducir el riesgo de exposición accidental de datos sensibles.

**Minimización de datos:** siguiendo el principio de pedir solo la información necesaria (ya mencionado en el README, Sección 11), la historia clínica se limita a antecedentes, lesiones y observaciones relevantes para el entrenamiento — no se solicitan datos médicos más allá de ese propósito.

---

## 4. Trazabilidad

Las acciones sobre datos sensibles quedan trazadas mediante los campos de auditoría definidos en el esquema: `fechaCreacion`, `fechaModificacion` y, en el caso de `historiaClinica`, `fechaActualizacion`. Siguiendo el mismo criterio ya aplicado en `pagos.usuarioRegistroId`, se incorporará un campo `usuarioModificacionId` en `historiaClinica`, que registra qué actor (Cliente titular, Administrador o Entrenador) realizó la última carga o modificación. De esta forma queda trazado no solo cuándo se modificó un registro clínico, sino también quién lo hizo.

---

## 5. Alcance de esta etapa

Este documento describe el diseño de seguridad planificado para la etapa de desarrollo del MVP. Para la Segunda Entrega (Diseño y Módulos) no se implementa código, por lo que estas definiciones son el marco que va a guiar la implementación real de autenticación y autorización en el backend.