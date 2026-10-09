# Diagramas de secuencia — Gym Manager

Los diagramas de secuencia representan las interacciones previstas entre los actores, el frontend, la API REST, los servicios de negocio y MongoDB.

Se basan en la arquitectura documentada del proyecto: frontend web, backend Java con Spring Boot y persistencia mediante MongoDB.

## 1. Consulta de historia clínica

**Referencias:** CU-10, RN-05 y RN-06.  
**Documentos relacionados:** `SEGURIDAD.md` y `ARQUITECTURA.md`.

```text
sequenceDiagram
    actor Usuario as Usuario autenticado
    participant FE as Frontend
    participant API as API REST / Controller
    participant SEC as Seguridad JWT
    participant SRV as Servicio de historia clínica
    participant DB as MongoDB

    Usuario->>FE: Solicita consultar una historia clínica
    FE->>API: Solicitud GET con clienteId y JWT
    API->>SEC: Validar token, identidad y rol

    alt Token ausente, inválido o vencido
        SEC-->>API: Autenticación rechazada
        API-->>FE: Respuesta de acceso no autenticado
        FE-->>Usuario: Solicitar inicio de sesión
    else Token válido
        SEC-->>API: Identidad y rol autenticados
        API->>SEC: Verificar autorización

        alt Rol ADMIN o ENTRENADOR con permiso
            SEC-->>API: Acceso autorizado
        else Rol USUARIO
            SEC->>SRV: Resolver cliente vinculado a la cuenta
            SRV-->>SEC: Identificador del cliente propio

            alt El cliente solicitado es el propio
                SEC-->>API: Acceso autorizado
            else El cliente solicitado es otro
                SEC-->>API: Acceso denegado
                API-->>FE: Respuesta de autorización denegada
                FE-->>Usuario: Informar falta de permisos
            end
        end

        opt Operación autorizada
            API->>SRV: Consultar historia clínica del cliente
            SRV->>DB: Buscar cliente e historiaClinica embebida
            DB-->>SRV: Documento del cliente

            alt Existe historia clínica
                SRV-->>API: Datos de historia clínica
                API-->>FE: Respuesta con datos autorizados
                FE-->>Usuario: Mostrar historia clínica
            else No existe historia clínica
                SRV-->>API: Sin historia clínica registrada
                API-->>FE: Resultado sin historia clínica
                FE-->>Usuario: Informar que no hay datos registrados
            end
        end
    end
```

### Consideraciones de seguridad

- El frontend envía el token de autenticación, pero la autorización efectiva corresponde al backend.
- El backend debe obtener la identidad del usuario desde el contexto autenticado.
- Para el rol `USUARIO`, debe comprobarse que el `clienteId` solicitado coincida con el cliente vinculado a esa cuenta.
- La historia clínica está embebida en el documento de `clientes`, según el esquema documentado. Por lo tanto, el diagrama no introduce una colección independiente para las historias clínicas.
- Los detalles de las respuestas HTTP deben ajustarse a la convención de errores que se defina al implementar la API.

## 2. Asignación de una rutina

**Referencias:** CU-07, RN-03 y RN-04.  
**Módulo:** Rutinas.

```text
sequenceDiagram
    actor Entrenador
    participant FE as Frontend
    participant API as API REST / Controller
    participant SEC as Seguridad
    participant SRV as Servicio de rutinas
    participant DB as MongoDB

    Entrenador->>FE: Completa los datos de la rutina
    FE->>API: Solicitud de asignación con JWT
    API->>SEC: Validar identidad y permisos

    alt El usuario no tiene permisos
        SEC-->>API: Acceso denegado
        API-->>FE: Respuesta de autorización denegada
        FE-->>Entrenador: Informar falta de permisos
    else El usuario tiene permisos
        SEC-->>API: Operación autorizada
        API->>SRV: Solicitar asignación de rutina
        SRV->>SRV: Validar datos y reglas de negocio
        SRV->>DB: Consultar el documento del cliente
        DB-->>SRV: Datos del cliente y sus rutinas

        SRV->>SRV: Desactivar la rutina activa anterior, si existe

        alt El historial ya tiene 12 rutinas
            SRV->>SRV: Identificar la rutina inactiva más antigua

            alt Existe una rutina inactiva elegible
                SRV->>SRV: Retirar la rutina inactiva más antigua
            else No existe una rutina inactiva elegible
                SRV-->>API: No se puede cumplir la regla del historial
                API-->>FE: Informar error de negocio
                FE-->>Entrenador: Informar que no se pudo asignar la rutina
            end
        end

        opt Las validaciones permiten continuar
            SRV->>SRV: Agregar la nueva rutina como activa
            SRV->>DB: Guardar los cambios del cliente

            alt Guardado correcto
                DB-->>SRV: Confirmación de persistencia
                SRV-->>API: Asignación realizada
                API-->>FE: Respuesta exitosa
                FE-->>Entrenador: Confirmar la asignación
            else Error de persistencia
                DB-->>SRV: Error al guardar
                SRV-->>API: Operación no confirmada
                API-->>FE: Informar fallo
                FE-->>Entrenador: Informar que no se confirmó la asignación
            end
        end
    end
```

### Consideraciones de implementación

La desactivación de la rutina anterior, la eventual eliminación de una rutina inactiva y el agregado de la nueva rutina deben diseñarse para evitar estados inconsistentes.

La estrategia técnica para garantizar la atomicidad de la operación deberá definirse durante la implementación. El diagrama no presupone que esa solución ya esté programada.

## 3. Relación con la arquitectura

En ambos diagramas se conserva la separación de responsabilidades:

- **Frontend:** presenta la interfaz y envía las solicitudes.
- **API REST / Controller:** recibe las solicitudes y devuelve las respuestas.
- **Seguridad:** valida la autenticación y los permisos.
- **Servicio de negocio:** aplica las reglas del sistema.
- **MongoDB:** almacena y devuelve los documentos.

Esta organización mantiene la coherencia con `ARQUITECTURA.md` y no supone que el frontend tenga acceso directo a la base de datos.