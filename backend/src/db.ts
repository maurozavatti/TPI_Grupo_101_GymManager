import { MongoClient } from 'mongodb'

// Leemos los datos de conexion desde las variables de entorno.
const uri = process.env.MONGODB_URI
const nombreBase = process.env.MONGODB_DB

// Si falta algun dato, detenemos la ejecucion con un mensaje claro.
if (!uri || !nombreBase) {
  throw new Error('Falta configurar MONGODB_URI o MONGODB_DB en el .env')
}

// Creamos un solo cliente para compartirlo entre los modulos.
const cliente = new MongoClient(uri)

// Esta funcion devuelve la base de datos para poder trabajar con sus colecciones.
export async function conectarDB() {
  await cliente.connect()

  return cliente.db(nombreBase)
}