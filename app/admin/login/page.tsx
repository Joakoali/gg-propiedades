"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Usuario o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-primary)" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="size-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <Lock size={22} className="text-white" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-display font-black text-2xl text-white">GG</span>
            <span className="font-sans text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--color-gold)" }}>
              Propiedades
            </span>
          </div>
          <p className="text-white/40 text-xs mt-1">Panel de administración</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl p-8 card-shadow">
          <h1 className="font-display text-xl font-bold mb-6 text-center">Iniciar sesión</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario"
                required
                className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="py-3 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 mt-1"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
