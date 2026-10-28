import { hash, compare } from 'bcryptjs'

/* Este valor define el costo de generar el hash.
 Un valor mayor requiere mas tiempo de procesamiento.*/
const costoHash = 12

/* Esta funcion genera el hash que se guarda en la base.
 La contraseña original no se almacena ni se modifica.*/
export async function crearHashContrasena(
  contrasena: string,
): Promise<string> {
  if (!contrasena.trim() || contrasena.length < 8) {
    throw new RangeError(
      'La contraseña debe tener al menos 8 caracteres y no puede contener solamente espacios.',
    )
  }

  /* bcrypt admite hasta 72 bytes. Comprobamos este limite
   para evitar que una contraseña se recorte silenciosamente.*/
  if (Buffer.byteLength(contrasena, 'utf8') > 72) {
    throw new RangeError(
      'La contraseña es demasiado extensa: admite hasta 72 bytes.',
    )
  }

  return hash(contrasena, costoHash)
}

/* Esta funcion compara la contraseña ingresada con el hash
 guardado. Devuelve true si coincide y false si es incorrecta.*/
export async function verificarContrasena(
  contrasena: string,
  passwordHash: string,
): Promise<boolean> {
  if (!contrasena || Buffer.byteLength(contrasena, 'utf8') > 72) {
    return false
  }

  return compare(contrasena, passwordHash)
}