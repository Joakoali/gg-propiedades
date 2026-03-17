"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "houses",
    description: "",
    bedrooms: "",
    coveredArea: "",
    semiCoveredArea: "",
    lotArea: "",
    neighborhood: "",
    zone: "",
    pool: false,
    financiang: false,
    mortgageEligible: false,
    featured: false,
  });
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Hubo un error al carga la propeidad");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
        <h1 className="text-2xl font bold mb-6">Nueva Propiedad</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="title"
            placeholder="Titulo"
            onChange={handleChange}
            className="border px-4 py-4 rounded"
            required
          />
          <input
            name="price"
            placeholder="Precio (Opcional)"
            type="number"
            onChange={handleChange}
            className="border px-4 py-4 rounded"
          />
          <select
            name="category"
            onChange={handleChange}
            className="border px-4 py-2 rounded"
          >
            <option value="houses">Casa</option>
            <option value="lots">Terreno</option>
            <option value="local">Local</option>
          </select>
          <textarea
            name="description"
            placeholder="Descripción"
            onChange={handleChange}
            className="border px-4 py-2 rounded h-32"
            required
          />
          <input
            name="bedrooms"
            placeholder="Dormitorios"
            type="number"
            onChange={handleChange}
            className="border px-4 py-2 rounded h-32"
            required
          />
          <input
            name="coveredArea"
            placeholder="Metros cubiertos"
            type="number"
            onChange={handleChange}
            className="border px-4 py-2 rounded h-32"
          />
          <input
            name="semiCoveredArea"
            placeholder="Metros Semi Cubiertos"
            type="number"
            onChange={handleChange}
            className="border px-4 py-2 rounded h-32"
          />
          <input
            name="lotArea"
            placeholder="Metros de lote"
            type="number"
            onChange={handleChange}
            className="border px-4 py-2 rounded h-32"
          />
          <input
            name="neighborhood"
            placeholder="Barrio"
            onChange={handleChange}
            className="border px-4 py-2 rounded h-32"
          />
          <input
            name="zone"
            placeholder="Zona (Pilar, Escobar ...)"
            onChange={handleChange}
            className="border px-4 py-2 rounded h-32"
          />
          <div className="flex flex-col gap-2">
            <label className="flex item-center gap-2">
              <input name="pool" type="checkbox" onChange={handleChange} />
              Pileta
            </label>
            <label className="flex item-center gap-2">
              <input
                name="financiang"
                type="checkbox"
                onChange={handleChange}
              />
              Financiación
            </label>
            <label className="flex item-center gap-2">
              <input
                name="mortgageEligible"
                type="checkbox"
                onChange={handleChange}
              />
              Apto crédito hipotecario
            </label>
            <label className="flex item-center gap-2">
              <input name="featured" type="checkbox" onChange={handleChange} />
              Destacada en home
            </label>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white py-2 rounded hover:bg-gray-700 transition disabled:opacity-50"
          >
            {loading ? "Cargando ...." : "Guardar Propiedad"}
          </button>
        </form>
      </div>
    </div>
  );
}
