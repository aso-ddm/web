import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { GOOGLE_SHEETS, SPACING } from '@/lib/constants'
import texts from '@/data/texts.json'

// Columnas de una línea CSV respetando comillas ("Catan, el juego") y comillas escapadas ("").
// ponytail: no admite saltos de línea dentro de comillas; papaparse si la hoja llega a tenerlos
export function columnasCsv(linea: string): string[] {
  const columnas: string[] = []
  for (const [, valor, separador] of linea.matchAll(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)) {
    columnas.push(valor.replace(/^"|"$/g, '').replace(/""/g, '"'))
    if (separador === '') break // fin de línea
  }
  return columnas
}

/** Nombres de juego (columna 2 de la hoja pública), en mayúsculas y ordenados */
async function cargarLudoteca(): Promise<string[]> {
  const res = await fetch(GOOGLE_SHEETS.ludotecaCSV)
  // Si la hoja deja de ser pública Google responde con HTML: no pintarlo como si fueran juegos
  if (!res.ok) throw new Error(`Google Sheets respondió ${res.status}`)
  return (await res.text())
    .split('\n')
    .slice(1)
    .map((linea) => columnasCsv(linea.trim())[1]?.trim().toUpperCase())
    .filter((nombre): nombre is string => !!nombre)
    .sort((a, b) => a.localeCompare(b))
}

export function LudotecaTable() {
  const [searchTerm, setSearchTerm] = useState('')
  // Caché de sesión: volver a la página no descarga otra vez la hoja (unos 800 juegos)
  const { data: games = [], isLoading: loading, isError: error } = useQuery({
    queryKey: ['ludoteca-publica'],
    queryFn: cargarLudoteca,
    staleTime: Infinity,
  })
  // El filtrado de cientos de filas no bloquea lo que se escribe en el buscador
  const busqueda = useDeferredValue(searchTerm)

  const filteredGames = games.filter((game) => game.includes(busqueda.toUpperCase()))

  if (loading) {
    return (
      <div className="w-full max-w-5xl border-2 border-muted rounded-lg overflow-hidden shadow-lg">
        <div className={`bg-primary text-primary-foreground ${SPACING.padMd}`}>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">{texts.ludoteca.tableTitle}</h3>
        </div>
        <div className={`${SPACING.padLg} text-center`}>
          <p className="text-base sm:text-lg md:text-xl">{texts.ludoteca.loading}</p>
        </div>
      </div>
    )
  }

  if (error || games.length === 0) {
    return (
      <div className="w-full max-w-5xl border-2 border-muted rounded-lg overflow-hidden shadow-lg">
        <div className={`bg-primary text-primary-foreground ${SPACING.padMd}`}>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">{texts.ludoteca.tableTitle}</h3>
        </div>
        <div className={`${SPACING.padLg} text-center`}>
          <p className="text-base sm:text-lg md:text-xl">{texts.ludoteca.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl border-2 border-muted rounded-lg overflow-hidden shadow-lg">
      <div className={`bg-primary text-primary-foreground ${SPACING.padMd}`}>
        <div className={`flex flex-col sm:flex-row items-center justify-between ${SPACING.gapSm}`}>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">{texts.ludoteca.tableTitle}</h3>
          <div className="relative w-full sm:w-auto sm:min-w-[200px] md:min-w-[250px]">
            <input
              type="text"
              placeholder={texts.ludoteca.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 pr-8 rounded text-sm text-foreground bg-card border border-primary-foreground/20 focus:border-primary-foreground/40 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted/20 transition-colors"
                aria-label={texts.ludoteca.clearSearch}
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto bg-background">
        <table className="w-full">
          <tbody>
            {filteredGames.length > 0 ? (
              filteredGames.map((game, index) => (
                <tr
                  key={`${index}-${game}`} // la hoja puede repetir un nombre (varias copias del mismo juego)
                  className={`border-b border-muted/50 hover:bg-muted/30 transition-colors ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                  }`}
                >
                  <td className={`${SPACING.padSm} text-sm sm:text-base md:text-lg`}>{game}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-8 text-center text-muted-foreground text-sm sm:text-base">
                  {texts.ludoteca.noResults.replace('{searchTerm}', searchTerm)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={`bg-muted/50 ${SPACING.padSm} text-center`}>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          {searchTerm ? (
            <>
              {texts.ludoteca.showing}: <span className="font-bold text-foreground">{filteredGames.length}</span>{' '}
              {texts.ludoteca.of} <span className="font-bold text-foreground">{games.length}</span>{' '}
              {texts.ludoteca.games}
            </>
          ) : (
            <>
              {texts.ludoteca.total}: <span className="font-bold text-foreground">{games.length}</span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
