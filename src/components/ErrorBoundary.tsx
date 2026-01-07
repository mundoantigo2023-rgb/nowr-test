import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleClearCache = () => {
        if ('caches' in window) {
            caches.keys().then((names) => {
                names.forEach((name) => {
                    caches.delete(name);
                });
                window.location.reload();
            });
        } else {
            window.location.reload();
        }
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Algo salió mal
                    </h1>
                    <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                        La aplicación ha encontrado un error inesperado al iniciar.
                    </p>

                    <div className="space-y-4 w-full max-w-xs">
                        <Button
                            onClick={this.handleReload}
                            className="w-full h-12 rounded-full font-bold"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Recargar aplicación
                        </Button>

                        <Button
                            variant="outline"
                            onClick={this.handleClearCache}
                            className="w-full h-12 rounded-full border-dashed opacity-70 hover:opacity-100"
                        >
                            Reiniciar caché
                        </Button>
                    </div>

                    <div className="mt-12 p-4 bg-muted/50 rounded-lg text-left w-full max-w-sm overflow-hidden">
                        <p className="text-[10px] font-mono text-muted-foreground break-all">
                            {this.state.error?.message || "Error desconocido"}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
