# Esquema NoSQL — Gym Manager

## Descripción

Gym Manager utiliza la base documental **gym_manager** en **MongoDB Atlas**, accedida desde el backend mediante el driver oficial.

El modelo está compuesto por **siete colecciones**, buscando representar las entidades necesarias para el funcionamiento del MVP y aprovechando las características de una base de datos documental.

Las colecciones definidas son:

- `usuarios`
- `clientes`
- `ejercicios`
- `turnos`
- `pagos`
- `configuracion`
- `sesiones`

De estas, `sesiones` es una colección técnica (no representa una entidad del negocio): almacena las sesiones de acceso autenticado, como se detalla en la sección correspondiente más abajo.

La información correspondiente a las **rutinas** y a la **historia clínica básica** se almacena como documentos embebidos dentro de la colección `clientes`, evitando crear colecciones independientes para estos datos.

---

# 1. Colección `usuarios`

Representa las cuentas que pueden acceder al sistema.

Las cuentas tienen uno o varios roles según sus permisos dentro del gimnasio.

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
├── passwordHash
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
| `passwordHash` | String | Hash de la contraseña (nunca se almacena en texto plano). |
| `rol` | Array\<String\> | Uno o más de `ADMIN`, `ENTRENADOR` o `USUARIO`. Una misma cuenta puede tener más de un rol a la vez (por ejemplo, el dueño del gimnasio puede ser `ADMIN` y además `ENTRENADOR`). Aunque tenga un solo rol, se almacena como arreglo (por ejemplo `["USUARIO"]`). |
| `clienteId` | ObjectId (opcional) | Referencia a la ficha vinculada. Se omite cuando no existe vínculo para respetar el índice único sparse. |
| `activo` | Boolean | Indica si la cuenta está habilitada (baja lógica). |
| `fechaCreacion` | Date | Fecha en la que se creó la cuenta. |
| `fechaModificacion` | Date | Fecha de la última modificación de los datos del usuario. |
| `fechaBaja` | Date / null (opcional) | Fecha de baja de la cuenta; puede estar ausente mientras está activa. |

### Ejemplo

```json
{
  "_id": "ObjectId",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@email.com",
  "passwordHash": "$2b$12$K3n9...",
  "rol": ["USUARIO"],
  "clienteId": "ObjectId",
  "activo": true,
  "fechaCreacion": "2026-03-01",
  "fechaModificacion": "2026-03-01",
  "fechaBaja": null
}
```

El campo `clienteId` es opcional debido a que **no todos los usuarios del sistema son clientes**. Por ejemplo, un entrenador tendrá el rol `ENTRENADOR` y no necesita estar asociado a un documento de `clientes`.

La baja de un usuario es **lógica**: en lugar de eliminar el documento, se marca `activo: false` y se completa `fechaBaja`, conservando el registro y su historial de actividad (por ejemplo, los turnos que dictó o las rutinas que asignó como entrenador).

**Cuentas con más de un rol.** Al guardar `rol` siempre como arreglo, una misma cuenta puede combinar roles (por ejemplo `["ADMIN", "ENTRENADOR"]`). Una cuenta que tiene a la vez `ADMIN` y `ENTRENADOR` se trata, a nivel de permisos, como Administrador: no aplican sobre ella las restricciones propias del Entrenador (por ejemplo, la de operar solo sobre sus propios turnos), ya que el `ADMIN` ya tiene acceso sin restricciones a esas operaciones.

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
├── contactoEmergencia (opcional)
│   ├── nombre
│   ├── telefono
│   └── relacion
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
└── historiaClinica (opcional)
    ├── antecedentes
    ├── lesiones
    ├── observaciones
    ├── fechaActualizacion
    └── usuarioModificacionId
