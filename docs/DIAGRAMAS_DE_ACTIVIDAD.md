# Diagramas de Actividad — Gym Manager

## 1. Asignación de rutina a un cliente

**Caso de uso:** CU-07 — Asignar rutina a cliente.

**Actor principal:** Entrenador.

El diagrama representa las validaciones del cliente, la vigencia de la rutina anterior y el límite de rutinas conservadas.

```text
flowchart TD
    A([Inicio]) --> B[El entrenador solicita asignar una rutina]
    B --> C{¿El cliente existe y está activo?}
    C -- No --> D[Rechazar la operación]
    C -- Sí --> E{¿Los ejercicios necesarios existen?}
    E -- No --> D
    E -- Sí --> F[Consultar las rutinas del cliente]
    F --> G{¿Existe una rutina activa?}
    G -- Sí --> H[Marcar la rutina anterior como inactiva]
    H --> I[Registrar la fecha de baja]
    G -- No --> J{¿Se alcanzó el límite de 12 rutinas?}
    I --> J
    J -- Sí --> K[Eliminar la rutina inactiva más antigua]
    J -- No --> L[Preparar la nueva rutina]
    K --> L
    L --> M[Guardar la nueva rutina activa]
    M --> N[Verificar que exista una sola rutina activa]
    N --> O([Fin])
    D --> O
```

**Resultado esperado:** el cliente queda con una nueva rutina activa y se conserva el historial dentro del límite establecido por RN-04.

La rutina activa nunca debe eliminarse como parte de la limpieza del historial.

## 2. Carga y consulta de historia clínica

**Casos de uso:** CU-09 — Cargar historia clínica; CU-10 — Consultar historia clínica.

**Actores:** cliente con cuenta, administrador y entrenador.

El acceso depende del rol del usuario y, cuando actúa un cliente, de que la historia corresponda a su propio registro.

```text
flowchart TD
    A([Inicio]) --> B[El usuario solicita cargar o consultar una historia clínica]
    B --> C{¿Está autenticado cuando corresponde?}
    C -- No --> D[Rechazar el acceso]
    C -- Sí --> E[Identificar rol y cliente objetivo]
    E --> F{¿Es administrador o entrenador?}
    F -- Sí --> G[Validar que el cliente objetivo exista]
    F -- No --> H{¿Es el cliente titular de la historia?}
    H -- No --> D
    H -- Sí --> I[Autorizar acceso a su propia historia]
    G --> J{¿La operación es cargar o actualizar?}
    I --> J
    J -- Sí --> K[Validar y guardar los datos clínicos]
    J -- No --> L[Consultar los datos clínicos autorizados]
    K --> M[Registrar la fecha de actualización]
    M --> N([Fin])
    L --> N
```

**Resultado esperado:** solo los actores autorizados pueden consultar o modificar la historia clínica. Un cliente no puede acceder a la historia de otro cliente.

## 3. Detección automática de cuotas vencidas

**Caso de uso:** CU-14 — Detectar cuotas vencidas.

**Actor del proceso:** sistema. El administrador consulta los resultados.

El proceso periódico actualiza el estado de las cuotas; no debe confundirse con el indicador de próximos vencimientos del dashboard, contemplado en CU-15 y RN-13.

```text
flowchart TD
    A([Inicio del proceso periódico]) --> B[Obtener las cuotas registradas]
    B --> C[Evaluar cada cuota]
    C --> D{¿La fecha de vencimiento ya pasó?}
    D -- No --> H{¿Quedan cuotas por evaluar?}
    D -- Sí --> E{¿La obligación sigue impaga?}
    E -- No --> H
    E -- Sí --> F[Actualizar estado a VENCIDO]
    F --> H
    H -- Sí --> C
    H -- No --> I[Finalizar el proceso]
    I --> J[El administrador puede consultar las cuotas vencidas]
    J --> K([Fin])
```

**Resultado esperado:** las obligaciones vencidas y todavía impagas se identifican y actualizan para su consulta por el administrador, de acuerdo con RN-11.
