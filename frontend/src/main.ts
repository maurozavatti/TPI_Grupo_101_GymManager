import { prepararPanel } from './panel/estructura.ts'

/* Mi cuenta permite comprobar el acceso de los tres roles
 utilizando la misma estructura que los demas modulos.*/
const usuario = await prepararPanel(
  'Mi cuenta',
  ['ADMIN', 'ENTRENADOR', 'USUARIO'],
)

if (usuario) {
  const nombre = document.querySelector<HTMLElement>('#nombre-usuario')
  const correo = document.querySelector<HTMLElement>('#correo-usuario')
  const rol = document.querySelector<HTMLElement>('#rol-usuario')

  if (nombre) nombre.textContent = `${usuario.nombre} ${usuario.apellido}`
  if (correo) correo.textContent = usuario.email
  if (rol) rol.textContent = usuario.rol
}