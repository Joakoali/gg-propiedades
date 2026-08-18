export const metadata = {
  title: "Políticas de Cookies",
  description:
    "Políticas de Cookies de GG Propiedades: Información sobre el uso de cookies en nuestro sitio web.",
};

export default function PoliticaDeCookiesPage() {
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
            Políticas de Cookies
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
              1. ¿Qué son las cookies?
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Las cookies son pequeños archivos de texto que un sitio web
              almacena en el dispositivo del usuario al navegarlo, con el fin de
              recordar información sobre la visita, como preferencias o el
              estado de una sesión.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              2. Cookies que utiliza este sitio
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Este Sitio utiliza únicamente una cookie técnica de sesión,
              necesaria para el funcionamiento del panel de administración
              interno (área privada de gestión de GG Propiedades). Esta cookie
              es de carácter estrictamente funcional, no recopila datos con
              fines publicitarios ni de seguimiento, y se elimina al cerrar la
              sesión.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              3. Cookies de análisis o publicidad
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Actualmente este Sitio no utiliza cookies de análisis (como Google
              Analytics), de publicidad ni de redes sociales. Si en el futuro
              incorporamos herramientas de este tipo, actualizaremos esta
              política y, de corresponder, solicitaremos el consentimiento
              previo del usuario mediante un aviso en el Sitio.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              4. Cómo gestionar las cookies
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Podés configurar tu navegador para bloquear o eliminar las cookies
              almacenadas. Tené en cuenta que, al tratarse de una cookie
              estrictamente necesaria para el funcionamiento del panel de
              administración, bloquearla podría afectar el acceso a esa sección
              del Sitio (esto no afecta la navegación pública ni la consulta de
              propiedades).
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">
              5. Modificaciones
            </h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Esta Política de Cookies podrá actualizarse para reflejar cambios
              en las herramientas utilizadas por el Sitio. La fecha de
              &quot;Última actualización&quot; indicada al inicio de esta página
              refleja la versión vigente.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold mb-3">6. Contacto</h2>
            <p style={{ color: "var(--color-foreground)" }}>
              Si tienes alguna pregunta sobre esta Política de Cookies, no dudes
              en contactarnos a través de nuestro formulario de contacto.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
