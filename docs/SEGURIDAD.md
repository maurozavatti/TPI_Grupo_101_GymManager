# Seguridad — Gym Manager

## Descripción

Este documento detalla cómo el sistema protege el acceso a la información, con foco particular en la **historia clínica**, por tratarse de datos sensibles de salud. Complementa lo mencionado en la Sección 12 del `README.md` (stack tecnológico) y en `MODULOS.md` (permisos por módulo).

---

## 1. Autenticación

- Las sesiones se persisten en `sesiones`. El backend genera un token aleatorio de 32 bytes y conserva su hash SHA-256, el usuario y las fechas de creación y vencimiento.
- La cookie `gymmanager_sesion` incluye `HttpOnly`, `SameSite=Lax`, `Path=/` y `Max-Age`. Con `NODE_ENV=production` se agrega `Secure`. `HttpOnly` impide leer su valor desde JavaScript de la página.
- Cada sesión dura ocho horas. El backend comprueba explícitamente `fechaVencimiento` y consulta la cuenta activa y sus roles actuales en `usuarios`. El índice TTL permite limpiar documentos vencidos; su eliminación puede demorarse.
- Las contraseñas se guardan como hashes de `bcryptjs` con costo 12. Las nuevas contraseñas requieren al menos ocho caracteres, hasta 72 bytes UTF-8 y un valor que no sea solo espacios.
- El registro público crea una cuenta con `rol: ['USUARIO']` y una sesión, sin crear una ficha de cliente. La administración vincula cuenta y ficha después de comprobar su identidad.
- El login muestra el mismo error ante correo inexistente, contraseña incorrecta o cuenta inactiva.
- El cierre de sesión elimina su documento y expira la cookie. El cambio de contraseña autenticado exige la actual y la confirmación, renueva la sesión del navegador actual y elimina las anteriores.
- La demostración usa HTTPS. El desarrollo local utiliza HTTP con Vite o con el servidor conjunto.
- Google, recuperación por correo y verificación del correo mediante códigos quedan fuera del MVP. La comprobación sintáctica de un email no demuestra su existencia ni su titularidad.

---

## 2. Autorización

La autorización se aplica a nivel de **endpoint**. Cada controlador exige sesión y comprueba pertenencia a los roles permitidos mediante las funciones compartidas. El modelo de `rol` es un arreglo no vacío y sin repetidos de `ADMIN`, `ENTRENADOR` y/o `USUARIO`. Una cuenta `ADMIN` + `ENTRENADOR` conserva el alcance administrativo. Las funciones del frontend organizan menú y redirecciones.

Para los endpoints vinculados a un cliente específico (por ejemplo, consultar su propia rutina o su propia historia clínica), además del rol se valida que el `clienteId` del recurso solicitado corresponda al `clienteId` asociado al usuario autenticado — así un Cliente no puede consultar los datos de otro cliente simplemente cambiando un identificador en la URL.

---

## 3. Acceso a la historia clínica (foco específico)

La historia clínica (`clientes.historiaClinica`) es el dato más sensible del sistema, por lo que tiene el control de acceso más estricto. La siguiente tabla resume quién puede hacer qué, y cómo se aplica técnicamente (ver también `MODULOS.md`, Módulo 5, y [REGLAS_DE_NEGOCIO.md](REGLAS_DE_NEGOCIO.md), RN-06):

| Rol | Crear / Modificar | Consultar | Cómo se verifica |
|---|---|---|---|
| Cliente (titular) | Sí, solo la propia | Sí, solo la propia | El backend obtiene el usuario autenticado a partir de la cookie de sesión (`obtenerUsuarioSesion`) y compara el `clienteId` del recurso contra el `clienteId` asociado a esa sesión. |
| Administrador | Sí, de cualquier cliente | Sí, de cualquier cliente | El controlador del endpoint comprueba que los roles actuales incluyan `ADMIN` antes de ejecutar la operación. |
| Entrenador | Sí, de cualquier cliente | Sí, de cualquier cliente | El controlador del endpoint comprueba que los roles actuales incluyan `ENTRENADOR` o `ADMIN` antes de ejecutar la operación. |
| Otro cliente (no titular) | No | No | El backend rechaza la petición (403) si el `clienteId` de la sesión no coincide con el del recurso y el rol no es `ADMIN`/`ENTRENADOR`. |

**Separación de endpoints:** los campos de `historiaClinica` no se exponen en las mismas respuestas generales autenticadas que el resto del perfil del cliente (por ejemplo, el endpoint que lista clientes para armar un turno no incluye `historiaClinica` en la respuesta). Se accede a través de un endpoint específico, con su propio control de autorización, para reducir el riesgo de exposición accidental de datos sensibles.

**Minimización de datos:** siguiendo el principio de pedir solo la información necesaria (ya mencionado en el README, Sección 11), la historia clínica se limita a antecedentes, lesiones y observaciones relevantes para el entrenamiento — no se solicitan datos médicos más allá de ese propósito.

---

## 4. Trazabilidad

Los registros utilizan `fechaCreacion`, `fechaModificacion` y las fechas de baja que correspondan. La historia clínica guarda `fechaActualizacion` y `usuarioModificacionId` con la última modificación y su autor. El documento clínico conserva su último estado, sin un historial completo de versiones.

`pagos.usuarioRegistroId` identifica al administrador que cargó la obligación. Las asignaciones y retiros de turnos se registran en `historialClientes` con cliente, acción, fecha y usuario.

---

## 5. Responsabilidades de operación

- Las credenciales de Atlas se configuran únicamente en el backend mediante variables de entorno. El `.env` real está excluido de Git.
- La baja de una cuenta elimina sus sesiones. La baja de una ficha conserva la cuenta y se administra por separado.
- Los índices únicos `sparse` evitan vínculos duplicados cuando la referencia existe. La aplicación mantiene ambas referencias mediante una transacción y las omite cuando no existe vínculo.
- El equipo administra los permisos de Atlas, las restricciones de red, HTTPS y las variables del servicio de demostración. El entorno de desarrollo no publica credenciales en el frontend.

Los controles descritos delimitan el diseño y las responsabilidades de seguridad; no constituyen una certificación de seguridad del entorno desplegado.
