import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

/** Evita la pantalla en blanco si una página falla al cargar o al pintarse */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Algo ha fallado</h1>
          <p className="text-muted-foreground">
            No se ha podido cargar la página. Puede que haya una versión nueva de la web.
          </p>
          <Button onClick={() => window.location.reload()}>Recargar</Button>
        </div>
      </div>
    )
  }
}
