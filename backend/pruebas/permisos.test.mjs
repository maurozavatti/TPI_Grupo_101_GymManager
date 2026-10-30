import test from 'node:test'
import assert from 'node:assert/strict'
import { ObjectId } from 'mongodb'

/* Esta prueba usa una conexion simulada. Los valores locales
 permiten importar el modulo de base sin configurar Atlas.*/
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017'
process.env.MONGODB_DB = 'gymmanager_pruebas'

const { exigirSesion, exigirRol } = await import(
  '../dist/servicios/permisos.js'
)

const usuarioId = new ObjectId()

const conSesion = {
  headers: { cookie: 'gymmanager_sesion=' + 'a'.repeat(64) },
}

/* Simulamos las consultas necesarias sin abrir una conexion real.*/
function conectarSimulado(rol, opciones = {}) {
  return async () => ({
    collection(nombre) {
      if (nombre === 'sesiones') {
        return {
          async findOne() {
            return opciones.sesionExiste === false ? null : { usuarioId }
          },
        }
      }

      if (nombre === 'usuarios') {
        return {
          async findOne(filtro) {
            assert.equal(filtro.activo, true)

            if (opciones.activo === false) return null

            return {
              _id: usuarioId,
              nombre: 'Prueba',
              apellido: 'Permisos',
              email: 'prueba@example.com',
              rol,
              activo: true,
            }
          },
        }
      }

      throw new Error('Coleccion inesperada en la prueba')
    },
  })
}

async function noConsultarBase() {
  throw new Error('No deberia consultar la base en este caso')
}

test('Sin cookie rechaza con 401 sin consultar la base', async () => {
  await assert.rejects(
    () => exigirSesion({ headers: {} }, noConsultarBase),
    (error) => error.estado === 401,
  )
})

test('Una cookie mal formada rechaza con 401', async () => {
  await assert.rejects(
    () => exigirSesion(
      { headers: { cookie: 'gymmanager_sesion=invalida' } },
      noConsultarBase,
    ),
    (error) => error.estado === 401,
  )
})

test('Una sesion inexistente rechaza con 401', async () => {
  await assert.rejects(
    () => exigirSesion(
      conSesion,
      conectarSimulado('USUARIO', { sesionExiste: false }),
    ),
    (error) => error.estado === 401,
  )
})

test('Una cuenta inactiva rechaza con 401', async () => {
  await assert.rejects(
    () => exigirSesion(
      conSesion,
      conectarSimulado('USUARIO', { activo: false }),
    ),
    (error) => error.estado === 401,
  )
})

test('ADMIN puede acceder a una operacion de ADMIN', async () => {
  const usuario = await exigirRol(
    conSesion,
    ['ADMIN'],
    conectarSimulado('ADMIN'),
  )

  assert.equal(usuario.rol, 'ADMIN')
})

test('ENTRENADOR puede acceder cuando su rol esta permitido', async () => {
  const usuario = await exigirRol(
    conSesion,
    ['ADMIN', 'ENTRENADOR'],
    conectarSimulado('ENTRENADOR'),
  )

  assert.equal(usuario.rol, 'ENTRENADOR')
})

test('USUARIO recibe 403 en una operacion exclusiva de ADMIN', async () => {
  await assert.rejects(
    () => exigirRol(
      conSesion,
      ['ADMIN'],
      conectarSimulado('USUARIO'),
    ),
    (error) => error.estado === 403,
  )
})

test('Un fallo de conexion se propaga sin convertirlo en 401', async () => {
  const fallo = new Error('Fallo simulado de conexion')

  await assert.rejects(
    () => exigirSesion(conSesion, async () => {
      throw fallo
    }),
    (error) => error === fallo,
  )
})