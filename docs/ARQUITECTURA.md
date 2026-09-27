# Arquitectura — Gym Manager

## Visión general

Gym Manager sigue una arquitectura de **tres capas** desacopladas, comunicadas por HTTP/JSON:

```
┌────────────────┐      HTTPS / JSON      ┌──────────────────┐      Driver Mongo     ┌──────────────────┐
│    FRONTEND     │  ───────────────────▶  │      BACKEND      │  ──────────────────▶  │   BASE DE DATOS   │
│ HTML/CSS/TS +   │  ◀───────────────────  │  Java + Spring     │  ◀──────────────────  │  MongoDB (Atlas)  │
│      Vite       │      API REST          │      Boot          │                       │                    │
└────────────────┘                        └──────────────────┘                       └──────────────────┘
```

- **Frontend:** aplicación web (HTML, CSS, TypeScript, construida con Vite) que consume la API del backend. No accede a la base de datos de forma directa.
- **Backend:** API REST desarrollada en Java con Spring Boot. Concentra la lógica de negocio (autenticación y roles, gestión de clientes, rutinas, turnos, pagos, historia clínica) y es el único componente con acceso a la base de datos.
- **Base de datos:** MongoDB, con las colecciones descritas en `docs/ESQUEMA_NOSQL.md`. Los scripts de creación de colecciones e índices están en `/database`.

## Capas dentro del backend

- **Controllers:** exponen los endpoints REST y validan la entrada.
- **Services:** contienen la lógica de negocio (por ejemplo, la regla de una sola rutina activa por cliente, o el cálculo de cuotas vencidas).
- **Repositories:** acceso a datos mediante Spring Data MongoDB.
- **Security:** autenticación y control de acceso por rol (`ADMIN`, `ENTRENADOR`, `USUARIO`) mediante Spring Security + JWT.

## Comunicación

El frontend y el backend se despliegan por separado y se comunican exclusivamente mediante una API REST (JSON sobre HTTPS). Esto permite desplegarlos de forma independiente (por ejemplo, frontend en Vercel/Netlify y backend en Render/Cloud Run, como se detalla en el README) y facilita, a futuro, que otros clientes (por ejemplo, una app móvil) consuman la misma API.

## Justificación de las decisiones

El detalle de por qué se eligió cada tecnología (Java + Spring Boot, MongoDB, Vite) está documentado en la Sección 12 del `README.md` del repositorio.
