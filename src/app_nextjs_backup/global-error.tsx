"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global application error:", error);
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    fontFamily:
                        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    backgroundColor: "#f9fafb",
                    color: "#111827",
                }}
            >
                <main
                    style={{
                        display: "flex",
                        minHeight: "100vh",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1.5rem",
                        background: "linear-gradient(to bottom, #f9fafb, #f3f4f6)",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "28rem",
                            width: "100%",
                            textAlign: "center",
                            padding: "2rem",
                            backgroundColor: "white",
                            borderRadius: "0.75rem",
                            boxShadow:
                                "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: "1.5rem",
                            }}
                        >
                            <div
                                style={{
                                    padding: "1rem",
                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                    borderRadius: "9999px",
                                }}
                            >
                                <AlertTriangle
                                    style={{
                                        width: "3rem",
                                        height: "3rem",
                                        color: "#ef4444",
                                    }}
                                />
                            </div>
                        </div>

                        <h2
                            style={{
                                fontSize: "1.5rem",
                                fontWeight: 700,
                                marginBottom: "0.75rem",
                                color: "#111827",
                            }}
                        >
                            Critical Error
                        </h2>

                        <p
                            style={{
                                color: "#6b7280",
                                marginBottom: "1.5rem",
                                lineHeight: 1.6,
                            }}
                        >
                            A critical error has occurred in the application. Please try
                            refreshing the page.
                        </p>

                        {error.digest && (
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#9ca3af",
                                    fontFamily: "monospace",
                                    backgroundColor: "#f3f4f6",
                                    padding: "0.375rem 0.75rem",
                                    borderRadius: "0.375rem",
                                    marginBottom: "1.5rem",
                                }}
                            >
                                Error ID: {error.digest}
                            </p>
                        )}

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.75rem",
                            }}
                        >
                            <button
                                onClick={reset}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    width: "100%",
                                    padding: "0.75rem 1.5rem",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    color: "white",
                                    backgroundColor: "#111827",
                                    border: "none",
                                    borderRadius: "0.5rem",
                                    cursor: "pointer",
                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                    transition: "all 0.2s",
                                }}
                                onMouseOver={(e) =>
                                    (e.currentTarget.style.backgroundColor = "#1f2937")
                                }
                                onMouseOut={(e) =>
                                    (e.currentTarget.style.backgroundColor = "#111827")
                                }
                            >
                                <RotateCcw style={{ width: "1rem", height: "1rem" }} />
                                Try Again
                            </button>
                        </div>
                    </div>
                </main>
            </body>
        </html>
    );
}
