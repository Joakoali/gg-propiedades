import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const user = process.env.ADMIN_USERNAME;
        const pass = process.env.ADMIN_PASSWORD;
        if (!user || !pass) return null;
        if (credentials?.username === user && credentials?.password === pass) {
          return { id: "1", name: "Admin" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 horas — ventana corta para sesiones admin
  },
};
