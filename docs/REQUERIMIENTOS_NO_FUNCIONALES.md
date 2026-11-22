# Requerimientos No Funcionales — Gym Manager

**Proyecto:** Gym Manager · Grupo 101  
**Documento:** Especificación de requerimientos no funcionales  
**Versión:** 1.1 — MVP
**Alcance:** atributos de calidad y criterios de verificación del MVP

## 1. Propósito

Este documento especifica restricciones y atributos de calidad del sistema Gym Manager. Los identificadores `RNF-XXX` se usarán en la matriz de trazabilidad. Los requerimientos funcionales se describen exclusivamente en `REQUERIMIENTOS_FUNCIONALES.md`; las reglas de negocio permanecen en `REGLAS_DE_NEGOCIO.md`.

## 2. Alcance y convenciones

Los requisitos de esta versión se basan en la arquitectura y las decisiones documentadas: frontend web, backend Node.js (servidor http nativo, sin frameworks externos), API REST y persistencia MongoDB mediante el driver oficial. Los requisitos distinguen controles verificables y metas cuantitativas. Un objetivo documentado no representa un resultado medido.

- **Verificable:** puede revisarse por inspección, configuración o prueba.
- Las medidas de seguridad aquí descritas corresponden al diseño esperado; su cumplimiento debe comprobarse en la implementación y el entorno desplegado.

## 3. Requerimientos no funcionales

### 3.1 Seguridad, autenticación y autorización

| ID | Categoría | Requerimiento no funcional | Verificación |
|---|---|---|---|
| RNF-001 | Autenticación | Las contraseñas no deberán almacenarse en texto plano; deberán persistirse como hashes generados con un mecanismo de hashing seguro y salt. La implementación utiliza `bcryptjs` con costo 12. | Inspeccionar el mecanismo usado y comprobar que el dato persistido no es la contraseña original. |
| RNF-002 | Autorización | Los permisos deberán validarse en el backend para cada endpoint protegido; ocultar controles en la interfaz no se considerará suficiente. | Probar peticiones directas a endpoints con roles permitidos y no permitidos. |
| RNF-003 | Sesión | Los tokens de autenticación deberán tener vencimiento y el backend deberá rechazar tokens expirados o inválidos. | Pruebas de token válido, vencido, malformado y ausente. |
| RNF-004 | Privacidad | El acceso a la historia clínica deberá comprobar tanto el rol del actor como la titularidad del registro cuando actúe un cliente. | Intentar consultar o modificar la historia propia y la de otro cliente con distintos roles. |
| RNF-005 | Minimización de datos | La historia clínica se limitará a antecedentes, lesiones y observaciones relevantes para el entrenamiento; no se deberán requerir datos o adjuntos médicos fuera del alcance aprobado. | Revisar formularios, modelo y contratos de API. |
| RNF-006 | Exposición de datos | La información clínica no deberá incluirse en respuestas generales de clientes destinadas a operaciones que no requieran esa información. | Inspeccionar respuestas de listados, turnos y perfiles no clínicos. |
| RNF-007 | Transporte seguro | En el entorno desplegado, la comunicación entre navegador/frontend y backend deberá realizarse mediante HTTPS. | Verificar URLs, certificado y ausencia de tráfico HTTP no seguro en el entorno publicado. |
| RNF-008 | Secretos | Las contraseñas de base de datos y demás secretos de entorno no deberán quedar hardcodeadas ni versionadas en el repositorio; deberán configurarse mediante variables de entorno o un mecanismo de secretos. | Revisar configuración y buscar credenciales expuestas en el repositorio. |
| RNF-009 | Acceso a base de datos | El acceso a MongoDB deberá requerir autenticación y configurarse con permisos y restricciones de red acordes al entorno desplegado. | Revisar usuarios, roles y configuración de acceso a la base de datos. |

### 3.2 Integridad y persistencia

| ID | Categoría | Requerimiento no funcional | Verificación |
|---|---|---|---|
| RNF-010 | Integridad | La unicidad de `usuarios.email`, `clientes.dni` y `ejercicios.codigo`, así como la asociación uno a uno entre usuario y cliente, deberá estar protegida por índices/restricciones en la base de datos y no depender solamente de validaciones de interfaz. | Inspeccionar los índices activos y probar duplicados en un entorno controlado; cotejar el script antes de aplicarlo. |
| RNF-011 | Precisión monetaria | Los importes de pagos deberán persistirse con `Decimal128` y no con un tipo de punto flotante que introduzca errores de precisión monetaria. | Inspeccionar el tipo persistido y probar la conversión de montos. |
| RNF-012 | Consistencia | Las operaciones que cambien la rutina vigente o actualicen el estado de un pago deberán respetar las reglas definidas en `REGLAS_DE_NEGOCIO.md`. | Ejecutar las pruebas funcionales que cubran los estados anteriores y posteriores a la operación. |

