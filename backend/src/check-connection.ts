import { conectarDB, cerrarConexionDB } from './db.ts'

try {
  // Nos conectamos y pedimos una respuesta a MongoDB Atlas.
  const db = await conectarDB()
  await db.command({ ping: 1 })

  console.log('Conexion y ping a MongoDB Atlas exitosos.')
} catch {
  console.error('No se pudo conectar a MongoDB Atlas. Revisá el .env y el acceso de red en Atlas.')

  // Indicamos que la prueba termino con un error.
  process.exitCode = 1
} finally {
  // Cerramos la conexion para que la prueba pueda finalizar.
  await cerrarConexionDB()
}