# Diagrama de Despliegue — Gym Manager

## 1. Objetivo

El diagrama representa la distribución prevista de los componentes de Gym Manager y sus comunicaciones.

Se utiliza una representación independiente del proveedor de hosting porque la infraestructura definitiva todavía no fue seleccionada.

## 2. Diagrama

```text
flowchart TB
    U["Usuario<br/>Navegador web"]

    subgraph CLIENTE["Entorno del cliente"]
        FE["Frontend<br/>HTML, CSS y TypeScript<br/>Aplicación web compilada con Vite"]
    end

    subgraph HOSTING["Infraestructura de despliegue"]
        WEB["Servicio de hosting del frontend<br/>Proveedor por definir"]
        API["Servidor de aplicaciones<br/>Java / Spring Boot"]
        SEC["Spring Security<br/>Autenticación y autorización"]
        REST["API REST<br/>Controladores y servicios"]
        DATA["Spring Data MongoDB"]
    end

    subgraph PERSISTENCIA["Persistencia"]
        DB["MongoDB Atlas<br/>Base de datos documental"]
    end

    U -->|"HTTPS"| WEB
    WEB --> FE
    FE -->|"HTTPS / JSON"| SEC
    SEC --> REST
    REST --> DATA
    DATA -->|"Conexión segura"| DB
```

## 3. Nodos y responsabilidades

| Nodo | Responsabilidad |
|---|---|
| Navegador web | Permite al usuario utilizar el sistema. |
| Hosting del frontend | Publica la aplicación web compilada. El proveedor queda pendiente de definición. |
| Frontend | Presenta las pantallas y consume los endpoints de la API REST. |
| Servidor Spring Boot | Ejecuta la lógica del backend y expone los servicios del sistema. |
| Spring Security | Gestiona autenticación y autorización según la configuración implementada. |
| Controladores y servicios REST | Procesan solicitudes, validan reglas de negocio y coordinan las operaciones. |
| Spring Data MongoDB | Facilita el acceso a los documentos almacenados. |
| MongoDB Atlas | Aloja la base de datos documental del sistema. |

## 4. Comunicaciones

- **Usuario → frontend:** acceso a la aplicación mediante navegador.
- **Frontend → backend:** solicitudes HTTP sobre HTTPS, con intercambio de datos en formato JSON.
- **Backend → base de datos:** acceso a MongoDB mediante una conexión configurada de forma segura.

## 5. Consideraciones de despliegue y seguridad

1. El frontend y el backend podrán alojarse en servicios diferentes.
2. La API deberá admitir únicamente los orígenes autorizados mediante la configuración CORS correspondiente.
3. Las credenciales y cadenas de conexión deberán almacenarse como variables de entorno o secretos del entorno de ejecución, no dentro del código fuente.
4. El acceso a MongoDB Atlas deberá restringirse mediante los mecanismos de red y autenticación que se definan para el despliegue.
5. El backend deberá validar el token y los permisos de cada operación protegida; ocultar una pantalla en el frontend no constituye una autorización suficiente.
6. El proveedor concreto, los dominios, las regiones y la configuración de red quedan pendientes de decisión.

## 6. Relación con la arquitectura

Este diagrama complementa `ARQUITECTURA.md`: representa dónde se ejecutan los componentes y cómo se comunican, mientras que el documento de arquitectura explica su organización y responsabilidades.
