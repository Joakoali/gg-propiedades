export const metadata = {
  title: "Aviso Legal",
  description:
    "Aviso Legal de GG Propiedades: Identificación del responsable, información sobre la actividad inmobiliaria, limitaciones de responsabilidad y derechos de propiedad intelectual.",
};

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-muted)" }}>
      {/* Banner header - igual que contacto*/}
      <div
        className="relative flex items-end pb-10 pt-32 overflow-hidden"
        style={{ background: "var(--color-primary)", minHeight: "220px" }}
      >
        <div className="section-container relative z-10">
          <p
            className=" text-sm font-semibold uppercase tracking-[0.2em] mb-2"
            style={{ color: "var(--color-gold)" }}
          >
            Información Legal
          </p>

          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white">
            Aviso Legal
          </h1>
          <p className="text-white/50 mt-2 text-sm">
            Última Actualización : 18/08/2026
          </p>
        </div>
      </div>
      {/*Contenido*/}
      <div className="section-container py-12">
        <div className="bg-white rounded-2xl card-shadow p-8 flex flex-col gap-8 max-w-3xl mx-auto">
          {/* Aca van las secciones por tema*/}
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              1.Identificación del titular
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              El presente sitio web (en adelante, el &quot;Sitio&quot;) es
              operado bajo la marca comercial GG Propiedades, cuyo titular es
              Lucas Gonzalo Govergun, CUIT 20-39627084-7, con matrícula
              profesional CMCPSI N.º 6583, con domicilio legal en Colectora
              Acceso Norte km 50, Concord Rubí, Torre 3, Of. 302, Pilar,
              Provincia de Buenos Aires, Argentina. Para cualquier consulta,
              podes contactarnos a través de info@ggpropiedades.com o al +54 9
              11 2717-7588.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              2. Objeto del sitio
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              GG Propiedades es una inmobiliaria que presta servicios de
              intermediación en la compra, venta, alquiler y tasación de
              propiedades en la Zona Norte del Gran Buenos Aires. A través de
              este Sitio, ponemos a disposición del público información sobre
              propiedades disponibles y un canal de contacto para consultas, sin
              que ello implique la celebración de ningún contrato de forma
              automática. Toda operación inmobiliaria se formaliza
              exclusivamente de manera directa entre las partes, con la
              intervención profesional correspondiente.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              3. Condiciones de uso
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              El acceso y uso de este Sitio es gratuito y está destinado a
              brindar información sobre nuestros servicios inmobiliarios. Al
              utilizarlo, el usuario se compromete a hacerlo de forma diligente,
              de buena fe y conforme a la ley, absteniéndose de utilizarlo con
              fines ilícitos, de dañar el funcionamiento del Sitio, o de
              introducir virus u otros elementos que puedan afectar su normal
              funcionamiento. GG Propiedades se reserva el derecho de restringir
              el acceso al Sitio a quienes incumplan estas condiciones.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              4. Propiedad intelectual
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Los textos, imágenes, fotografías, diseño, logotipos y demás
              contenidos publicados en este Sitio son propiedad de GG
              Propiedades o de terceros que han autorizado su uso, y están
              protegidos por la normativa vigente en materia de propiedad
              intelectual. Queda prohibida su reproducción, distribución o uso
              total o parcial sin autorización previa y por escrito del titular
              correspondiente.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              5. Limitación de responsabilidad
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              La información sobre propiedades publicada en el Sitio (precios,
              disponibilidad, características, fotografías) tiene carácter
              meramente informativo y está sujeta a cambios y a confirmación
              previa por parte de nuestro equipo. GG Propiedades no garantiza la
              disponibilidad permanente ni la exactitud absoluta de dicha
              información, y no se responsabiliza por decisiones tomadas
              exclusivamente en base a los datos publicados sin la
              correspondiente verificación directa con la inmobiliaria.
            </p>
          </section>
          <section>
            <h2>6. Modificaciones</h2>
            <p style={{ color: "var(--color-foreground)" }}>
              GG Propiedades podrá modificar el presente Aviso Legal en
              cualquier momento para adaptarlo a novedades legislativas o
              cambios en el Sitio. La fecha de &quot;Última actualización&quot;
              indicada al inicio de esta página refleja la versión vigente.
              Recomendamos revisar este documento periódicamente.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
