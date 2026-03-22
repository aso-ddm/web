import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { GOOGLE_SHEETS, SPACING } from '@/lib/constants'
import texts from '@/data/texts.json'

export function LudotecaTable() {
  const [games, setGames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetch(GOOGLE_SHEETS.ludotecaCSV)
      .then((res) => res.text())
      .then((csvText) => {
        const lines = csvText.split('\n')
        const gameNames: string[] = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const columns = line.split(',')
          if (columns.length >= 2) {
            const gameName = columns[1].replace(/^"|"$/g, '').trim()
            if (gameName) {
              gameNames.push(gameName.toUpperCase())
            }
          }
        }

        gameNames.sort((a, b) => a.localeCompare(b))

        setGames(gameNames)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading ludoteca:', err)
        setError(true)
        setLoading(false)
      })
  }, [])

  const filteredGames = games.filter((game) => game.toUpperCase().includes(searchTerm.toUpperCase()))

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
              className="w-full px-3 py-1.5 pr-8 rounded text-sm text-foreground bg-background border border-primary-foreground/20 focus:border-primary-foreground/40 focus:outline-none transition-colors"
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
                  key={index}
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
