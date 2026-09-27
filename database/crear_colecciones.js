// Script de creacion de colecciones - Gym Manager
// Base de datos: gym_manager

// El diseño completo de cada campo esta documentado en docs/ESQUEMA_NOSQL.md

db = db.getSiblingDB("gym_manager");

db.createCollection("usuarios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "apellido", "email", "passwordHash", "rol", "activo", "fechaCreacion", "fechaModificacion"],
      properties: {
        nombre: { bsonType: "string" },
        apellido: { bsonType: "string" },
        email: { bsonType: "string" },
        passwordHash: { bsonType: "string" },
        rol: { enum: ["ADMIN", "ENTRENADOR", "USUARIO"] },
        clienteId: { bsonType: ["objectId", "null"] },
        activo: { bsonType: "bool" },
        fechaCreacion: { bsonType: "date" },
        fechaModificacion: { bsonType: "date" },
        fechaBaja: { bsonType: ["date", "null"] }
      }
    }
  }
});

db.createCollection("clientes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "apellido", "dni", "activo", "fechaCreacion", "fechaModificacion"],
      properties: {
        nombre: { bsonType: "string" },
        apellido: { bsonType: "string" },
        dni: { bsonType: "string" },
        fechaNacimiento: { bsonType: "date" },
        telefono: { bsonType: "string" },
        email: { bsonType: "string" },
        direccion: { bsonType: "string" },
        contactoEmergencia: {
          bsonType: ["object", "null"],
          properties: {
            nombre: { bsonType: "string" },
            telefono: { bsonType: "string" },
            relacion: { bsonType: "string" }
          }
        },
        usuarioId: { bsonType: ["objectId", "null"] },
        rutinas: {
          bsonType: "array",
          maxItems: 12,
          items: {
            bsonType: "object",
            required: ["fechaAsignacion", "entrenadorId", "activo"],
            properties: {
              fechaAsignacion: { bsonType: "date" },
              entrenadorId: { bsonType: "objectId" },
              observaciones: { bsonType: "string" },
              activo: { bsonType: "bool" },
              fechaCreacion: { bsonType: "date" },
              fechaModificacion: { bsonType: "date" },
              fechaBaja: { bsonType: ["date", "null"] },
              ejercicios: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["ejercicioId"],
                  properties: {
                    ejercicioId: { bsonType: "objectId" },
                    series: { bsonType: "int" },
                    repeticiones: { bsonType: "int" },
                    peso: { bsonType: "number" },
                    descanso: { bsonType: "int" },
                    orden: { bsonType: "int" },
                    observaciones: { bsonType: "string" }
                  }
                }
              }
            }
          }
        },
        historiaClinica: {
          bsonType: ["object", "null"],
          properties: {
            antecedentes: { bsonType: "string" },
            lesiones: { bsonType: "string" },
            observaciones: { bsonType: "string" },
            fechaActualizacion: { bsonType: "date" }
          }
        },
        activo: { bsonType: "bool" },
        fechaCreacion: { bsonType: "date" },
        fechaModificacion: { bsonType: "date" },
        fechaBaja: { bsonType: ["date", "null"] }
      }
    }
  }
});

db.createCollection("ejercicios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["codigo", "nombre", "activo", "fechaCreacion", "fechaModificacion"],
      properties: {
        codigo: { bsonType: "string" },
        nombre: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        grupoMuscular: { bsonType: "string" },
        activo: { bsonType: "bool" },
        fechaCreacion: { bsonType: "date" },
        fechaModificacion: { bsonType: "date" },
        fechaBaja: { bsonType: ["date", "null"] }
      }
    }
  }
});

db.createCollection("turnos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["dia", "horaInicio", "horaFin", "capacidad", "entrenadorId", "activo"],
      properties: {
        dia: { bsonType: "string" },
        horaInicio: { bsonType: "string" },
        horaFin: { bsonType: "string" },
        capacidad: { bsonType: "int" },
        entrenadorId: { bsonType: "objectId" },
        clientes: {
          bsonType: "array",
          items: { bsonType: "objectId" }
        },
        activo: { bsonType: "bool" },
        observaciones: { bsonType: "string" }
      }
    }
  }
});

db.createCollection("pagos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["clienteId", "tipo", "monto", "fechaPago", "fechaVencimiento", "estado", "usuarioRegistroId"],
      properties: {
        clienteId: { bsonType: "objectId" },
        tipo: { enum: ["INSCRIPCION", "CUOTA"] },
        monto: { bsonType: "decimal" },
        fechaPago: { bsonType: "date" },
        fechaVencimiento: { bsonType: "date" },
        estado: { enum: ["PAGADO", "PENDIENTE", "VENCIDO"] },
        observaciones: { bsonType: "string" },
        usuarioRegistroId: { bsonType: "objectId" }
      }
    }
  }
});

print("Colecciones creadas correctamente.");
