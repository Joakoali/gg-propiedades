export const runtime = "nodejs";
import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import EditPropertyForm from "./EditPropertyForm";

type Props = { params: Promise<{ slug: string }> };

export default async function EditPropertyPage({ params }: Props) {
  const { slug } = await params;
  const property = await prisma.property.findUnique({ where: { slug } });

  if (!property) notFound();

  return <EditPropertyForm property={property} />;
}
