import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { MotionConfig } from "framer-motion";
import { useUIStore } from "@/store/useUIStore";
import { RTL_LANGUAGES } from "@/i18n";
import AppRoutes from "@/routes/AppRoutes";
import AdminRoutes from "@/routes/AdminRoutes";

export default function App() {
  const hydrateDocument = useUIStore((s) => s.hydrateDocument);
  const theme = useUIStore((s) => s.theme);
  const language = useUIStore((s) => s.language);

  useEffect(() => {
    hydrateDocument();
  }, [hydrateDocument]);

  useEffect(() => {
    if (theme !== "system") return undefined;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const syncSystemTheme = () => hydrateDocument();
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, [hydrateDocument, theme]);

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>

      {/* Single global toaster — covers every route, including pages like
          /admin/login that sit outside both PublicLayout and AdminLayout. */}
        <Toaster
          position={RTL_LANGUAGES.includes(language) ? "bottom-left" : "bottom-right"}
          toastOptions={{
            style: {
              background: "var(--color-card)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
            },
            success: {
              iconTheme: { primary: "var(--color-success)", secondary: "var(--color-card)" },
              style: { border: "1px solid color-mix(in srgb, var(--color-success) 40%, var(--color-border))" },
            },
            error: {
              iconTheme: { primary: "var(--color-error)", secondary: "var(--color-card)" },
              style: { border: "1px solid color-mix(in srgb, var(--color-error) 40%, var(--color-border))" },
            },
          }}
        />
      </BrowserRouter>
    </MotionConfig>
  );
}