```

### Campos principales

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | Identificador único del cliente. |
| `nombre` | String | Nombre del cliente. |
| `apellido` | String | Apellido del cliente. |
| `dni` | String | Documento de identidad. |
| `fechaNacimiento` | Date / null (opcional) | Fecha de nacimiento, cuando se informa. |
| `telefono` | String / null (opcional) | Número de teléfono. |
| `email` | String / null (opcional) | Correo de contacto; es independiente del correo de acceso de la cuenta. |
| `direccion` | String / null (opcional) | Domicilio. |
| `contactoEmergencia` | Object (opcional) | Datos de contacto de emergencia: `nombre`, `telefono` y `relacion` (vínculo con el cliente, por ejemplo "madre" o "pareja"). |
| `usuarioId` | ObjectId (opcional) | Referencia a la cuenta vinculada. Se omite cuando no existe vínculo para respetar el índice único sparse. |
| `rutinas` | Array de objetos | Historial de rutinas asignadas al cliente (ver abajo). |
| `historiaClinica` | Object (opcional) | Información clínica básica. No todo cliente la tiene cargada: solo existe una vez que el cliente la completa por primera vez (por eso se modela como `0..1` en el diagrama UML, no como un campo obligatorio). |
| `activo` | Boolean | Indica si el cliente está habilitado (baja lógica). |
| `fechaCreacion` | Date | Fecha de alta del cliente. |
| `fechaModificacion` | Date | Fecha de la última modificación de sus datos. |
| `fechaBaja` | Date / null (opcional) | Fecha de baja de la ficha; puede estar ausente mientras está activa. |

Al igual que en `usuarios`, la baja de un cliente es lógica: se marca `activo: false` y se completa `fechaBaja`, sin eliminar el documento ni su historial de rutinas, historia clínica o pagos asociados.

---

## Rutinas embebidas

Cada rutina se almacena como un elemento dentro del arreglo `rutinas`, embebido en el documento del cliente.

**Decisión de diseño:** en lugar de sobrescribir la rutina cada vez que se asigna una nueva, se aplica el mismo criterio de **baja lógica** que se usa en el resto del modelo. Esto tiene dos ventajas: mantiene consistencia con las demás colecciones, y conserva el historial de rutinas anteriores de cada cliente (útil, por ejemplo, para ver cómo evolucionó su entrenamiento a lo largo del tiempo). La alternativa de sobrescribir es más simple, pero pierde esa información apenas se asigna una rutina nueva.

**Regla de negocio:** en el arreglo `rutinas`, solo un elemento puede tener `activo: true` a la vez (la rutina vigente). Cuando el entrenador asigna una rutina nueva, la anterior pasa a `activo: false` y se completa su `fechaBaja` con la fecha del reemplazo; la nueva rutina se agrega al arreglo con `activo: true`.

**Límite del historial:** se conservan como máximo **12 rutinas en total por cliente**, incluida la vigente. El límite acota el crecimiento del documento y el volumen de historial consultado. No representa un plazo fijo de conservación: depende de la frecuencia de asignación. Cuando se asigna una rutina nueva y el arreglo ya alcanzó ese límite, se elimina físicamente la rutina inactiva más antigua (nunca la que está `activo: true`), manteniendo siempre las 12 más recientes.

Cada ejercicio dentro de una rutina referencia al catálogo de `ejercicios`. Las rutinas tienen `_id` propio dentro del arreglo para poder consultarlas y editar la vigente. El código registra en `entrenadorId` la cuenta del personal que realiza la asignación.

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

La historia clínica básica se almacena dentro del documento del cliente.

Registra antecedentes, lesiones y observaciones relevantes para el entrenamiento. El controlador añade `fechaActualizacion` y `usuarioModificacionId` para identificar la última modificación y su autor. Los archivos médicos adjuntos quedan fuera del MVP.

Es un campo **opcional** (cardinalidad `0..1`): no se exige al cliente completarla para poder registrarse. Puede ser cargada por el propio cliente si tiene cuenta o por el administrador/entrenador cuando corresponda, incluyendo clientes sin cuenta. Un cliente sin historia clínica cargada simplemente no tiene ese campo en su documento.

El acceso se restringe al titular y al personal autorizado según [SEGURIDAD.md](SEGURIDAD.md).

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
| `descripcion` | String (opcional) | Descripción general; el formulario permite dejarla vacía. |
| `grupoMuscular` | String | Grupo muscular trabajado. |
| `activo` | Boolean | Permite realizar eliminación lógica. |
| `fechaCreacion` | Date | Fecha en la que se dio de alta el ejercicio. |
| `fechaModificacion` | Date | Fecha de la última modificación. |
| `fechaBaja` | Date / null (opcional) | Fecha de baja del ejercicio; puede estar ausente mientras está activo. |

Los ejercicios son referenciados desde las rutinas mediante `ejercicioId`.

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

**Aclaración sobre `dia`, `horaInicio` y `horaFin`:** los turnos del MVP son **recurrentes semanales** (por ejemplo, "Lunes 18:00 a 19:00" se repite todas las semanas mientras el turno esté `activo`), no clases puntuales con una fecha específica. Por eso el documento no tiene un campo `fecha`: la recurrencia semanal está implícita en el campo `dia`. Si más adelante se necesitaran turnos de fecha única (por ejemplo, una clase especial), se evaluará agregar un campo `fecha` opcional; para el MVP no es necesario.

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
├── historialClientes[]
│   ├── clienteId
│   ├── accion
│   ├── fecha
│   └── usuarioId
├── activo
└── observaciones
```

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | Identificador único del turno. |
| `dia` | String | Uno de `LUNES`, `MARTES`, `MIERCOLES`, `JUEVES`, `VIERNES`, `SABADO` o `DOMINGO`. |
| `horaInicio` | String | Hora de inicio. |
| `horaFin` | String | Hora de finalización. Todo turno dura exactamente una hora: `horaFin` es siempre `horaInicio + 1h` (RN-19), tanto si se crea individualmente como si se genera en bloque con "Generar agenda". |
| `capacidad` | Int32 | Cupo entero positivo; la versión admite valores de 1 a 100. |
| `entrenadorId` | ObjectId | Entrenador responsable del turno. |
| `clientes` | Array\<ObjectId\> | Clientes asignados al turno. |
| `historialClientes` | Array de objetos | Registro de cada asignación o retiro de un cliente del turno (quién, cuándo y qué acción), análogo al historial de pagos. |
| `activo` | Boolean | Indica si el turno está disponible. |
| `observaciones` | String | Información adicional. |

