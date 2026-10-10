# Requerimientos No Funcionales — Gym Manager

**Proyecto:** Gym Manager · Grupo 101  
**Documento:** Especificación de requerimientos no funcionales  
**Versión:** 1.0 — Propuesta para validación del equipo  
**Estado:** Borrador; incluye decisiones pendientes de cuantificar

## 1. Propósito

Este documento especifica restricciones y atributos de calidad del sistema Gym Manager. Los identificadores `RNF-XXX` se usarán en la matriz de trazabilidad. Los requerimientos funcionales se describen exclusivamente en `REQUERIMIENTOS_FUNCIONALES.md`; las reglas de negocio permanecen en `REGLAS_DE_NEGOCIO.md`.

## 2. Alcance y convenciones

Los requisitos de esta versión se basan en la arquitectura y las decisiones documentadas: frontend web, backend Java/Spring Boot, API REST y persistencia MongoDB. Cuando los documentos existentes no definen una métrica o un objetivo cuantitativo, se lo indica como pendiente de aprobación; no se da por acordado un umbral arbitrario.

- **Verificable:** puede revisarse por inspección, configuración o prueba.
- **Pendiente de cuantificar:** el equipo debe definir el valor objetivo antes de la aceptación final.
- Las medidas de seguridad aquí descritas corresponden al diseño esperado; su cumplimiento debe comprobarse en la implementación y el entorno desplegado.

## 3. Requerimientos no funcionales

### 3.1 Seguridad, autenticación y autorización

| ID | Categoría | Requerimiento no funcional | Verificación |
|---|---|---|---|
| RNF-001 | Autenticación | Las contraseñas no deberán almacenarse en texto plano; deberán persistirse como hashes generados con un mecanismo de hashing seguro y salt. `SEGURIDAD.md` propone BCrypt mediante Spring Security. | Inspeccionar el mecanismo usado y comprobar que el dato persistido no es la contraseña original. |
| RNF-002 | Autorización | Los permisos deberán validarse en el backend para cada endpoint protegido; ocultar controles en la interfaz no se considerará suficiente. | Probar peticiones directas a endpoints con roles permitidos y no permitidos. |
| RNF-003 | Sesión | Los tokens de autenticación deberán tener vencimiento y el backend deberá rechazar tokens expirados o inválidos. | Pruebas de token válido, vencido, malformado y ausente. |
| RNF-004 | Privacidad | El acceso a la historia clínica deberá comprobar tanto el rol del actor como la titularidad del registro cuando actúe un cliente. | Intentar consultar o modificar la historia propia y la de otro cliente con distintos roles. |
| RNF-005 | Minimización de datos | La historia clínica se limitará a antecedentes, lesiones y observaciones relevantes para el entrenamiento; no se deberán requerir datos o adjuntos médicos fuera del alcance aprobado. | Revisar formularios, modelo y contratos de API. |
| RNF-006 | Exposición de datos | La información clínica no deberá incluirse en respuestas generales de clientes destinadas a operaciones que no requieran esa información. | Inspeccionar respuestas de listados, turnos y perfiles no clínicos. |
| RNF-007 | Transporte seguro | En el entorno desplegado, la comunicación entre navegador/frontend y backend deberá realizarse mediante HTTPS. | Verificar URLs, certificado y ausencia de tráfico HTTP no seguro en el entorno publicado. |
| RNF-008 | Secretos | Las contraseñas de base de datos, JWT y demás credenciales de entorno no deberán quedar hardcodeadas ni versionadas en el repositorio; deberán configurarse mediante variables de entorno o un mecanismo de secretos. | Revisar configuración y buscar credenciales expuestas en el repositorio. |
| RNF-009 | Acceso a base de datos | El acceso a MongoDB deberá requerir autenticación y configurarse con permisos y restricciones de red acordes al entorno desplegado. | Revisar usuarios, roles y configuración de acceso a la base de datos. |

### 3.2 Integridad y persistencia

| ID | Categoría | Requerimiento no funcional | Verificación |
|---|---|---|---|
| RNF-010 | Integridad | La unicidad de `usuarios.email`, `clientes.dni` y `ejercicios.codigo`, así como la asociación uno a uno entre usuario y cliente, deberá estar protegida por índices/restricciones en la base de datos y no depender solamente de validaciones de interfaz. | Revisar y ejecutar `database/crear_indices.js`; probar valores duplicados. |
| RNF-011 | Precisión monetaria | Los importes de pagos deberán persistirse con `Decimal128` y no con un tipo de punto flotante que introduzca errores de precisión monetaria. | Inspeccionar el tipo persistido y probar la conversión de montos. |
| RNF-012 | Consistencia | Las operaciones que cambien la rutina vigente o actualicen el estado de un pago deberán respetar las reglas definidas en `REGLAS_DE_NEGOCIO.md`. | Ejecutar las pruebas funcionales que cubran los estados anteriores y posteriores a la operación. |

