# Módulos a Desarrollar — Gym Manager

## Descripción

Este documento detalla los módulos funcionales en los que se divide el desarrollo del MVP de **Gym Manager**, en base al esquema de base de datos definido en `ESQUEMA_NOSQL.md` y al alcance definido en el `README.md` del proyecto.

Cada módulo agrupa una responsabilidad concreta del sistema, las colecciones (o subdocumentos) de MongoDB que utiliza, sus funcionalidades principales y los actores que interactúan con él. Esta división permite repartir el desarrollo entre los tres integrantes del equipo con dependencias acotadas entre módulos.

---

## Resumen

| # | Módulo | Colecciones / subdocumentos | Actores |
|---|---|---|---|
| 1 | Autenticación y Roles | `usuarios`, `clientes` (campos de cuenta) | Administrador, Entrenador, Cliente con cuenta |
| 2 | Gestión de Clientes | `clientes` | Administrador |
| 3 | Catálogo de Ejercicios | `ejercicios` | Administrador, Entrenador |
| 4 | Rutinas | `clientes.rutinas[]`, `ejercicios` | Entrenador, Cliente |
| 5 | Historia Clínica | `clientes.historiaClinica` | Cliente, Administrador, Entrenador |
| 6 | Turnos | `turnos`, `clientes`, `usuarios` | Administrador, Entrenador, Cliente |
| 7 | Pagos | `pagos`, `clientes` | Administrador |

---

## 1. Autenticación y Roles

Gestiona el acceso al sistema. Existen tres roles: `ADMIN`, `ENTRENADOR` y `USUARIO` (este último representa a un cliente con cuenta). Cada rol tiene un conjunto distinto de permisos sobre el resto de los módulos.

**Colecciones:** `usuarios`, `clientes` (a través del campo `usuarioId`).

**Funcionalidades principales:**
- Registro e inicio de sesión.
- Validación de credenciales.
- Control de acceso a funcionalidades según el rol.
- Baja lógica de cuentas (`activo`, `fechaBaja`).

---

## 2. Gestión de Clientes

Administra el alta, modificación y baja de los clientes del gimnasio, con o sin cuenta de usuario.

**Colecciones:** `clientes`.

**Funcionalidades principales:**
- Alta de cliente, con o sin cuenta asociada.
- Edición de datos personales y de contacto.
- Baja lógica de clientes (`activo`, `fechaBaja`).
- Vinculación de un cliente sin cuenta con una cuenta nueva, si decide registrarse más adelante.
