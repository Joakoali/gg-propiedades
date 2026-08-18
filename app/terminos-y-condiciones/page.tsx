export const metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y Condiciones de GG Propiedades: Información sobre los términos y condiciones de uso del sitio web.",
};

export default function TerminosYCondicionesPage() {
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
            Términos y Condiciones
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
              1. Objeto y aceptación de los términos
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Los presentes Términos y Condiciones regulan el acceso y uso del
              sitio web de GG Propiedades. El uso del Sitio implica la
              aceptación plena de estos términos. Si no estás de acuerdo con
              ellos, te pedimos que no utilices el Sitio.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              2. Uso del sitio y de la información publicada
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              El Sitio tiene como finalidad brindar información sobre
              propiedades en venta o alquiler y facilitar el contacto con GG
              Propiedades. El usuario se compromete a utilizar el Sitio y su
              contenido de forma lícita, sin infringir derechos de terceros ni
              afectar su normal funcionamiento.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              3. Precios y disponibilidad de las propiedades
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Los precios, características y disponibilidad de las propiedades
              publicadas en el Sitio son referenciales y están sujetos a cambios
              sin previo aviso. La información definitiva de cada propiedad debe
              confirmarse directamente con GG Propiedades antes de avanzar en
              cualquier operación.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              4. Formulario de contacto y comunicaciones
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Al completar el formulario de contacto o escribirnos por WhatsApp,
              el usuario declara que los datos proporcionados son propios y
              veraces, y autoriza a GG Propiedades a utilizarlos para responder
              su consulta, conforme a lo establecido en nuestra Política de
              Privacidad.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              5. Legislación aplicable y jurisdicción
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Estos Términos y Condiciones se rigen por las leyes de la
              República Argentina. Para cualquier controversia derivada del uso
              del Sitio, las partes se someten a la jurisdicción de los
              tribunales ordinarios competentes de la Provincia de Buenos Aires,
              con renuncia a cualquier otro fuero que pudiera corresponder.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              6. Modificaciones
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              GG Propiedades podrá modificar estos Términos y Condiciones en
              cualquier momento. La fecha de &quot;Última actualización&quot;
              indicada al inicio de esta página refleja la versión vigente.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
