# Diagramas de Actividad — Gym Manager

## 1. Asignación de rutina a un cliente

**Caso de uso:** CU-07 — Asignar rutina a cliente.

**Actor principal:** administrador o entrenador autenticado.

El diagrama representa las validaciones del cliente, la vigencia de la rutina anterior y el límite de rutinas conservadas.

[Ver diagrama en PNG](diagramas/actividad_01_asignacion_rutina.png)

```mermaid
flowchart TD
    A([Inicio]) --> B[El personal autorizado solicita asignar una rutina]
    B --> C{¿El cliente existe y está activo?}
    C -- No --> D[Rechazar la operación]
    C -- Sí --> E{¿Los ejercicios están activos y los datos son válidos?}
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
    L --> M[Guardar el historial actualizado en una transacción]
    M --> N[Verificar que exista una sola rutina activa]
    N --> O([Fin])
    D --> O
```

**Resultado esperado:** el cliente queda con una nueva rutina activa y se conserva el historial dentro del límite establecido por RN-04.

La rutina activa nunca debe eliminarse como parte de la limpieza del historial. La preparación del historial y su persistencia forman parte de la asignación transaccional; los pasos intermedios no representan escrituras independientes. Los flujos se presentan como bloques Mermaid, visibles directamente en GitHub.

## 2. Carga y consulta de historia clínica

**Casos de uso:** CU-09 — Cargar historia clínica; CU-10 — Consultar historia clínica.

**Actores:** cliente con cuenta, administrador y entrenador.

El acceso depende del rol del usuario y, cuando actúa un cliente, de que la historia corresponda a su propio registro.

[Ver diagrama en PNG](diagramas/actividad_02_historia_clinica.png)

```mermaid
flowchart TD
    A([Inicio]) --> B[El usuario solicita cargar o consultar una historia clínica]
    B --> C{¿Tiene una sesión válida?}
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
    K --> M[Registrar fecha y usuario de modificación]
    M --> N([Fin])
    L --> N
```

**Resultado esperado:** solo los actores autorizados pueden consultar o modificar la historia clínica. Un cliente no puede acceder a la historia de otro cliente.

## 3. Detección de cuotas vencidas al consultar

**Caso de uso:** CU-14 — Detectar cuotas vencidas.

**Actor:** administrador autenticado. El servidor evalúa los pendientes al consultar pagos; no existe una tarea periódica.

[Ver diagrama en PNG](diagramas/actividad_03_cuotas_vencida.png)

```mermaid
flowchart TD
    A([Consultar pagos]) --> B{¿Sesión válida y rol ADMIN?}
    B -- No --> C[Rechazar con 401 o 403]
    B -- Sí --> D[Buscar PENDIENTE con fecha de vencimiento pasada]
    D --> E[Actualizar esas obligaciones a VENCIDO]
    E --> F[Consultar y devolver el listado]
    F --> G[Mostrar pagos y estados]
    G --> H([Fin])
    C --> H
```

**Resultado esperado:** los pendientes vencidos se identifican al consultar, de acuerdo con RN-11. Los pagos ya cobrados no se convierten en deuda. Los indicadores de próximos vencimientos del inicio son una consulta distinta, contemplada en CU-15 y RN-13.
