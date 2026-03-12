export default function Navbar() {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
      <a href="/" className="text-xl font-bold text-gray-800">
        GG Propiedades
      </a>
      <ul className="flex gap-6 text-black">
        <li>
          <a href="/" className="hover:text-black transition">
            Inicio
          </a>
        </li>
        <li>
          <a href="/propiedades" className="hover:text-black transition">
            Propiedades
          </a>
        </li>
        <li>
          <a href="/contacto" className="hover:text-black transition">
            Contacto
          </a>
        </li>
      </ul>
    </nav>
  );
}
