"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Usuario o Contraseña incorrectos");
    } else {
      router.push("/admin");
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 roudned shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin</h1>
        <form onSubmit={handleSubmit} className=" felx flex-col gap-4">
          <input
            type="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border px-4 py-2 rounded"
          />
          <input
            type="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border px-4 py-2 rounded"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-gray-900 text-white py-2 rounded hover:bg-gray-700 transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