### 3.3 Arquitectura, interoperabilidad y mantenibilidad

| ID | Categoría | Requerimiento no funcional | Verificación |
|---|---|---|---|
| RNF-013 | Separación de responsabilidades | El frontend no deberá conectarse directamente a MongoDB; las operaciones persistentes pasarán por la API backend. | Inspección de arquitectura y configuración del frontend. |
| RNF-014 | Modularidad | El backend deberá separar responsabilidades de controladores, servicios, repositorios y seguridad, según la arquitectura documentada. | Revisión del árbol de paquetes y responsabilidades de las clases. |
| RNF-015 | Interoperabilidad | La comunicación de la aplicación web con el backend se realizará mediante una API REST con intercambio de datos en JSON. | Inspeccionar endpoints y verificar contratos de solicitudes/respuestas. |
| RNF-016 | Configuración | Los dominios, orígenes autorizados de CORS y cadenas de conexión deberán configurarse para cada entorno sin exponer secretos en el código. | Revisar la configuración de despliegue y efectuar una prueba desde un origen permitido y uno no permitido. |
| RNF-017 | Documentación | Los documentos de requisitos, reglas, casos de uso, arquitectura, seguridad y trazabilidad deberán usar identificadores coherentes y referenciarse entre sí sin mantener copias divergentes de la misma definición. | Revisión cruzada de documentos y de la matriz. |

### 3.4 Usabilidad y operación

| ID | Categoría | Requerimiento no funcional | Verificación |
|---|---|---|---|
| RNF-018 | Acceso móvil | Las funciones previstas para clientes deberán poder utilizarse desde un navegador móvil, en particular la consulta de rutina y turno desde el perfil. | Pruebas de interfaz en tamaños de pantalla móviles y escritorio. |
| RNF-019 | Usabilidad | Los formularios deberán identificar los campos requeridos y comunicar errores de validación sin depender únicamente del color. | Pruebas manuales de formularios y revisión de mensajes de error. |
| RNF-020 | Rendimiento | El equipo deberá establecer un umbral cuantitativo de tiempo de respuesta para las operaciones principales y el dashboard antes de la aceptación del MVP. El valor objetivo no aparece definido en la documentación actual y queda pendiente de aprobación. | Una vez acordado el umbral, ejecutar mediciones repetibles sobre los casos de prueba seleccionados. |
| RNF-021 | Disponibilidad | El equipo deberá definir el objetivo de disponibilidad y las expectativas de recuperación del sistema una vez seleccionados el hosting y el entorno de despliegue. Estos objetivos no están fijados en la documentación actual. | Una vez definidos, verificar mediante el plan de despliegue y las pruebas operativas correspondientes. |

## 4. Pendientes para aprobación

Los RNF-001 a RNF-018 reflejan decisiones presentes en la documentación o controles propuestos para hacerlas verificables; el equipo debe confirmar el alcance final y contrastarlos con el código. RNF-019 es una propuesta adicional de usabilidad que no estaba especificada expresamente en los documentos previos. La presencia de cualquier RNF en este documento no confirma que ya esté implementado.

Antes de aprobar definitivamente el documento, el equipo debe resolver al menos:

1. Duración concreta de los tokens de autenticación.
2. Valores/objetivos de rendimiento para operaciones habituales y dashboard.
3. Disponibilidad, copias de seguridad y recuperación, según el hosting elegido.
4. Dominios, CORS, TLS y políticas de acceso de MongoDB en el despliegue real.
5. Dispositivos/navegadores mínimos que se utilizarán para verificar la interfaz móvil.

Los requisitos RNF-020 y RNF-021 permanecen expresamente pendientes de cuantificación y no deben presentarse como objetivos medidos o ya cumplidos.

## 5. Relación con otros documentos

- `REQUERIMIENTOS_FUNCIONALES.md`: funciones del sistema, con identificadores `RF-XXX`.
- `REGLAS_DE_NEGOCIO.md`: reglas del dominio, con identificadores `RN-XX`.
- `CASOS_DE_USO.md`: flujos e interacciones, con identificadores `CU-XX`.
- `SEGURIDAD.md`: diseño de los controles de autenticación, autorización e historia clínica.
- `MATRIZ_DE_TRAZABILIDAD.md`: vínculos entre los identificadores y las verificaciones previstas.
