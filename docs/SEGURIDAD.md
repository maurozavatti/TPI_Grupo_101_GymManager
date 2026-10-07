# Seguridad — Gym Manager

## Descripción

Este documento detalla cómo el sistema protege el acceso a la información, con foco particular en la **historia clínica**, por tratarse de datos sensibles de salud. Complementa lo mencionado en la Sección 12 del `README.md` (stack tecnológico) y en `MODULOS.md` (permisos por módulo).

---

## 1. Autenticación

- El sistema usa **Spring Security + JWT** (ver `README.md`, Sección 12).
- Las contraseñas nunca se almacenan en texto plano: se guarda `passwordHash`, un hash generado con un algoritmo de hashing seguro con salt (por ejemplo, BCrypt), que es el estándar provisto por Spring Security.
- Al iniciar sesión, el sistema valida las credenciales y emite un token JWT con el `_id` del usuario y su `rol` (`ADMIN`, `ENTRENADOR` o `USUARIO`). Ese token se envía en cada request posterior para identificar al usuario, sin necesidad de volver a enviar la contraseña.
- Los tokens tienen un tiempo de expiración, para limitar el impacto si un token se filtra.
- Toda la comunicación entre frontend y backend se realiza sobre **HTTPS**, evitando que las credenciales o los datos sensibles viajen sin cifrar.

---

## 2. Autorización

La autorización se aplica a nivel de **endpoint** del backend (no solo ocultando opciones en el frontend, ya que eso no evita que alguien llame directamente a la API). Cada endpoint declara qué rol o roles pueden invocarlo, usando las anotaciones de Spring Security (por ejemplo, `@PreAuthorize`) para verificar el rol presente en el JWT antes de ejecutar la lógica.

Para los endpoints vinculados a un cliente específico (por ejemplo, consultar su propia rutina o su propia historia clínica), además del rol se valida que el `clienteId` del recurso solicitado corresponda al `clienteId` asociado al usuario autenticado — así un Cliente no puede consultar los datos de otro cliente simplemente cambiando un identificador en la URL.

---

## 3. Acceso a la historia clínica (foco específico)

La historia clínica (`clientes.historiaClinica`) es el dato más sensible del sistema, por lo que tiene el control de acceso más estricto. La siguiente tabla resume quién puede hacer qué, y cómo se aplica técnicamente (ver también `MODULOS.md`, Módulo 5, y `docs/REGLAS_DE_NEGOCIO.md`, RN-06):

| Rol | Crear / Modificar | Consultar | Cómo se verifica |
|---|---|---|---|
| Cliente (titular) | Sí, solo la propia | Sí, solo la propia | El backend compara el `clienteId` del recurso contra el `clienteId` del JWT del usuario autenticado. |
| Administrador | Sí, de cualquier cliente | Sí, de cualquier cliente | El endpoint exige rol `ADMIN` vía `@PreAuthorize`. |
| Entrenador | Sí, de cualquier cliente | Sí, de cualquier cliente | El endpoint exige rol `ENTRENADOR` (o `ADMIN`) vía `@PreAuthorize`. |
| Otro cliente (no titular) | No | No | El backend rechaza la petición (403) si el `clienteId` del JWT no coincide con el del recurso y el rol no es `ADMIN`/`ENTRENADOR`. |

**Separación de endpoints:** los campos de `historiaClinica` no se exponen en los mismos endpoints públicos que el resto del perfil del cliente (por ejemplo, el endpoint que lista clientes para armar un turno no incluye `historiaClinica` en la respuesta). Se accede a través de un endpoint específico, con su propio control de autorización, para reducir el riesgo de exposición accidental de datos sensibles.

**Minimización de datos:** siguiendo el principio de pedir solo la información necesaria (ya mencionado en el README, Sección 11), la historia clínica se limita a antecedentes, lesiones y observaciones relevantes para el entrenamiento — no se solicitan datos médicos más allá de ese propósito.

---

## 4. Trazabilidad

Las acciones sobre datos sensibles quedan parcialmente trazadas mediante los campos de auditoría ya definidos en el esquema: `fechaCreacion`, `fechaModificacion` y, en el caso de `historiaClinica`, `fechaActualizacion`. Para una trazabilidad más completa (quién hizo cada cambio, no solo cuándo), se evaluará agregar un campo `usuarioModificacionId` en `historiaClinica` durante la etapa de desarrollo, siguiendo el mismo criterio ya aplicado en `pagos.usuarioRegistroId`.

---

## 5. Alcance de esta etapa

Este documento describe el diseño de seguridad planificado para la etapa de desarrollo del MVP. Para la Segunda Entrega (Diseño y Módulos) no se implementa código, por lo que estas definiciones son el marco que va a guiar la implementación real de autenticación y autorización en el backend.