### Ejemplo

```json
{
  "_id": "ObjectId",
  "dia": "LUNES",
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
├── observaciones
└── usuarioRegistroId
```

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | Identificador único del pago. |
| `clienteId` | ObjectId | Cliente al que corresponde el pago. |
| `tipo` | String | `INSCRIPCION` o `CUOTA`. |
| `monto` | Decimal128 | Importe monetario conforme al diseño de Atlas confirmado por el equipo. La API debe definir una representación decimal precisa para el transporte JSON. |
| `fechaPago` | Date (obligatorio en Atlas) | Fecha del cobro. El validador de Atlas compartido exige que el campo exista y sea BSON Date; no admite `null` ni su omisión. |
| `fechaVencimiento` | Date (obligatorio en Atlas) | Fecha de vencimiento. El validador de Atlas compartido exige que el campo exista y sea BSON Date, también para pagos ya cobrados; no admite `null` ni su omisión. |
| `estado` | String | `PAGADO`, `PENDIENTE` o `VENCIDO`. |
| `observaciones` | String | Información adicional. |
| `usuarioRegistroId` | ObjectId | Referencia al usuario con rol `ADMIN` que registró el pago, para poder auditar quién lo cargó. La gestión de pagos es una operación exclusiva del Administrador; el Entrenador no tiene acceso a este módulo. |

### Ejemplo

```json
{
  "_id": "ObjectId",
  "clienteId": "ObjectId",
  "tipo": "CUOTA",
  "monto": { "$numberDecimal": "25000.00" },
  "fechaPago": "2026-09-01",
  "fechaVencimiento": "2026-10-01",
  "estado": "PAGADO",
  "observaciones": "",
  "usuarioRegistroId": "ObjectId"
}
```

---

## Importes y estados de pago

El modelo utiliza BSON Decimal128 para importes monetarios. La representación de esos valores en JSON debe preservar la precisión decimal.

