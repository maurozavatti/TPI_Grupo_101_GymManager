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

# 2. Colección `clientes`

Representa a las personas que concurren al gimnasio.

Un cliente puede tener o no una cuenta de usuario. Esto permite registrar clientes que todavía no utilizan la aplicación.

Además, esta colección contiene como documentos embebidos las **rutinas** (actual e histórico) y la **historia clínica básica**.

### Estructura

```text
clientes
│
├── _id
├── nombre
├── apellido
├── dni
├── fechaNacimiento
├── telefono
├── email
├── direccion
├── contactoEmergencia
├── usuarioId (opcional)
├── activo
├── fechaCreacion
├── fechaModificacion
├── fechaBaja (opcional)
│
├── rutinas[]
│   ├── _id
│   ├── fechaAsignacion
│   ├── entrenadorId
│   ├── observaciones
│   ├── activo
│   ├── fechaCreacion
│   ├── fechaModificacion
│   ├── fechaBaja
│   └── ejercicios[]
│       ├── ejercicioId
│       ├── series
│       ├── repeticiones
│       ├── peso
│       ├── descanso
│       ├── orden
│       └── observaciones
│
└── historiaClinica
    ├── antecedentes
    ├── lesiones
    ├── observaciones
    └── fechaActualizacion
```

### Campos principales

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | Identificador único del cliente. |
| `nombre` | String | Nombre del cliente. |
| `apellido` | String | Apellido del cliente. |
| `dni` | String | Documento de identidad. |
| `fechaNacimiento` | Date | Fecha de nacimiento. |
| `telefono` | String | Número de teléfono. |
| `email` | String | Correo electrónico. |
| `direccion` | String | Domicilio. |
| `contactoEmergencia` | Object | Información de contacto de emergencia. |
| `usuarioId` | ObjectId / null | Referencia a su cuenta de usuario, si posee una. |
| `rutinas` | Array de objetos | Historial de rutinas asignadas al cliente (ver abajo). |
| `historiaClinica` | Object | Información clínica básica. |
| `activo` | Boolean | Indica si el cliente está habilitado (baja lógica). |
| `fechaCreacion` | Date | Fecha de alta del cliente. |
| `fechaModificacion` | Date | Fecha de la última modificación de sus datos. |
| `fechaBaja` | Date / null | Fecha en la que se dio de baja al cliente (`null` si sigue activo). |

Al igual que en `usuarios`, la baja de un cliente es lógica: se marca `activo: false` y se completa `fechaBaja`, sin eliminar el documento ni su historial de rutinas, historia clínica o pagos asociados.

---

## Rutinas embebidas

Cada rutina se almacena como un elemento dentro del arreglo `rutinas`, embebido en el documento del cliente.

**Decisión de diseño:** en lugar de sobrescribir la rutina cada vez que se asigna una nueva, se aplica el mismo criterio de **baja lógica** que se usa en el resto del modelo. Esto tiene dos ventajas: mantiene consistencia con las demás colecciones, y conserva el historial de rutinas anteriores de cada cliente (útil, por ejemplo, para ver cómo evolucionó su entrenamiento a lo largo del tiempo). La alternativa de sobrescribir es más simple, pero pierde esa información apenas se asigna una rutina nueva.

**Regla de negocio:** en el arreglo `rutinas`, solo un elemento puede tener `activo: true` a la vez (la rutina vigente). Cuando el entrenador asigna una rutina nueva, la anterior pasa a `activo: false` y se completa su `fechaBaja` con la fecha del reemplazo; la nueva rutina se agrega al arreglo con `activo: true`.

**Límite del historial:** para evitar que el arreglo `rutinas` crezca de forma indefinida (un arreglo embebido sin límite es una mala práctica en MongoDB, ya que todo el documento del cliente se lee y se reescribe en cada operación), se define un máximo de **12 rutinas** por cliente — equivalente, en promedio, a un año de historial si las rutinas se actualizan mensualmente. Cuando se asigna una rutina nueva y el arreglo ya alcanzó ese límite, se elimina físicamente la rutina inactiva más antigua (nunca la que está `activo: true`), manteniendo siempre las 12 más recientes.

Cada ejercicio dentro de una rutina tiene una referencia al catálogo de `ejercicios`.

### Ejemplo

