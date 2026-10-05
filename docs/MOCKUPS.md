# Mockups — Gym Manager

## Descripción

Mockups de baja fidelidad de las pantallas principales del sistema, pensados para ilustrar la disposición de la información descrita en `MODULOS.md` y `CASOS_DE_USO.md`. No definen diseño visual final (colores, tipografía, branding), que se trabajará en la etapa de desarrollo.

---

## 1. Inicio de sesión

![Login](mockups/01_login.png)

Pantalla de acceso para Administrador, Entrenador y Cliente con cuenta (CU-01), con opción de recuperar contraseña (CU-02).

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

Formulario de carga/edición de historia clínica. El panel de permisos refleja el control de acceso definido en `docs/SEGURIDAD.md` (Cliente: la propia; Administrador/Entrenador: cualquier cliente; otros clientes: sin acceso).

---

## 5. Gestión de Turnos y Pagos

![Turnos y Pagos](mockups/05_turnos_pagos.png)

Panel del Administrador/Entrenador para crear turnos y registrar pagos (CU-11, CU-12, CU-13), incluyendo el registro de auditoría (`usuarioRegistroId`).