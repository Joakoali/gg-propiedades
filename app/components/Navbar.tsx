import Image from "next/image";
import Link from "next/link";
import { FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 shadow-md px-6 py-4 flex items-center justify-between">
      <a href="/">
        <Image src="/logo.png" alt="GG Propiedades" width={120} height={60} />
      </a>
      <ul className="flex gap-6 text-white font-medium">
        <li>
          <Link href="/" className="hover:text-gray-300 transition">
            Inicio
          </Link>
        </li>
        <li>
          <Link href="/propiedades" className="hover:text-gray-300 transition">
            Propiedades
          </Link>
        </li>
        <li>
          <Link href="/contacto" className="hover:text-gray-300 transition">
            Contacto
          </Link>
        </li>
      </ul>
      <div className="flex gap-4 items-center text-white">
        <a
          href="http://wa.me/5491166740000"
          target="_blank"
          className="hover:text-green-500 transition"
        >
          <FaWhatsapp size={24} />
        </a>
        <a
          href="https://instagram.com/gg.propiedades"
          target="_blank"
          className="hover:text-pink-500 transition"
        >
          <FaInstagram size={24} />
        </a>
        <a
          href="https://www.facebook.com/GGPropiedades.Mariana"
          target="_blank"
          className="hover:text-blue-600 transition"
        >
          <FaFacebook size={24} />
        </a>
      </div>
    </nav>
  );
}
