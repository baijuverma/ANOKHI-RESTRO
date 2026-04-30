// @refresh reload
import { Suspense } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Toaster } from "solid-sonner";
import "./app.css";

export default function App() {
    return (
        <Router
            root={props => (
                <>
                    <Suspense>
                        {props.children}
                    </Suspense>
                    <Toaster richColors position="top-center" />
                </>
            )}
        >
            <FileRoutes />
        </Router>
    );
}
