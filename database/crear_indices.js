// Script de creacion de indices unicos - Gym Manager
// Base de datos: gym_manager
// Ver la justificacion de cada indice en docs/ESQUEMA_NOSQL.md, seccion "Indices unicos"

db = db.getSiblingDB("gym_manager");

// No puede haber dos cuentas con el mismo correo de acceso
db.usuarios.createIndex({ email: 1 }, { unique: true });

// Garantiza que un mismo cliente no quede vinculado a mas de una cuenta de usuario
// (sparse porque ADMIN/ENTRENADOR no tienen clienteId)
db.usuarios.createIndex({ clienteId: 1 }, { unique: true, sparse: true });

// No puede haber dos clientes registrados con el mismo documento de identidad
db.clientes.createIndex({ dni: 1 }, { unique: true });

// Garantiza que una misma cuenta de usuario no quede vinculada a mas de un cliente
// (sparse porque no todos los clientes tienen cuenta)
db.clientes.createIndex({ usuarioId: 1 }, { unique: true, sparse: true });

// El codigo legible de cada ejercicio (ej. "EJ-0001") debe ser irrepetible
db.ejercicios.createIndex({ codigo: 1 }, { unique: true });

print("Indices creados correctamente.");
