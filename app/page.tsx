import { Link2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="relative flex flex-col items-center justify-center text-center text-white px-6 h-[90vh]">
        <Image
          src="/hero.jpg"
          alt="GG Propiedades"
          fill
          className="object-cover"
          priority
        />
        <div className="bg-black/50 absolute inset-0" />
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-4">BIENVENIDOS!</h1>
          <p className="text-lg max-w-xl mb-8">
            Nos complace poder ayudarte a encontrar la casa de tus sueños. Ya
            sea que estés buscando tu primer hogar, un espacio más grande para
            tu familia o quieras invertir en bienes raíces, estás en el lugar
            correcto.
          </p>
          <Link
            href="/propiedades"
            className="bg-white text-black font-semibold px-8 py-3 rounded hover:bg-gray-200 transition"
          >
            Explorar
          </Link>
        </div>
      </section>
    </main>
  );
}