```json
{
  "rutinas": [
    {
      "_id": "ObjectId",
      "fechaAsignacion": "2026-03-01",
      "entrenadorId": "ObjectId",
      "observaciones": "Rutina inicial",
      "activo": false,
      "fechaCreacion": "2026-03-01",
      "fechaModificacion": "2026-03-01",
      "fechaBaja": "2026-09-10",
      "ejercicios": [
        {
          "ejercicioId": "ObjectId",
          "series": 3,
          "repeticiones": 12,
          "peso": 15,
          "descanso": 60,
          "orden": 1,
          "observaciones": ""
        }
      ]
    },
    {
      "_id": "ObjectId",
      "fechaAsignacion": "2026-09-10",
      "entrenadorId": "ObjectId",
      "observaciones": "Actualización de rutina",
      "activo": true,
      "fechaCreacion": "2026-09-10",
      "fechaModificacion": "2026-09-10",
      "fechaBaja": null,
      "ejercicios": [
        {
          "ejercicioId": "ObjectId",
          "series": 3,
          "repeticiones": 12,
          "peso": 20,
          "descanso": 60,
          "orden": 1,
          "observaciones": ""
        }
      ]
    }
  ]
}
```

De esta manera, no es necesario crear una colección independiente llamada `rutinas`, y el cliente conserva tanto su rutina vigente como el historial de rutinas anteriores.

---

## Historia clínica embebida

La historia clínica básica también se almacenará dentro del documento del cliente.

Su objetivo será registrar información mínima necesaria para el funcionamiento del MVP, como antecedentes, lesiones y observaciones.

El acceso a esta información estará restringido según el rol del usuario.

---

# 3. Colección `ejercicios`

Contiene el catálogo general de ejercicios disponibles para que los entrenadores puedan crear las rutinas.

### Estructura

```text
ejercicios
│
├── _id
├── codigo
├── nombre
├── descripcion
├── grupoMuscular
├── activo
├── fechaCreacion
├── fechaModificacion
└── fechaBaja (opcional)
```

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | Identificador interno generado por MongoDB. |
| `codigo` | String | Identificador legible del ejercicio (por ejemplo, `EJ-0001`), usado para referenciarlo de forma más clara que con el `_id`. |
| `nombre` | String | Nombre del ejercicio. |
| `descripcion` | String | Descripción general. |
| `grupoMuscular` | String | Grupo muscular trabajado. |
| `activo` | Boolean | Permite realizar eliminación lógica. |
| `fechaCreacion` | Date | Fecha en la que se dio de alta el ejercicio. |
| `fechaModificacion` | Date | Fecha de la última modificación. |
| `fechaBaja` | Date / null | Fecha en la que se dio de baja el ejercicio (`null` si sigue activo). |

Los ejercicios serán referenciados desde las rutinas mediante `ejercicioId`.

```text
CLIENTE
   │
   └── rutinas[]
         │
         └── ejercicios[]
                  │
                  └── ejercicioId
                         │
                         ▼
                    EJERCICIOS
```

---

# 4. Colección `turnos`

Representa los horarios disponibles dentro del gimnasio y los clientes asignados a cada uno.

### Estructura

```text
turnos
│
├── _id
├── dia
├── horaInicio
├── horaFin
├── capacidad
├── entrenadorId
├── clientes[]
├── activo
└── observaciones
```

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | Identificador único del turno. |
| `dia` | String | Día de la semana. |
| `horaInicio` | String | Hora de inicio. |
| `horaFin` | String | Hora de finalización. |
| `capacidad` | Number | Cantidad máxima de clientes. |
| `entrenadorId` | ObjectId | Entrenador responsable del turno. |
| `clientes` | Array<ObjectId> | Clientes asignados al turno. |
| `activo` | Boolean | Indica si el turno está disponible. |
| `observaciones` | String | Información adicional. |

### Ejemplo

```json
{
  "_id": "ObjectId",
  "dia": "Lunes",
  "horaInicio": "18:00",
  "horaFin": "19:00",
  "capacidad": 10,
  "entrenadorId": "ObjectId",
  "clientes": [
    "ObjectId",
    "ObjectId",
    "ObjectId"
  ],
  "activo": true,
  "observaciones": ""
}
```

---

# 5. Colección `pagos`

Registra los pagos realizados por los clientes.

Para el MVP se contemplan principalmente dos tipos de pago:

- Inscripción inicial.
- Cuota periódica.

### Estructura

