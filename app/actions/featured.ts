"use server";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { MAX_FEATURED } from "@/app/lib/utils";

export async function toggleFeatured(id: string, currentFeatured: boolean) {
  // Si lo queremos marcar como destacado, verificar el límite con transacción atómica
  if (!currentFeatured) {
    try {
      await prisma.$transaction(async (tx) => {
        const count = await tx.property.count({ where: { featured: true } });
        if (count >= MAX_FEATURED) {
          throw new Error(`LIMIT:${MAX_FEATURED}`);
        }
        await tx.property.update({ where: { id }, data: { featured: true } });
      });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.startsWith("LIMIT:")) {
        return {
          error: `Límite alcanzado: solo podés tener ${MAX_FEATURED} propiedades destacadas.`,
        };
      }
      return { error: "Error al actualizar." };
    }
  } else {
    await prisma.property.update({
      where: { id },
      data: { featured: false },
    });
  }

  revalidatePath("/");
  revalidatePath("/propiedades");
  revalidatePath("/admin");

  return { success: true };
}
