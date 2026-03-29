import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{ background: "var(--color-muted)" }}
    >
      <div className="max-w-md">
        <div
          className="size-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 card-shadow"
        >
          <Home size={40} style={{ color: "var(--color-muted-foreground)" }} />
        </div>

        <h1 className="font-display text-5xl font-bold mb-3" style={{ color: "var(--color-primary)" }}>
          404
        </h1>
        <p className="text-lg font-semibold mb-2">Página no encontrada</p>
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          La propiedad o página que buscás no existe, fue removida o cambió de dirección.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/propiedades"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            <Search size={15} />
            Ver propiedades
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition hover:bg-white"
            style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
          >
            <Home size={15} />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
