# Esquema NoSQL — Gym Manager

## Descripción

Para el desarrollo del sistema **Gym Manager** se utilizará una base de datos documental **MongoDB NoSQL**.

El modelo estará compuesto por **cinco colecciones principales**, buscando representar las entidades necesarias para el funcionamiento del MVP y aprovechando las características de una base de datos documental.

Las colecciones definidas son:

- `usuarios`
- `clientes`
- `ejercicios`
- `turnos`
- `pagos`

La información correspondiente a las **rutinas** y a la **historia clínica básica** se almacenará como documentos embebidos dentro de la colección `clientes`, evitando crear colecciones independientes para estos datos.

---

# 1. Colección `usuarios`

Representa las cuentas que pueden acceder al sistema.

Los usuarios tendrán diferentes roles según sus permisos dentro del gimnasio.

### Roles

| Rol | Descripción |
|---|---|
| `ADMIN` | Responsable o dueño del gimnasio. |
| `ENTRENADOR` | Encargado de crear y administrar rutinas y asignar clientes a turnos. |
| `USUARIO` | Cliente que posee una cuenta y puede acceder al sistema. |

### Estructura

```text
usuarios
│
├── _id
├── nombre
├── apellido
├── email
├── password
├── rol
├── clienteId (opcional)
├── activo
├── fechaCreacion
├── fechaModificacion
└── fechaBaja (opcional)
```

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | Identificador único del usuario. |
| `nombre` | String | Nombre del usuario. |
| `apellido` | String | Apellido del usuario. |
| `email` | String | Correo utilizado para iniciar sesión. |
| `password` | String | Contraseña almacenada de forma segura. |
| `rol` | String | `ADMIN`, `ENTRENADOR` o `USUARIO`. |
| `clienteId` | ObjectId / null | Referencia al cliente cuando el usuario representa a un cliente. |
| `activo` | Boolean | Indica si la cuenta está habilitada (baja lógica). |
| `fechaCreacion` | Date | Fecha en la que se creó la cuenta. |
| `fechaModificacion` | Date | Fecha de la última modificación de los datos del usuario. |
| `fechaBaja` | Date / null | Fecha en la que se dio de baja la cuenta (`null` si sigue activa). |

### Ejemplo

```json
{
  "_id": "ObjectId",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@email.com",
  "password": "********",
  "rol": "USUARIO",
  "clienteId": "ObjectId",
  "activo": true,
  "fechaCreacion": "2026-03-01",
  "fechaModificacion": "2026-03-01",
  "fechaBaja": null
}
```

El campo `clienteId` es opcional debido a que **no todos los usuarios del sistema son clientes**. Por ejemplo, un entrenador tendrá el rol `ENTRENADOR` y no necesita estar asociado a un documento de `clientes`.

La baja de un usuario es **lógica**: en lugar de eliminar el documento, se marca `activo: false` y se completa `fechaBaja`, conservando el registro y su historial de actividad (por ejemplo, los turnos que dictó o las rutinas que asignó como entrenador).

---

