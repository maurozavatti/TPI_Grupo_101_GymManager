# Diagramas de actividad — Gym Manager

Los siguientes diagramas representan flujos previstos para el MVP y se basan en los casos de uso y las reglas de negocio documentados en el proyecto.

## 1. Asignación de una rutina a un cliente

**Referencias:** CU-07, RN-03 y RN-04.  
**Módulo:** Rutinas.

```text
flowchart TD
    A([Inicio]) --> B[El entrenador selecciona al cliente]
    B --> C[Configura la nueva rutina]
    C --> D{¿Los datos son válidos?}

    D -- No --> E[Informar errores y permitir correcciones]
    E --> C

    D -- Sí --> F[Consultar las rutinas actuales del cliente]
    F --> G[Desactivar la rutina activa anterior, si existe]
    G --> H{¿El historial alcanzó el máximo de 12 rutinas?}

    H -- No --> K[Agregar la nueva rutina]
    H -- Sí --> I[Identificar la rutina inactiva más antigua]
    I --> J{¿Existe una rutina inactiva para retirar?}

    J -- Sí --> L[Eliminar físicamente la rutina inactiva más antigua]
    L --> K

    J -- No --> M[Detener la operación e informar la inconsistencia]
    M --> Z([Fin])

    K --> N[Marcar la nueva rutina como activa]
    N --> O[Guardar los cambios del cliente]
    O --> P{¿Se guardaron correctamente los cambios?}

    P -- No --> Q[Informar que no se pudo confirmar la asignación]
    P -- Sí --> R[Confirmar la asignación de la rutina]

    Q --> Z
    R --> Z
```

### Reglas que deben respetarse

- El cliente debe tener como máximo una rutina activa.
- El historial admite hasta 12 rutinas.
- Si es necesario liberar espacio, se elimina la rutina inactiva más antigua.
- La rutina activa nunca debe eliminarse mediante la regla de límite del historial.
- Si no existe una rutina inactiva que pueda retirarse, la operación debe detenerse para no incumplir las reglas del sistema.

## 2. Consulta de la historia clínica

**Referencias:** CU-09, CU-10, RN-05 y RN-06.  
**Documentos relacionados:** `SEGURIDAD.md` y `ARQUITECTURA.md`.  
**Módulo:** Historia clínica.

```text
flowchart TD
    A([Inicio]) --> B[El usuario solicita consultar una historia clínica]
    B --> C{¿Existe autenticación válida?}

    C -- No --> D[Rechazar el acceso]
    C -- Sí --> E[Obtener la identidad y el rol autenticados]

    E --> F{¿El rol es ADMIN o ENTRENADOR?}

    F -- Sí --> G[Verificar los permisos del rol]
    G --> H{¿La operación está permitida?}
    H -- No --> D
    H -- Sí --> K[Buscar la historia clínica del cliente solicitado]

    F -- No --> I{¿El rol es USUARIO?}
    I -- No --> D
    I -- Sí --> J[Resolver el cliente asociado a la cuenta autenticada]

    J --> L{¿El cliente solicitado es el propio?}
    L -- No --> D
    L -- Sí --> K

    K --> M{¿Existe una historia clínica registrada?}
    M -- No --> N[Informar que no hay historia clínica registrada]
    M -- Sí --> O[Devolver los datos autorizados]

    O --> P([Fin])
    N --> P
    D --> Q[Informar que el acceso no está autorizado]
    Q --> P
```

### Reglas que deben respetarse

- La autorización debe realizarse en el backend.
- El rol `USUARIO` solo puede consultar la historia clínica correspondiente a su propio cliente.
- Los roles `ADMIN` y `ENTRENADOR` pueden acceder según los permisos definidos en la documentación.
- La historia clínica es opcional. Si no existe, el sistema debe informar esa situación.
- No alcanza con ocultar opciones en el frontend: el backend debe verificar los permisos en cada operación protegida.

## 3. Alcance de los diagramas

Los diagramas describen el comportamiento esperado del sistema. No representan código implementado ni reemplazan las reglas de negocio y los casos de uso.

Si posteriormente se modifica una regla relacionada con rutinas o historia clínica, deberán revisarse estos diagramas para mantener la coherencia documental.