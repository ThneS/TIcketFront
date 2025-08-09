import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg border border-red-200">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              应用程序错误
            </h2>
            <p className="text-gray-600 mb-4">
              很抱歉，应用程序遇到了错误。
            </p>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                错误详情
              </summary>
              <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              重新加载页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
