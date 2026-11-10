import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { SPACING } from '@/lib/constants'
import texts from '@/data/texts.json'
import { normalizarBusqueda } from '@/lib/format'
import { juegosApi } from '@/services/api/juegos'
import type { TipoJuego } from '@/types/api'

const TIPOS: TipoJuego[] = ['juego', 'libro']

export function LudotecaTable() {
  const [tipo, setTipo] = useState<TipoJuego>('juego')
  const [searchTerm, setSearchTerm] = useState('')
  // Una sola descarga para las dos pestañas; caché de sesión al volver a la página
  const { data: todos = [], isLoading: loading, isError: error } = useQuery({
    queryKey: ['ludoteca-publica'],
    queryFn: async () => (await juegosApi.publico()).data,
    staleTime: Infinity,
  })
  // El filtrado de cientos de filas no bloquea lo que se escribe en el buscador
  const busqueda = useDeferredValue(searchTerm)

  const games = todos.filter((j) => j.tipo === tipo)
  const q = normalizarBusqueda(busqueda)
  const filteredGames = games.filter((game) => normalizarBusqueda(game.nombre).includes(q))

  const cabecera = (
    <div className={`bg-primary text-primary-foreground ${SPACING.padMd}`}>
      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">{texts.ludoteca.tableTitle}</h3>
    </div>
  )

  if (loading || error) {
    return (
      <div className="w-full max-w-5xl border-2 border-muted rounded-lg overflow-hidden shadow-lg">
        {cabecera}
        <div className={`${SPACING.padLg} text-center`}>
          <p className="text-base sm:text-lg md:text-xl">{loading ? texts.ludoteca.loading : texts.ludoteca.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl border-2 border-muted rounded-lg overflow-hidden shadow-lg">
      <div className={`bg-primary text-primary-foreground ${SPACING.padMd}`}>
        <div className={`flex flex-col sm:flex-row items-center justify-between ${SPACING.gapSm}`}>
          <div role="tablist" aria-label={texts.ludoteca.tableTitle} className="flex gap-1">
            {TIPOS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tipo === t}
                onClick={() => setTipo(t)}
                className={`px-3 py-1 rounded text-lg sm:text-xl md:text-2xl font-bold transition-colors ${
                  tipo === t ? 'bg-primary-foreground text-primary' : 'hover:bg-primary-foreground/10'
                }`}
              >
                {texts.ludoteca.tabs[t]}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-auto sm:min-w-[200px] md:min-w-[250px]">
            <input
              type="text"
              placeholder={texts.ludoteca.searchPlaceholder[tipo]}
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
      <div role="tabpanel" className="max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto bg-background">
        <table className="w-full">
          <tbody>
            {filteredGames.length > 0 ? (
              filteredGames.map((game, index) => (
                <tr
                  key={`${index}-${game.nombre}`} // puede haber varias copias del mismo juego
                  className={`border-b border-muted/50 hover:bg-muted/30 transition-colors ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                  }`}
                >
                  <td className={`${SPACING.padSm} text-sm sm:text-base md:text-lg uppercase`}>{game.nombre}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-8 text-center text-muted-foreground text-sm sm:text-base">
                  {searchTerm ? texts.ludoteca.noResults.replace('{searchTerm}', searchTerm) : texts.ludoteca.empty}
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
              {texts.ludoteca.of} <span className="font-bold text-foreground">{games.length}</span>
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
