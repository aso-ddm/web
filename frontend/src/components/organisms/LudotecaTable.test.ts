import { expect, it } from 'vitest'
import { columnasCsv } from './LudotecaTable'

it('columnasCsv respeta comas dentro de comillas y comillas escapadas', () => {
  expect(columnasCsv('1,"Catan, el juego",3')).toEqual(['1', 'Catan, el juego', '3'])
  expect(columnasCsv('2,"Dixit ""Odyssey""",')).toEqual(['2', 'Dixit "Odyssey"', ''])
  expect(columnasCsv('3,Azul')).toEqual(['3', 'Azul'])
})