### 3.3 Arquitectura, interoperabilidad y mantenibilidad

| ID | Categoría | Requerimiento no funcional | Verificación |
|---|---|---|---|
| RNF-013 | Separación de responsabilidades | El frontend no deberá conectarse directamente a MongoDB; las operaciones persistentes pasarán por la API backend. | Inspección de arquitectura y configuración del frontend. |
| RNF-014 | Modularidad | El backend deberá separar controladores, servicios comunes, acceso a MongoDB y autorización según la arquitectura documentada. El acceso a datos utiliza el driver desde los controladores y db.ts. | Revisión de módulos, funciones e importaciones. |
| RNF-015 | Interoperabilidad | La comunicación de la aplicación web con el backend se realizará mediante una API REST con intercambio de datos en JSON. | Inspeccionar endpoints y verificar contratos de solicitudes/respuestas. |
| RNF-016 | Configuración | Las cadenas de conexión y variables del backend deberán configurarse por entorno. La demostración sirve frontend y API desde el mismo origen HTTPS; un alojamiento separado requeriría definir sus orígenes autorizados. | Revisar configuración de entorno, origen de la demostración, HTTPS y atributos de la cookie. |
| RNF-017 | Documentación | Los documentos de requisitos, reglas, casos de uso, arquitectura, seguridad y trazabilidad deberán usar identificadores coherentes y referenciarse entre sí sin mantener copias divergentes de la misma definición. | Revisión cruzada de documentos y de la matriz. |

### 3.4 Usabilidad y operación

| ID | Categoría | Requerimiento no funcional | Verificación |
|---|---|---|---|
| RNF-018 | Acceso móvil | Las funciones previstas para clientes deberán poder utilizarse desde un navegador móvil, en particular la consulta de rutina y turno desde el perfil. | Pruebas de interfaz en tamaños de pantalla móviles y escritorio. |
| RNF-019 | Usabilidad | Los formularios deberán identificar los campos requeridos y comunicar errores de validación sin depender únicamente del color. | Pruebas manuales de formularios y revisión de mensajes de error. |
| RNF-020 | Rendimiento | Las operaciones principales (inicio de sesión, consulta de rutina, consulta de turno, registro de pago) deberán responder en menos de 2 segundos bajo condiciones normales de uso, con hasta 20 usuarios concurrentes. | Medir tiempos de respuesta de los casos de prueba seleccionados bajo la carga simulada definida. |
| RNF-021 | Disponibilidad | El sistema deberá estar disponible al menos el 95% del tiempo durante el período de evaluación académica, permitiendo ventanas de mantenimiento programado fuera del horario habitual de uso del gimnasio. No se define un plan de recuperación ante desastres (RTO/RPO), dado el alcance académico del proyecto. | Verificar mediante el registro de disponibilidad del hosting elegido durante el período de evaluación. |

## 4. Interpretación de los objetivos

RNF-020 define un objetivo de respuesta inferior a dos segundos con hasta veinte usuarios concurrentes y RNF-021 una disponibilidad del 95 % durante la evaluación académica. Se expresan como metas: no se publican en este documento resultados de medición que certifiquen su cumplimiento.

La demostración utiliza Render. El acceso a Atlas, la protección de secretos, HTTPS y los atributos de las cookies forman parte de la configuración operativa. Los requisitos de calidad se verifican en el entorno y las condiciones de uso correspondientes, conforme a la [matriz de trazabilidad](MATRIZ_DE_TRAZABILIDAD.md).

## 5. Relación con otros documentos

- `REQUERIMIENTOS_FUNCIONALES.md`: funciones del sistema, con identificadores `RF-XXX`.
- `REGLAS_DE_NEGOCIO.md`: reglas del dominio, con identificadores `RN-XX`.
- `CASOS_DE_USO.md`: flujos e interacciones, con identificadores `CU-XX`.
- `SEGURIDAD.md`: diseño de los controles de autenticación, autorización e historia clínica.
- `MATRIZ_DE_TRAZABILIDAD.md`: vínculos entre los identificadores y las verificaciones previstas.