```text
pagos
│
├── _id
├── clienteId
├── tipo
├── monto
├── fechaPago
├── fechaVencimiento
├── estado
└── observaciones
```

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | Identificador único del pago. |
| `clienteId` | ObjectId | Cliente al que corresponde el pago. |
| `tipo` | String | `INSCRIPCION` o `CUOTA`. |
| `monto` | Number | Importe del pago. |
| `fechaPago` | Date | Fecha en la que se realizó el pago. |
| `fechaVencimiento` | Date | Fecha de vencimiento de la cuota. |
| `estado` | String | `PAGADO`, `PENDIENTE` o `VENCIDO`. |
| `observaciones` | String | Información adicional. |

### Ejemplo

```json
{
  "_id": "ObjectId",
  "clienteId": "ObjectId",
  "tipo": "CUOTA",
  "monto": 25000,
  "fechaPago": "2026-09-01",
  "fechaVencimiento": "2026-10-01",
  "estado": "PAGADO",
  "observaciones": ""
}
```

---

# Relaciones entre colecciones

Aunque MongoDB es una base de datos documental y permite almacenar información relacionada dentro de un mismo documento, algunas relaciones se resuelven mediante referencias entre colecciones. A continuación se describe cada una, indicando su tipo de cardinalidad.

**Usuario y Cliente.** Un usuario con rol `USUARIO` representa la cuenta de acceso de un cliente, y se vinculan de forma cruzada: el usuario guarda el `clienteId` del cliente que representa, y el cliente guarda el `usuarioId` de su cuenta (si tiene una). Es una relación **uno a uno**: una cuenta de usuario corresponde a un único cliente, y un cliente tiene, como máximo, una cuenta de usuario asociada.

**Pago y Cliente.** Cada documento de `pagos` referencia a un único cliente a través de `clienteId`, pero un mismo cliente puede tener registrados muchos pagos a lo largo del tiempo (inscripción, cuotas sucesivas, etc.). Es una relación **uno a muchos**: un cliente puede tener muchos pagos, pero cada pago pertenece a un solo cliente.

**Turno y Entrenador.** Cada `turno` referencia, mediante `entrenadorId`, al usuario (con rol `ENTRENADOR`) que lo dicta. Un mismo entrenador puede dictar varios turnos a lo largo de la semana. Es una relación **uno a muchos**: un entrenador puede tener muchos turnos asignados, pero cada turno tiene un único entrenador responsable.

**Turno y Clientes.** Cada `turno` mantiene un arreglo `clientes[]` con los clientes anotados a ese horario, y un mismo cliente puede estar anotado a más de un turno (por ejemplo, si asiste varios días a la semana o a distintas clases). Es una relación **muchos a muchos**: varios clientes pueden compartir un turno, y un cliente puede pertenecer a varios turnos.

**Rutina y Entrenador.** Cada rutina embebida dentro de un cliente referencia, mediante `entrenadorId`, al entrenador que la asignó. Un mismo entrenador puede haber asignado rutinas a muchos clientes distintos (y, a lo largo del tiempo, varias rutinas al mismo cliente). Es una relación **uno a muchos**: un entrenador puede estar asociado a muchas rutinas, pero cada rutina fue asignada por un único entrenador.

**Rutina y Ejercicio.** Cada rutina contiene un arreglo `ejercicios[]` donde cada elemento referencia, mediante `ejercicioId`, a un ejercicio del catálogo. Un mismo ejercicio puede formar parte de muchas rutinas distintas (de distintos clientes, o de distintas rutinas del mismo cliente), y una rutina normalmente incluye varios ejercicios. Es una relación **muchos a muchos**: un ejercicio puede estar en muchas rutinas, y una rutina puede tener muchos ejercicios.

---

# Justificación del modelo documental

La elección de MongoDB permite representar determinados datos como documentos embebidos, reduciendo la necesidad de separar información que pertenece directamente a una entidad.

En particular, las **rutinas del cliente** se almacenarán dentro de `clientes`, ya que sus ejercicios, series, repeticiones, peso y observaciones forman parte de la información correspondiente a ese cliente.

También se utilizará un documento embebido para la **historia clínica básica**, manteniendo esta información asociada directamente al cliente y aplicando controles de acceso según el rol.

Por otro lado, se mantienen como colecciones independientes los ejercicios, turnos y pagos debido a que son elementos que pueden ser reutilizados o registrados múltiples veces.
