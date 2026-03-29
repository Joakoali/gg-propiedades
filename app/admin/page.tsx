"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Plus, LogOut, Settings } from "lucide-react";
import PropertyList from "./PropertyList";

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-muted)" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="size-10 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--color-primary)" }}
          >
            <Settings size={20} className="text-white animate-spin" style={{ animationDuration: "2s" }} />
          </div>
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-muted)" }}>

      {/* ── Admin header bar ── */}
      <div style={{ background: "var(--color-primary)" }} className="sticky top-0 z-30">
        <div className="section-container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg text-white">GG</span>
              <span className="font-sans text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--color-gold)" }}>
                Propiedades
              </span>
            </div>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Admin</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition border border-white/15 text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="section-container py-10">
        <div className="flex flex-col gap-8">

          {/* Header + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: "var(--color-gold-dark)" }}>
                Panel de administración
              </p>
              <h1 className="font-display text-2xl lg:text-3xl font-bold">Propiedades</h1>
            </div>
            <button
              onClick={() => router.push("/admin/properties/new")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 self-start"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              <Plus size={16} /> Nueva propiedad
            </button>
          </div>

          {/* Property list */}
          <div className="flex flex-col gap-3">
            <PropertyList />
          </div>
        </div>
      </div>
    </div>
  );
}
