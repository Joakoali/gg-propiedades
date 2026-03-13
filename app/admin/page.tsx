"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { data: sesion, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);
  if (status === "loading") return <p>Cargando....</p>;
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Panel de administracion</h1>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition text-left"
        >
          Cerrar sesión
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => router.push("/admin/properties/new")}
          className="font-bold text-gray-700 px-6 py-4 rounded hover:bg-gray-700 hover:text-white transition text-left"
        >
          + Cargar nueva propiedad
        </button>
        <button
          onClick={() => router.push("/admin/properties/delete")}
          className=" font-bold text-gray-700 px-6 py-4 rounded hover:bg-gray-700 hover:text-white transition text-left"
        >
          - Eliminar una propiedad
        </button>
        <button
          onClick={() => router.push("/admin/properties/modify")}
          className="font-bold text-gray-700 px-6 py-4 rounded hover:bg-gray-700 hover:text-white transition text-left"
        >
          Modificar una propiedad
        </button>
      </div>
    </div>
  );
}
