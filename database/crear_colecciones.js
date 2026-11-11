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
        rol: {
          bsonType: "array",
          minItems: 1,
          uniqueItems: true,
          items: { enum: ["ADMIN", "ENTRENADOR", "USUARIO"] }
        },
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
        historialClientes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["clienteId", "accion", "fecha", "usuarioId"],
            properties: {
              clienteId: { bsonType: "objectId" },
              accion: { enum: ["ASIGNACION", "RETIRO", "BAJA_CLIENTE"] },
              fecha: { bsonType: "date" },
              usuarioId: { bsonType: "objectId" }
            }
          }
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
        // monto se guarda como entero (pesos sin centavos), nunca Decimal128.
        monto: { bsonType: "int" },
        fechaPago: { bsonType: "date" },
        fechaVencimiento: { bsonType: "date" },
        estado: { enum: ["PAGADO", "PENDIENTE", "VENCIDO"] },
        observaciones: { bsonType: "string" },
        usuarioRegistroId: { bsonType: "objectId" }
      }
    }
  }
});

db.createCollection("configuracion", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["franjas", "capacidad", "trabajos", "fechaModificacion"],
      properties: {
        franjas: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["inicio", "fin"],
            properties: {
              inicio: { bsonType: "string" },
              fin: { bsonType: "string" }
            }
          }
        },
        capacidad: { bsonType: "int" },
        trabajos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["entrenadorId", "dias"],
            properties: {
              entrenadorId: { bsonType: "objectId" },
              dias: { bsonType: "array", items: { bsonType: "string" } }
            }
          }
        },
        fechaModificacion: { bsonType: "date" }
      }
    }
  }
});

// Documento unico (singleton) de configuracion, identificado siempre con el mismo _id fijo.
// Lo crea el propio backend con upsert la primera vez que se genera una agenda.
db.createCollection("sesiones", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuarioId", "tokenHash", "fechaCreacion", "fechaVencimiento"],
      properties: {
        usuarioId: { bsonType: "objectId" },
        tokenHash: { bsonType: "string" },
        fechaCreacion: { bsonType: "date" },
        fechaVencimiento: { bsonType: "date" }
      }
    }
  }
});

print("Colecciones creadas correctamente.");