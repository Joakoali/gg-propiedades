"use client";
import { useState } from "react";
import { useRouter } from "next/router";

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
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value, type}=e.target
    setForm((prev)=> ({
        ...prev,
        [name]: type==="checkbox"? (e.target as HTMLInputElement).checked : value,
    }))
}
async function handleSubmit(e:React.FormEvent){
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("api/properties", {
        method:"POST",
        headers:{"Content-Type": "application/json"},
        body: JSON.stringify(form),
    })
    if(res.ok){
        router.push("/admin")
    } else{
        setError("Hubo un error al carga la propeidad")
    }
    setLoading(false)
}

return (
    
)

}
