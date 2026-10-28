import { MongoClient } from 'mongodb'
import type { Db, ClientSession } from 'mongodb'

/* Estos son los datos de conexion definidos en las
 variables de entorno del backend.*/
const uri = process.env.MONGODB_URI
const nombreBase = process.env.MONGODB_DB

/* Esta comprobacion evita iniciar una conexion
 si falta alguno de los datos necesarios.*/
if (!uri || !nombreBase) {
  throw new Error('Falta configurar MONGODB_URI o MONGODB_DB en el .env')
}

/* Este cliente se comparte entre los modulos para
 reutilizar la conexion con MongoDB.*/
const cliente = new MongoClient(uri)

/* Esta funcion devuelve la base de datos para trabajar
 con sus colecciones.*/
export async function conectarDB(): Promise<Db> {
  await cliente.connect()

  return cliente.db(nombreBase)
}

/* Esta funcion cierra la conexion cuando termina
 una prueba o se detiene el backend.*/
export async function cerrarConexionDB(): Promise<void> {
  await cliente.close()
}

/* Esta funcion permite ejecutar varias operaciones dentro
 de una misma transaccion. Si alguna falla, se deshacen
 los cambios realizados dentro de esa transaccion.*/
export async function ejecutarTransaccion<Resultado>(
  operacion: (db: Db, transaccion: ClientSession) => Promise<Resultado>,
): Promise<Resultado> {
  const db = await conectarDB()
  const transaccion = cliente.startSession()

  try {
    return await transaccion.withTransaction(async () => {
      return await operacion(db, transaccion)
    })
  } finally {
    /* La sesion de MongoDB se libera tanto si las operaciones
     terminan correctamente como si ocurre un error.*/
    await transaccion.endSession()
  }
}