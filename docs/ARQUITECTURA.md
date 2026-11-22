# Arquitectura — Gym Manager

## Visión general

Gym Manager organiza el MVP en tres capas: presentación web, API HTTP y persistencia. El navegador consume JSON de la API y el backend accede a MongoDB mediante su driver oficial.

```
┌────────────────┐      HTTPS / JSON      ┌──────────────────┐      Driver Mongo     ┌──────────────────┐
│    FRONTEND     │  ───────────────────▶  │      BACKEND      │  ──────────────────▶  │   BASE DE DATOS   │
│ HTML/CSS/TS +   │  ◀───────────────────  │     Node.js        │  ◀──────────────────  │  MongoDB (Atlas)  │
│      Vite       │      API REST          │  (servidor http)   │                       │                    │
└────────────────┘                        └──────────────────┘                       └──────────────────┘
```

- **Frontend:** aplicación web (HTML, CSS, TypeScript, construida con Vite) que consume la API del backend. No accede a la base de datos de forma directa.
- **Backend:** API REST desarrollada en Node.js, usando el módulo `http` nativo (sin un framework externo como Express). Concentra la lógica de negocio (autenticación y roles, gestión de clientes, rutinas, turnos, pagos, historia clínica) y es el único componente con acceso a la base de datos.
- **Base de datos:** MongoDB Atlas, base `gym_manager`, con siete colecciones. Rutinas e historia clínica se embeben en `clientes`. El modelo se describe en [ESQUEMA_NOSQL.md](ESQUEMA_NOSQL.md).

## Capas dentro del backend

- **Controladores:** exponen los endpoints REST, leen y validan la entrada de cada request.
- **Servicios:** reúnen funciones reutilizables de autenticación, contraseñas, roles, permisos y entrega de archivos. Las reglas específicas de rutinas, clientes, turnos y pagos residen en los controladores correspondientes.
- **Acceso a datos:** `db.ts` comparte un `MongoClient` y ofrece `ejecutarTransaccion`. Los controladores usan el driver `mongodb`. La validación de entrada se complementa con validadores e índices de MongoDB.
- **Autenticación y sesiones:** funciones invocadas por los controladores verifican la cookie, el vencimiento, la cuenta activa y sus roles actuales. `usuarios.rol` se modela como arreglo no vacío de `ADMIN`, `ENTRENADOR` y/o `USUARIO`. Las contraseñas se hashean con `bcryptjs`.

## Comunicación

La demostración entrega frontend y API desde un servicio de Render y el mismo origen HTTPS. El backend sirve los archivos de `frontend/dist` y deriva las peticiones `/api` a los controladores. El equipo selecciona manualmente las versiones a desplegar. La URL es [gymmanager-grupo-101.onrender.com](https://gymmanager-grupo-101.onrender.com/).

Durante el desarrollo local, Vite reenvía `/api` a `http://localhost:3000` mediante su proxy. La web compilada también puede ejecutarse junto con la API desde Node.js. Los comandos están en los README de [frontend](../frontend/README.md) y [backend](../backend/README.md).

El navegador administra la cookie `gymmanager_sesion`. El backend guarda únicamente el hash SHA-256 del token en `sesiones`, con una duración de ocho horas. Los roles y el estado activo se consultan en la cuenta en cada petición protegida. El índice TTL permite limpiar sesiones vencidas y la autorización comprueba explícitamente su vencimiento.

## Justificación de las decisiones

El detalle de por qué se eligió cada tecnología (Node.js, MongoDB, Vite) está documentado en la Sección 12 del [README principal](../README.md). El [diagrama de despliegue](DIAGRAMA_DE_DESPLIEGUE.md) y [SEGURIDAD.md](SEGURIDAD.md) completan esta descripción.
