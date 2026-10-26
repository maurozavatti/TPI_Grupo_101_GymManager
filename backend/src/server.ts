import { createServer } from 'node:http'

const puerto = Number(process.env.PORT ?? 3000)

const servidor = createServer((_peticion, respuesta) => {
  respuesta.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
  })

  respuesta.end(JSON.stringify({
    mensaje: 'Backend de GymManager funcionando',
  }))
})

servidor.listen(puerto, () => {
  console.log(`Backend disponible en http://localhost:${puerto}`)
})