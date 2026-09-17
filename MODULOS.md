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

---

## 3. Catálogo de Ejercicios

Administra el catálogo genérico de ejercicios que los entrenadores usan para armar rutinas.

**Colecciones:** `ejercicios`.

**Funcionalidades principales:**
- Alta, modificación y baja lógica de ejercicios.
- Identificación de cada ejercicio por `codigo` (además del `_id` de Mongo).
- Búsqueda y filtrado (por ejemplo, por grupo muscular).

---

## 4. Rutinas

Gestiona la creación y asignación de rutinas de entrenamiento a los clientes, con historial acotado.

**Colecciones / subdocumentos:** `clientes.rutinas[]`, con referencias a `ejercicios`.

**Funcionalidades principales:**
- Creación de una rutina seleccionando ejercicios del catálogo (series, repeticiones, peso, orden, observaciones).
- Asignación de la rutina a un cliente.
- Al asignar una rutina nueva, baja lógica de la anterior (`activo: false`, `fechaBaja`) y límite de historial de 12 rutinas por cliente.
- Consulta de la rutina vigente desde el perfil del cliente.
- Impresión de la rutina para clientes sin cuenta.

---

## 5. Historia Clínica

Gestiona la información básica de salud del cliente.

**Colecciones / subdocumentos:** `clientes.historiaClinica`.

**Funcionalidades principales:**
- Carga inicial de antecedentes al registrarse (clientes con cuenta).
- Actualización de lesiones si el cliente sufre una nueva.
- Acceso restringido: solo Administrador y Entrenador pueden consultarla, no es visible para otros clientes.