Una obligación impaga permanece `PENDIENTE` hasta superar su vencimiento y pasa a `VENCIDO` al consultar pagos. El cobro establece `PAGADO` y `fechaPago`. La carga de cuotas es manual y no cancela obligaciones anteriores. Las restricciones de la implementación se describen en las [limitaciones del MVP](../README.md#6-limitaciones-del-mvp).

**Distinción entre validación y comportamiento funcional:** una obligación pendiente representa un cobro que aún no ocurrió. Esto no implica que Atlas permita guardar `fechaPago: null` o prescindir de alguna fecha: el validador compartido exige ambas como BSON Date. La representación de obligaciones pendientes debe distinguirse de esa restricción de persistencia; aquí no se define una fecha ficticia ni una modificación del validador para resolver la incompatibilidad.

---

# Índices únicos

Para garantizar la integridad de los datos, se definen los siguientes índices únicos a nivel de base de datos (no solo validados desde el backend):

| Colección | Campo | Tipo de índice | Motivo |
|---|---|---|---|
| `usuarios` | `email` | Único | No puede haber dos cuentas con el mismo correo de acceso. |
| `usuarios` | `clienteId` | Único (sparse) | Garantiza que un mismo cliente no quede vinculado a más de una cuenta de usuario. Es `sparse` porque una cuenta, cualquiera sea su combinación de roles, puede carecer de ficha. |
| `clientes` | `dni` | Único | No puede haber dos clientes registrados con el mismo documento de identidad. |
| `clientes` | `usuarioId` | Único (sparse) | Garantiza que una misma cuenta de usuario no quede vinculada a más de un cliente. Es `sparse` porque no todos los clientes tienen cuenta. |
| `ejercicios` | `codigo` | Único | El código legible de cada ejercicio (por ejemplo `EJ-0001`) debe ser irrepetible dentro del catálogo. |

Los índices únicos `sparse` impiden referencias duplicadas presentes. No comprueban la existencia del documento referenciado ni la reciprocidad de los dos campos; esa coherencia se mantiene desde la aplicación mediante una transacción. Un valor `null` explícito participa del índice único, por lo que las referencias sin vínculo deben omitirse.

---

# 6. Colección `configuracion`

Almacena parámetros globales del gimnasio, que no pertenecen a una entidad individual sino a la operación general del sistema. La agenda utiliza un documento de configuración de `_id` fijo. El identificador distingue esa configuración dentro de la colección; por sí solo no impide que existan otros documentos técnicos.

Para el MVP, esta colección guarda la configuración de la agenda de turnos: las franjas horarias en las que el gimnasio abre sus puertas, el cupo por defecto para turnos nuevos, y los días de trabajo que cada entrenador tiene asignados dentro de esas franjas.

### Estructura

```text
configuracion
│
├── _id (fijo)
├── franjas[]
│   ├── inicio
│   └── fin
├── capacidad
├── trabajos[]
│   ├── entrenadorId
│   └── dias[]
└── fechaModificacion
```

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | La agenda usa `000000000000000000000001`. El backend hace upsert al generar la agenda. |
| `franjas` | Array de objetos `{ inicio, fin }` | Franjas horarias en las que el gimnasio abre (por ejemplo, 09:00–12:00 y 16:00–21:00). Configuración exclusiva del Administrador (RN-17). |
| `capacidad` | Int32 | Cupo por defecto de turnos generados. Configuración exclusiva del Administrador (RN-17). |
| `trabajos` | Array de objetos `{ entrenadorId, dias }` | Para cada entrenador, los días de la semana en los que dicta turnos dentro de las franjas de apertura. El entrenador solo modifica su propia entrada; ADMIN puede gestionar todas (RN-16, RN-17). |
| `fechaModificacion` | Date | Fecha del último cambio a la configuración. |

Si no existe la configuración de agenda, el backend de referencia utiliza 09:00–21:00, cupo 5 y ningún entrenador asignado hasta la configuración inicial. El cinco es un valor predeterminado; no define el máximo de clientes del gimnasio.

---

# 7. Colección `sesiones`

Almacena las sesiones de acceso autenticado de cada cuenta. Es una colección técnica, propia del mecanismo de autenticación por cookies (no hay JWT), y no representa una entidad del negocio.

Al iniciar sesión, el backend genera un token aleatorio, envía ese token al navegador dentro de una cookie `HttpOnly`, y guarda en esta colección únicamente el **hash** del token (nunca el token original), junto con la cuenta a la que pertenece y su fecha de vencimiento.

### Estructura

```text
sesiones
│
├── _id
├── usuarioId
├── tokenHash
├── fechaCreacion
└── fechaVencimiento
```

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | Identificador único de la sesión. |
| `usuarioId` | ObjectId | Referencia a la cuenta (`usuarios`) a la que pertenece la sesión. |
| `tokenHash` | String | Hash SHA-256 del token enviado al navegador. Nunca se almacena el token en texto plano. |
| `fechaCreacion` | Date | Momento en el que se inició la sesión. |
| `fechaVencimiento` | Date | Momento en el que la sesión deja de ser válida (ocho horas después de `fechaCreacion`). |

### Índices

| Campo | Tipo de índice | Motivo |
|---|---|---|
| `tokenHash` | Único | No puede haber dos sesiones con el mismo hash de token. |
| `fechaVencimiento` | TTL (`expireAfterSeconds: 0`) | MongoDB limpia los documentos vencidos mediante su proceso TTL. La eliminación no es inmediata; el backend verifica el vencimiento en cada autorización. |

Al cerrar sesión, además de eliminarse la cookie del navegador, se elimina el documento correspondiente de esta colección.

---

# Relaciones entre colecciones

Aunque MongoDB es una base de datos documental y permite almacenar información relacionada dentro de un mismo documento, algunas relaciones se resuelven mediante referencias entre colecciones. A continuación se describe cada una, indicando su tipo de cardinalidad.

**Usuario y Cliente.** Un usuario con rol `USUARIO` representa la cuenta de acceso de un cliente, y se vinculan de forma cruzada: el usuario guarda el `clienteId` del cliente que representa, y el cliente guarda el `usuarioId` de su cuenta (si tiene una). Es una relación **uno a uno**: una cuenta de usuario corresponde a un único cliente, y un cliente tiene, como máximo, una cuenta de usuario asociada.

**Pago y Cliente.** Cada documento de `pagos` referencia a un único cliente a través de `clienteId`, pero un mismo cliente puede tener registrados muchos pagos a lo largo del tiempo (inscripción, cuotas sucesivas, etc.). Es una relación **uno a muchos**: un cliente puede tener muchos pagos, pero cada pago pertenece a un solo cliente.

**Turno y Entrenador.** Cada `turno` referencia, mediante `entrenadorId`, al usuario (con rol `ENTRENADOR`) que lo dicta. Un mismo entrenador puede dictar varios turnos a lo largo de la semana. Es una relación **uno a muchos**: un entrenador puede tener muchos turnos asignados, pero cada turno tiene un único entrenador responsable.

**Turno y Clientes.** Cada `turno` mantiene un arreglo `clientes[]` con los clientes anotados a ese horario, y un mismo cliente puede estar anotado a más de un turno (por ejemplo, si asiste varios días a la semana o a distintas clases). Es una relación **muchos a muchos**: varios clientes pueden compartir un turno, y un cliente puede pertenecer a varios turnos.

**Rutina y cuenta responsable.** Cada rutina embebida referencia, mediante `entrenadorId`, a la cuenta del personal que la asignó. El controlador admite `ADMIN` o `ENTRENADOR` y guarda el identificador del actor, aunque solo tenga `ADMIN`. Una cuenta puede asignar varias rutinas y cada rutina tiene un responsable. El nombre del campo se conserva para mantener el contrato existente.

**Rutina y Ejercicio.** Cada rutina contiene un arreglo `ejercicios[]` donde cada elemento referencia, mediante `ejercicioId`, a un ejercicio del catálogo. Un mismo ejercicio puede formar parte de muchas rutinas distintas (de distintos clientes, o de distintas rutinas del mismo cliente), y una rutina normalmente incluye varios ejercicios. Es una relación **muchos a muchos**: un ejercicio puede estar en muchas rutinas, y una rutina puede tener muchos ejercicios.

**Sesión y Usuario.** Cada documento de `sesiones` referencia, mediante `usuarioId`, a la cuenta que inició esa sesión. Una misma cuenta puede tener varias sesiones activas a la vez (por ejemplo, si inicia sesión desde distintos dispositivos). Es una relación **uno a muchos**: un usuario puede tener muchas sesiones, pero cada sesión pertenece a un único usuario.

---

# Justificación del modelo documental

La elección de MongoDB permite representar determinados datos como documentos embebidos, reduciendo la necesidad de separar información que pertenece directamente a una entidad.

En particular, las **rutinas del cliente** se almacenan dentro de `clientes`, ya que sus ejercicios, series, repeticiones, peso y observaciones forman parte de la información correspondiente a ese cliente.

También se utiliza un documento embebido para la **historia clínica básica**, manteniendo esta información asociada directamente al cliente y aplicando controles de acceso según el rol.

Por otro lado, se mantienen como colecciones independientes los ejercicios, turnos y pagos debido a que son elementos que pueden ser reutilizados o registrados múltiples veces.


## Convenciones de tipos

Los ejemplos con `"ObjectId"` o fechas de calendario son ilustrativos. En BSON las referencias se guardan como ObjectId y las fechas como Date. El ejemplo de `monto` usa la representación Extended JSON de Decimal128. Las fechas de auditoría se almacenan como instantes y su presentación se adapta a la zona horaria argentina.

Las cantidades de rutina `series`, `repeticiones`, `descanso` y `orden` son enteros BSON. `peso` admite valor numérico con parte decimal. La historia clínica incluye textos opcionales y la referencia ObjectId `usuarioModificacionId` cuando se guarda una actualización. La ausencia de estos metadatos en registros anteriores debe tratarse al consultar.

La reactivación de una ficha puede registrar `inicioCicloCuotas` (Date) y `cicloCuotasId` (ObjectId) como metadatos de ciclo. No generan obligaciones de pago por sí mismos.

El modelo documental, los validadores y las actualizaciones de la aplicación son mecanismos complementarios; ninguno establece por sí solo todas las reglas de negocio.
