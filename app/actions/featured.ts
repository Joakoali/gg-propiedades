"use server";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { MAX_FEATURED } from "@/app/lib/utils";

export async function toggleFeatured(id: string, currentFeatured: boolean) {
  // Si lo queremos marcar como destacado, verificar el límite
  if (!currentFeatured) {
    try {
      const count = await prisma.property.count({ where: { featured: true } });

      if (count >= MAX_FEATURED) {
        return {
          error: `Límite alcanzado: solo podés tener ${MAX_FEATURED} propiedades destacadas.`,
        };
      }

      await prisma.property.update({ where: { id }, data: { featured: true } });
    } catch {
      return { error: "Error al actualizar." };
    }
  } else {
    try {
      await prisma.property.update({ where: { id }, data: { featured: false } });
    } catch {
      return { error: "Error al actualizar." };
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");

  return { success: true };
}
