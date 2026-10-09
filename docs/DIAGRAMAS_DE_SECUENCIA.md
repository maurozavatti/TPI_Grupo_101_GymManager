# Diagramas de Secuencia — Gym Manager

## 1. Carga y consulta de historia clínica

**Casos de uso:** CU-09 y CU-10.

El diagrama representa el recorrido desde la solicitud del usuario hasta la autorización y el acceso a los datos. Los nombres de los componentes son conceptuales y deberán adaptarse a las clases y controladores que se implementen.

```text
sequenceDiagram
    actor U as Usuario
    participant F as Frontend
    participant S as Spring Security
    participant C as Controlador de historia clínica
    participant P as Servicio de historia clínica
    participant DB as MongoDB

    U->>F: Solicitar carga o consulta
    F->>S: Enviar solicitud autenticada
    S->>S: Validar token y rol
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
                P->>DB: Guardar historiaClinica y fecha de actualización
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

```text
sequenceDiagram
    actor T as Entrenador
    participant F as Frontend
    participant C as Controlador de rutinas
    participant S as Servicio de rutinas
    participant DB as MongoDB

    T->>F: Seleccionar cliente y ejercicios
    F->>C: Solicitar asignación de rutina
    C->>S: asignarRutina(clienteId, ejercicios)
    S->>DB: Consultar cliente y estado
    DB-->>S: Datos del cliente

    alt Cliente inexistente o inactivo
        S-->>C: Rechazar asignación
        C-->>F: Error de validación
        F-->>T: Mostrar error
    else Cliente válido
        S->>DB: Verificar existencia de ejercicios
        DB-->>S: Resultado de validación

        alt Ejercicios inválidos
            S-->>C: Rechazar asignación
            C-->>F: Error de validación
            F-->>T: Mostrar error
        else Ejercicios válidos
            S->>DB: Consultar rutinas del cliente
            DB-->>S: Rutinas actuales

            opt Existe una rutina activa
                S->>DB: Marcar rutina anterior como inactiva
                S->>DB: Registrar fecha de baja
            end

            opt Se alcanzó el límite de 12 rutinas
                S->>DB: Eliminar la rutina inactiva más antigua
            end

            S->>DB: Guardar nueva rutina activa
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
- Los nombres de métodos y componentes son ilustrativos; no implican que esas clases ya estén implementadas.

## 3. Detección de cuotas vencidas

**Caso de uso:** CU-14 — Detectar cuotas vencidas.

Este diagrama representa un proceso automático que se ejecuta periódicamente, sin necesidad de que el administrador inicie manualmente la evaluación.

```text
sequenceDiagram
    participant CRON as Programador periódico
    participant S as Servicio de pagos
    participant DB as MongoDB
    actor A as Administrador
    participant F as Frontend
    participant C as Controlador de pagos

    CRON->>S: Ejecutar evaluación de vencimientos
    S->>DB: Obtener cuotas que deben evaluarse
    DB-->>S: Cuotas registradas

    loop Por cada cuota
        S->>S: Evaluar vencimiento y estado de pago
        alt Venció y continúa impaga
            S->>DB: Actualizar estado a VENCIDO
            DB-->>S: Confirmar actualización
        else No corresponde marcarla vencida
            S->>S: Mantener el estado correspondiente
        end
    end

    A->>F: Consultar cuotas vencidas
    F->>C: Solicitar listado de cuotas vencidas
    C->>S: Consultar cuotas vencidas
    S->>DB: Buscar obligaciones con estado VENCIDO
    DB-->>S: Resultado de la consulta
    S-->>C: Listado de cuotas vencidas
    C-->>F: Respuesta con resultados
    F-->>A: Mostrar cuotas vencidas
```

**Consideraciones:**

- El proceso periódico debe ejecutarse con una frecuencia que se defina durante la implementación.
- El sistema no debe marcar como vencida una obligación que ya fue pagada.
- Los indicadores de próximos vencimientos del dashboard son una consulta distinta, correspondiente a CU-15 y RN-13.
