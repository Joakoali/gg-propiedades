"use server";
import { supabase, TABLE } from "@/app/lib/db";
import { MAX_FEATURED } from "@/app/lib/utils";

export async function toggleFeatured(id: string, currentFeatured: boolean) {
  const db = supabase();

  // Si lo queremos marcar como destacado, verificar el límite
  if (!currentFeatured) {
    try {
      const { count } = await db
        .from(TABLE)
        .select("*", { count: "exact", head: true })
        .eq("featured", true);

      if ((count ?? 0) >= MAX_FEATURED) {
        return {
          error: `Límite alcanzado: solo podés tener ${MAX_FEATURED} propiedades destacadas.`,
        };
      }

      const { error } = await db
        .from(TABLE)
        .update({ featured: true })
        .eq("id", id);

      if (error) return { error: "Error al actualizar." };
    } catch {
      return { error: "Error al actualizar." };
    }
  } else {
    const { error } = await db
      .from(TABLE)
      .update({ featured: false })
      .eq("id", id);

    if (error) return { error: "Error al actualizar." };
  }

  return { success: true };
}

export async function setFeaturedOrder(id: string, order: number | null) {
  const db = supabase();
  const { error } = await db
    .from(TABLE)
    .update({ featuredOrder: order })
    .eq("id", id);

  if (error) return { error: "Error al actualizar." };
  return { success: true };
}
