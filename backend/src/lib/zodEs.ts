import { z, ZodIssueCode } from 'zod'

// Mensajes por defecto de Zod en español. Los mensajes propios de cada regla (.min(8, '...')) tienen prioridad.
// El front los muestra en el toast ("Datos inválidos: ..."), así que no pueden salir en inglés.
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') return { message: 'Campo obligatorio' }
      if (issue.expected === 'integer') return { message: 'Debe ser un número entero' }
      return { message: 'Tipo de dato no válido' }
    case ZodIssueCode.too_small: {
      const n = Number(issue.minimum)
      if (issue.type === 'string') return { message: `Mínimo ${n} caracteres` }
      if (issue.type === 'array') return { message: `Mínimo ${n} elementos` }
      if (issue.type === 'number') return { message: issue.inclusive ? `Debe ser ${n} o más` : `Debe ser mayor que ${n}` }
      break
    }
    case ZodIssueCode.too_big: {
      const n = Number(issue.maximum)
      if (issue.type === 'string') return { message: `Máximo ${n} caracteres` }
      if (issue.type === 'array') return { message: `Máximo ${n} elementos` }
      if (issue.type === 'number') return { message: issue.inclusive ? `Debe ser ${n} o menos` : `Debe ser menor que ${n}` }
      break
    }
    case ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'Email no válido' }
      if (issue.validation === 'date' || issue.validation === 'datetime') return { message: 'Fecha no válida' }
      return { message: 'Formato no válido' }
    case ZodIssueCode.invalid_date:
      return { message: 'Fecha no válida' }
    case ZodIssueCode.invalid_enum_value:
    case ZodIssueCode.invalid_literal:
    case ZodIssueCode.invalid_union:
      return { message: 'Valor no válido' }
  }
  return { message: ctx.defaultError }
})
