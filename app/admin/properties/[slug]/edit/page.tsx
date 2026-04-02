import { supabase, TABLE, type Property } from "@/app/lib/db";
import { notFound } from "next/navigation";
import EditPropertyForm from "./EditPropertyForm";

type Props = { params: Promise<{ slug: string }> };

export default async function EditPropertyPage({ params }: Props) {
  const { slug } = await params;

  const { data: property } = await supabase()
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .single();

  if (!property) notFound();

  return <EditPropertyForm property={property as Property} />;
}
