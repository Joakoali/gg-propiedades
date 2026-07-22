# Guía: cómo hacer que GG Propiedades aparezca en ChatGPT, Gemini y Claude

El sitio ya tiene la parte técnica lista (schema, páginas de zona, llms.txt,
sitemap). Estas son las acciones que NO son código, en orden de impacto.
Los asistentes de IA no tienen índices propios: ChatGPT busca en Bing,
Gemini en Google y Claude en Brave. Todo lo que mejore tu presencia en esos
buscadores y en Google Maps mejora tus chances de aparecer en respuestas de IA.

## 1. Registrar el sitio en Google Search Console (30 min, una vez)

1. Entrar a https://search.google.com/search-console con la cuenta de Google del negocio.
2. Agregar propiedad → "Prefijo de URL" → `https://ggpropiedades.com`.
3. Elegir verificación por "Etiqueta HTML": copiar el código `content="..."`.
4. Pasarle el código al desarrollador para pegarlo en `app/layout.tsx`
   (bloque `verification.google`) y hacer deploy.
5. Volver a Search Console y tocar "Verificar".
6. En "Sitemaps", enviar `https://ggpropiedades.com/sitemap.xml`.

## 2. Registrar el sitio en Bing Webmaster Tools (20 min, una vez) — CRÍTICO

Bing es el buscador que usa ChatGPT. Casi ninguna inmobiliaria argentina lo
hace: es una ventaja gratis.

1. Entrar a https://www.bing.com/webmasters con una cuenta Microsoft.
2. Opción más fácil: "Importar desde Google Search Console" (hereda la
   verificación del paso 1). Si no, verificación por meta tag: copiar el
   código `msvalidate.01` y pasárselo al desarrollador
   (`app/layout.tsx`, bloque `verification.other`).
3. Enviar el sitemap `https://ggpropiedades.com/sitemap.xml`.

## 3. Reseñas en Google Maps (continuo — la palanca más fuerte)

Para preguntas tipo "mejores inmobiliarias de Pilar", las IA se apoyan en la
ficha de Google y sus reseñas. Ya tienen ~4.600 reseñas: el objetivo es que
las nuevas mencionen zona y operación.

- Después de cada operación cerrada, pedir la reseña con un mensaje tipo:
  "¿Nos dejás una reseña contando qué compraste/vendiste y en qué zona?
  Ej.: 'Compramos una casa en un barrio cerrado de Pilar con GG'".
- Responder todas las reseñas (buenas y malas) mencionando la zona con
  naturalidad: "¡Gracias! Un gusto ayudarlos a encontrar su casa en Escobar".

## 4. Mantener la ficha de Google Maps (15 min por semana)

- Categoría principal: "Agencia inmobiliaria"; agregar secundarias si
  aplican ("Agencia de tasación", etc.).
- Subir fotos nuevas cada semana (propiedades, oficina, equipo).
- Usar "Publicaciones" para novedades (propiedades destacadas, tasación
  gratuita).
- Verificar que dirección, teléfono y horario estén EXACTAMENTE iguales a
  los del pie del sitio web (consistencia NAP): +54 11 6674-0000, lunes a
  sábado de 10 a 18.
- En "Sitio web" de la ficha, confirmar que apunte a
  `https://ggpropiedades.com`.

## 5. Menciones en listas y prensa (continuo, sin apuro)

Las IA citan mucho artículos tipo "mejores inmobiliarias de X". Acciones:

- Buscar en Google y en ChatGPT "mejores inmobiliarias de Pilar" y anotar
  qué páginas aparecen; contactar a esos sitios/directorios para figurar.
- Sumarse a directorios del sector (cámaras inmobiliarias, guías locales
  de Pilar y Escobar) con el link al sitio.
- Si hay contactos con medios locales (diarios de Pilar/Escobar, portales
  de noticias zonales), ofrecer notas de mercado ("cuánto cuesta mudarse a
  un barrio cerrado en Pilar en 2026") firmadas por GG Propiedades con link.

## 6. Medir el progreso (una vez por mes)

- Preguntar a ChatGPT, Gemini y Claude: "¿qué inmobiliarias me recomendás
  en Pilar?" y "¿inmobiliarias en barrios cerrados de Escobar?" — anotar si
  GG aparece y qué fuentes cita la respuesta.
- En Google Search Console: revisar "Rendimiento" → consultas con
  "pilar"/"escobar"; deberían crecer las impresiones de las páginas
  `/inmobiliaria-en-*`.
- En Bing Webmaster Tools: revisar que las páginas estén indexadas
  ("Explorador de sitios").

## Mantenimiento del contenido del sitio

- Los precios orientativos de las páginas de zona deben revisarse cada
  ~6 meses (el desarrollador los tiene en `app/lib/zone-content.ts`).
- Si abren una nueva zona de trabajo, pedir una página de zona nueva: es
  agregar una entrada de contenido, no un desarrollo.
