# Esquema NoSQL — Gym Manager

## Descripción

Para el desarrollo del sistema **Gym Manager** se utilizará una base de datos documental **MongoDB NoSQL**.

El modelo estará compuesto por **cinco colecciones principales**, buscando representar las entidades necesarias para el funcionamiento del MVP y aprovechando las características de una base de datos documental.

Las colecciones definidas son:

- `usuarios`
- `clientes`
- `ejercicios`
- `turnos`
- `pagos`

La información correspondiente a las **rutinas** y a la **historia clínica básica** se almacenará como documentos embebidos dentro de la colección `clientes`, evitando crear colecciones independientes para estos datos.

---

