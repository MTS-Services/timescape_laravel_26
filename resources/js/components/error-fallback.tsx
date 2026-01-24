// resources/js/Components/ErrorFallback.tsx
import React, { useState } from 'react';

interface ErrorFallbackProps {
    error: unknown;
    resetErrorBoundary: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const [showDetails, setShowDetails] = useState(false);

    // Check if we are in debug mode via Vite env
    const isDebug = true;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0F1A] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow Effect - Matching Home Page */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-linear-to-tr from-violet-500 to-emerald-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
            </div>

            <div className="max-w-2xl w-full">
                <div className="text-center">
                    {/* Brand Badge */}
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full px-3 py-1 text-sm leading-6 text-red-600 ring-1 ring-red-900/10 bg-red-50 dark:bg-red-900/10 dark:text-red-400 dark:ring-red-500/20">
                            Client-side crash detected
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
                        Something went <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-500 to-emerald-600">wrong</span>
                    </h1>

                    <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
                        {isDebug
                            ? "A JavaScript error occurred during rendering. See the technical details below."
                            : "We encountered a glitch in the craftsmanship. Our team has been notified. Please try refreshing the page."}
                    </p>

                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <button
                            onClick={resetErrorBoundary}
                            className="rounded-md bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 transition-all"
                        >
                            Reload Interface
                        </button>

                        {isDebug && (
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:opacity-80"
                            >
                                {showDetails ? 'Hide Error' : 'View Stack Trace'} <span aria-hidden="true">↓</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Technical Details (Only for Debug Mode) */}
                {isDebug && showDetails && (
                    <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="rounded-xl bg-gray-900/5 ring-1 ring-inset ring-gray-900/10 dark:bg-white/5 dark:ring-white/10 p-2 overflow-hidden">
                            <div className="bg-gray-950 rounded-lg p-6 overflow-x-auto border border-white/5 shadow-2xl">
                                <div className="flex items-center gap-2 mb-4 text-red-400">
                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs font-mono font-bold uppercase tracking-widest">Exception Trace</span>
                                </div>
                                <code className="text-gray-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                    {errorObj.stack || errorObj.message}
                                </code>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
