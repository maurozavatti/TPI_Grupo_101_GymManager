# Diagramas de Secuencia — Gym Manager

## 1. Carga y consulta de historia clínica

**Casos de uso:** CU-09 y CU-10.

El diagrama representa el recorrido desde la solicitud del usuario hasta la autorización y el acceso a los datos. Los participantes representan el frontend, las funciones de sesión, el controlador y MongoDB; no implican clases adicionales. Los diagramas se presentan como bloques Mermaid, visibles directamente en GitHub.

[Ver diagrama en PNG](diagramas/secuencia_01_historia_clinica.png)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant F as Frontend
    participant S as Funciones de sesión
    participant C as Controlador de historia clínica
    participant P as Validaciones del controlador historia.ts
    participant DB as MongoDB

    U->>F: Solicitar carga o consulta
    F->>S: Enviar solicitud autenticada
    S->>S: Comprobar hash del token, vencimiento y cuenta activa
    alt Token inválido o ausente
        S-->>F: Rechazar acceso
        F-->>U: Mostrar error de autenticación
    else Usuario autenticado
        S->>C: Autorizar solicitud
        C->>P: Solicitar operación sobre cliente objetivo
        P->>P: Validar rol y titularidad del registro
        alt Usuario sin permisos
            P-->>C: Acceso denegado
            C-->>F: Respuesta de error
            F-->>U: Mostrar acceso denegado
        else Usuario autorizado
            alt Cargar o actualizar historia
                P->>DB: Guardar historiaClinica, fecha y usuario de modificación
                DB-->>P: Confirmación
                P-->>C: Operación completada
            else Consultar historia
                P->>DB: Consultar historia del cliente autorizado
                DB-->>P: Datos clínicos
                P-->>C: Resultado de consulta
            end
            C-->>F: Respuesta de la operación
            F-->>U: Mostrar resultado
        end
    end
```

**Consideraciones:**

- La autenticación no reemplaza la validación de titularidad de la historia clínica.
- El administrador y el entrenador pueden operar sobre clientes autorizados por las reglas del proyecto.
- Un cliente con cuenta solo puede acceder a su propia historia clínica.
- La historia clínica es opcional, de acuerdo con RN-05.

## 2. Asignación de rutina

**Caso de uso:** CU-07 — Asignar rutina a cliente.

El flujo contempla las validaciones previas, la desactivación de la rutina anterior y la aplicación del límite de historial.

[Ver diagrama en PNG](diagramas/secuencia_02_asignacion_rutina.png)

```mermaid
sequenceDiagram
    actor T as Administrador o entrenador
    participant F as Frontend
    participant C as Controlador de rutinas
    participant S as Lógica de rutinas.ts
    participant DB as MongoDB

    T->>F: Seleccionar cliente y ejercicios
    F->>C: Solicitar asignación de rutina
    C->>C: Exigir sesión y ADMIN o ENTRENADOR
    C->>S: Validar asignación y ejecutar transacción
    S->>DB: Consultar cliente y estado
    DB-->>S: Datos del cliente

    alt Cliente inexistente o inactivo
        S-->>C: Rechazar asignación
        C-->>F: Error de validación
        F-->>T: Mostrar error
    else Cliente válido
        S->>DB: Verificar ejercicios activos
        DB-->>S: Resultado de validación

        alt Ejercicios inválidos
            S-->>C: Rechazar asignación
            C-->>F: Error de validación
            F-->>T: Mostrar error
        else Ejercicios válidos
            S->>DB: Consultar rutinas del cliente
            DB-->>S: Rutinas actuales

            S->>S: Preparar historial, desactivar anterior y agregar nueva
            S->>S: Si supera 12, retirar la inactiva más antigua
            S->>DB: Actualizar array de rutinas en la transacción
            DB-->>S: Confirmación
            S-->>C: Asignación completada
            C-->>F: Resultado exitoso
            F-->>T: Mostrar rutina asignada
        end
    end
```

**Consideraciones:**

- La operación debe garantizar que no queden dos rutinas activas para el mismo cliente.
- Solo se elimina físicamente la rutina inactiva más antigua cuando se alcanzó el límite de 12.
- Las modificaciones del historial se preparan en memoria y se guardan en una actualización dentro de la transacción de MongoDB.

## 3. Detección de cuotas vencidas

**Caso de uso:** CU-14 — Detectar cuotas vencidas.

La consulta administrativa de pagos actualiza los pendientes vencidos antes de devolver el listado. No existe un programador periódico en esta versión.

[Ver diagrama en PNG](diagramas/secuencia_03_cuotas_vencidas.png)

```mermaid
sequenceDiagram
    actor A as Administrador
    participant F as Frontend
    participant C as pagos.ts
    participant S as Funciones de sesión y permisos
    participant DB as MongoDB
    A->>F: Consultar pagos
    F->>C: GET /api/pagos
    C->>S: Exigir sesión y rol ADMIN
    alt Sin sesión o permiso
        S-->>C: Error 401 o 403
        C-->>F: Rechazar consulta
    else Acceso permitido
        C->>DB: Actualizar PENDIENTE con vencimiento pasado a VENCIDO
        DB-->>C: Actualización terminada
        C->>DB: Consultar listado y filtro por cliente
        DB-->>C: Pagos
        C-->>F: Respuesta JSON
        F-->>A: Mostrar estados
    end
```

**Consideraciones:**

- Una obligación PAGADO conserva su estado aunque pase su fecha de vencimiento.
- Registrar una cuota nueva no cancela una obligación anterior.
- El resumen consulta vencidos y próximos vencimientos para sus indicadores; no ejecuta un proceso periódico ni genera cuotas nuevas.
