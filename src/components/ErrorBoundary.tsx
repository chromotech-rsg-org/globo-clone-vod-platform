import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-admin-content-bg p-4">
          <Card className="max-w-md w-full bg-admin-card border-admin-border">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-admin-danger/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-admin-danger" />
              </div>
              <CardTitle className="text-admin-sidebar-text">Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-admin-muted-foreground text-sm">
                Ocorreu um erro inesperado. Tente recarregar a página.
              </p>
              {this.state.error && (
                <details className="text-left">
                  <summary className="text-admin-muted-foreground text-xs cursor-pointer">
                    Detalhes técnicos
                  </summary>
                  <pre className="text-xs text-admin-muted-foreground mt-2 p-2 bg-admin-muted/10 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  className="border-admin-border text-admin-sidebar-text"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar novamente
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="admin"
                  size="sm"
                >
                  Recarregar página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;