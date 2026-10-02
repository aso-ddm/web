/** Error de dominio con código HTTP: el errorHandler responde con ese status y el mensaje. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}
