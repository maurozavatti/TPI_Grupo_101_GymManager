# Diagrama de despliegue — Gym Manager

## 1. Objetivo

El diagrama representa la distribución lógica de los componentes previstos para Gym Manager y sus comunicaciones.

Como el proveedor definitivo de hosting del frontend y del backend todavía no está confirmado, el diagrama no asigna servicios concretos a proveedores específicos. MongoDB Atlas se muestra como la base de datos prevista en la documentación de arquitectura.

## 2. Diagrama de despliegue

```text
flowchart TB
    subgraph CLIENTE["Dispositivo del usuario"]
        NAV["Navegador web"]
    end

    subgraph FRONTEND["Hosting del frontend — proveedor por definir"]
        FE["Frontend web<br/>HTML, CSS y TypeScript<br/>Vite como herramienta de construcción"]
    end

    subgraph BACKEND["Servidor de aplicación — proveedor por definir"]
        API["Backend Java<br/>Spring Boot"]
        SEC["Spring Security<br/>Autenticación y autorización JWT"]
        CTRL["Controladores REST"]
        SRV["Servicios de negocio"]
        REPO["Repositorios<br/>Spring Data MongoDB"]

        API --> CTRL
        API --- SEC
        CTRL --> SRV
        SRV --> REPO
    end

    subgraph DATOS["Servicio de base de datos"]
        DB["MongoDB Atlas"]
        COL["Colecciones<br/>usuarios<br/>clientes<br/>ejercicios<br/>turnos<br/>pagos"]
        DB --- COL
    end

    NAV -->|"HTTPS: carga de la aplicación"| FE
    FE -->|"HTTPS / JSON: API REST"| API
    REPO -->|"Conexión segura"| DB
```

## 3. Componentes del despliegue

| Componente | Responsabilidad | Tecnología prevista |
|---|---|---|
| Navegador web | Permite que los usuarios interactúen con el sistema. | Navegador compatible con la aplicación web. |
| Frontend | Presenta las pantallas y consume la API REST. | HTML, CSS, TypeScript y Vite. |
| Hosting del frontend | Publica los recursos estáticos de la aplicación. | Proveedor pendiente de definición. |
| Backend | Procesa solicitudes, aplica las reglas de negocio y expone la API. | Java y Spring Boot. |
| Seguridad | Gestiona la autenticación y los permisos por rol y titularidad. | Spring Security y JWT, según el diseño documentado. |
| Persistencia | Permite que el backend consulte y guarde los documentos del sistema. | Spring Data MongoDB. |
| Base de datos | Almacena los datos de usuarios, clientes, ejercicios, turnos y pagos. | MongoDB Atlas, previsto en la arquitectura. |

## 4. Comunicaciones y seguridad

- El navegador carga la aplicación desde el hosting del frontend.
- El frontend se comunica con el backend mediante solicitudes HTTPS a la API REST, intercambiando datos en formato JSON.
- El backend es responsable de validar las solicitudes, aplicar las reglas de negocio y comprobar los permisos.
- El backend se conecta a MongoDB mediante el mecanismo de acceso a datos definido para la aplicación.
- El frontend no debe conectarse directamente a MongoDB ni contener credenciales de acceso a la base de datos.
- Las credenciales, claves y demás secretos deben mantenerse del lado del servidor mediante configuración segura.
- El despliegue público debe proteger las comunicaciones mediante HTTPS.

## 5. Decisiones pendientes

El diagrama no establece como definitivos:

- el proveedor de hosting del frontend;
- el proveedor de hosting del backend;
- el plan y la configuración final del servicio MongoDB Atlas;
- las variables de entorno y los parámetros específicos del despliegue.

Estas decisiones deberán documentarse cuando el equipo las confirme.

## 6. Relación con la documentación existente

Este diagrama complementa `ARQUITECTURA.md` y `SEGURIDAD.md`. Representa una propuesta de despliegue lógico del MVP y no significa que la aplicación esté implementada, publicada o conectada a servicios productivos.