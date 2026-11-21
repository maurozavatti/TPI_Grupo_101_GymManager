# Mockups — Gym Manager

## Descripción

Mockups de baja fidelidad de las pantallas principales del sistema, pensados para ilustrar la disposición de la información descrita en `MODULOS.md` y `CASOS_DE_USO.md`. Son referencias conceptuales de diseño, no capturas de la interfaz implementada. Los permisos y el alcance del MVP se describen en este texto y en los requisitos.

---

## 1. Inicio de sesión

![Login](mockups/01_login.png)

Pantalla de acceso para las cuentas con ADMIN, ENTRENADOR y/o USUARIO (CU-01). La opción de recuperación mostrada en la imagen pertenece al diseño anterior y queda fuera del MVP. El registro público y el cambio de contraseña autenticado se describen en CU-22 y CU-03.

---

## 2. Dashboard del Administrador

![Dashboard](mockups/02_dashboard_admin.png)

Vista consolidada con los indicadores definidos en el Módulo 8: clientes activos, cuotas vencidas, ocupación de turnos e ingresos del mes (CU-15).

---

## 3. Perfil del Cliente

![Perfil Cliente](mockups/03_perfil_cliente.png)

Vista del cliente con cuenta: su rutina vigente, su turno asignado, y acceso a su historia clínica (CU-08, CU-09).

---

## 4. Historia Clínica

![Historia Clínica](mockups/04_historia_clinica.png)

Formulario de carga/edición de historia clínica. El alcance vigente se describe en [SEGURIDAD.md](SEGURIDAD.md) (Cliente: la propia; Administrador/Entrenador: cualquier cliente; otros clientes: sin acceso).

---

## 5. Gestión de Turnos y Pagos

![Turnos y Pagos](mockups/05_turnos_pagos.png)

La imagen reúne turnos y pagos como referencia inicial. La implementación utiliza pantallas diferenciadas. ADMIN administra todos los turnos y pagos; ENTRENADOR gestiona sus turnos y carece de acceso a Pagos. Se conserva la auditoría del registro (`usuarioRegistroId`).
