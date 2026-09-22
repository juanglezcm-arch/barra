# Barra · tracker de calistenia

App web instalable (PWA) para entrenar calistenia con el móvil: te da el siguiente entreno de la secuencia A/B, apuntas cada serie con un toque y sube o baja de variante sola según tus resultados. Funciona sin conexión y los datos se guardan solo en el móvil.

## Publicarla gratis (GitHub Pages)

1. Crea un repositorio público en GitHub, por ejemplo `barra`.
2. Sube todo el contenido de esta carpeta a la raíz del repositorio (con `.nojekyll` incluido).
3. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`** y guarda.
4. En uno o dos minutos estará en `https://TU-USUARIO.github.io/barra/`.

Alternativas igual de gratuitas: Cloudflare Pages o Netlify (arrastrando la carpeta).

## Instalarla en el móvil

- **Android (Chrome):** abre la URL → menú ⋮ → **Instalar aplicación**.
- **iPhone (Safari):** abre la URL → botón Compartir → **Añadir a pantalla de inicio**.

Ábrela una vez con conexión; a partir de ahí funciona sin cobertura.

## Actualizar la app

1. Sustituye los archivos que cambien (normalmente `catalogo.json` y/o `app.js`).
2. Sube la versión en **dos sitios**: `VERSION` en `sw.js` y `APP_VERSION` en `app.js`.
3. Haz commit. La próxima vez que abras la app aparecerá **"Hay una versión nueva · Actualizar"**.

Si no subes `VERSION` en `sw.js`, el móvil seguirá usando la versión guardada.

## Tus datos

- Se guardan en el almacenamiento del navegador del móvil. No hay servidor ni cuenta.
- **Ajustes → Descargar copia de seguridad** cada pocas semanas. La app te lo recuerda.
- Para revisar tu progreso con Claude: **Ajustes → Copiar como texto** y pégalo en el chat.
- Desinstalar la app o borrar los datos del navegador borra el historial.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Estructura y estilos |
| `app.js` | Lógica: plantillas A/B, progresión, registro, historial |
| `catalogo.json` | Ejercicios, escaleras, principios y conflictos ingeridos de los clippings |
| `sw.js` | Service worker: funcionamiento sin conexión y actualizaciones |
| `manifest.webmanifest`, `icons/` | Instalación en el móvil |
| `fonts/` | Barlow y Barlow Condensed servidas en local |
| `docs/catalogo-calistenia.md` | El catálogo en versión legible (se genera con `python3 tools/catalogo_md.py`) |

## Trabajar con Claude

- Con el repositorio público, Claude puede leer los archivos actuales directamente de GitHub; basta con darle la URL del repo.
- Nuevos clippings: pásaselos a Claude junto con la URL del repo. Te devuelve `catalogo.json` (y `app.js` si cambian las plantillas) listos para sustituir.
