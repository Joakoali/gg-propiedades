export const metadata = {
  title: "Políticas de Privacidad",
  description:
    "Políticas de Privacidad de GG Propiedades: Información sobre cómo recopilamos, usamos y protegemos tu información personal.",
};

export default function PoliticaDePrivacidadPage() {
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
            Políticas de Privacidad
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
              1. Responsable del tratamiento de datos
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              El responsable del tratamiento de los datos personales recabados a
              través de este Sitio es GG Propiedades (Lucas Gonzalo Govergun,
              CUIT 20-39627084-7), con domicilio en Colectora Acceso Norte km
              50, Concord Rubí, Torre 3, Of. 302, Pilar, Provincia de Buenos
              Aires, Argentina. Contacto: info@ggpropiedades.com.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              2. Datos que recopilamos
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              A través del formulario de contacto y de nuestro canal de WhatsApp
              recopilamos los datos que el usuario nos proporciona
              voluntariamente, como nombre, dirección de email y número de
              teléfono, junto con el contenido de la consulta realizada.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              3. Finalidad del tratamiento
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Utilizamos estos datos exclusivamente para responder consultas,
              brindar información sobre propiedades y gestionar la relación
              comercial derivada del contacto (por ejemplo, coordinar una visita
              o el avance de una operación inmobiliaria). No utilizamos estos
              datos con fines distintos a los informados en este documento.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              4. Base legal
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              El tratamiento de tus datos se basa en el consentimiento que
              otorgás al completar el formulario de contacto o al iniciar una
              conversación por WhatsApp, de conformidad con la Ley N.º 25.326 de
              Protección de Datos Personales de la República Argentina.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              5. Con quién compartimos tus datos
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              No compartimos, vendemos ni cedemos tus datos personales a
              terceros, salvo que sea necesario para gestionar tu consulta (por
              ejemplo, con la parte vendedora o compradora de una propiedad de
              tu interés, con tu conocimiento) o que exista una obligación legal
              de hacerlo.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              6. Tus derechos (acceso, rectificación y supresión)
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              De acuerdo con la Ley N.º 25.326, tenés derecho a acceder,
              rectificar, actualizar y solicitar la supresión de tus datos
              personales. La Agencia de Acceso a la Información Pública (AAIP),
              en su carácter de Órgano de Control de la Ley N.º 25.326, tiene la
              atribución de atender las quejas y reclamos que interpongan
              quienes resulten afectados en sus derechos por incumplimiento de
              las normas vigentes en materia de protección de datos personales.
              Para ejercer estos derechos, podés escribirnos a
              info@ggpropiedades.com.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              7. Conservación de los datos
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Conservamos tus datos únicamente durante el tiempo necesario para
              cumplir con la finalidad para la cual fueron recabados, o hasta
              que solicites su eliminación.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              8. Seguridad de los datos
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Adoptamos medidas razonables de seguridad para proteger tus datos
              personales contra pérdida, acceso no autorizado o uso indebido.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              9. Modificaciones
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Esta Política de Privacidad podrá actualizarse en el futuro. La
              fecha de &quot;Última actualización&quot; indicada al inicio de
              esta página refleja la versión vigente.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
