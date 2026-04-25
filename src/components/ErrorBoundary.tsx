import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { captureError } from '../lib/errorMonitoring'
import { Button } from './ui'

interface Props {
  children: ReactNode
  resetKey?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, { componentStack: info.componentStack })
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto">
        <div className="mt-10 bg-gray-900 border border-red-500/30 rounded-xl p-6 flex flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
          </div>
          <p className="text-sm text-gray-400">
            This page failed to render. Try going back or reloading.
          </p>
          <pre className="w-full text-xs text-gray-500 bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-auto max-h-40">
            {this.state.error.message}
          </pre>
          <Button onClick={() => this.setState({ error: null })} className="mt-2">
            Try again
          </Button>
        </div>
      </div>
    )
  }
}
