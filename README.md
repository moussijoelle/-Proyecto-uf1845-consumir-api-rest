# Historias que importan — galería con Open Library (UF1845)

Catálogo de libros reales (biografías, historia y memorias) consumiendo la API de Open Library. Proyecto del módulo UF1845.

## Qué hace

- Eliges categoría: Biografías, Historia o Memorias
- Carga resultados desde Open Library (español o francés)
- Muestra solo libros con autor y portada; evita duplicados
- Vista lista o vista galería (se guarda en `localStorage`)
- Tema claro / oscuro con fondos distintos (también se recuerda)
- Paginación (hasta 12 páginas, 10 libros por página)
- Al hacer clic en un libro abre un diálogo con más detalle (y, si puede, la ficha de la obra)

## Cómo probarlo

No necesita build ni servidor propio. Abre `index.html` en el navegador (hace falta red para la API) o usa la demo.

Demo: https://moussijoelle.github.io/-Proyecto-uf1845-consumir-api-rest/

## Cómo lo construí

- HTML + JavaScript + Tailwind (CDN / browser)
- Peticiones con `fetch` a `openlibrary.org/search.json` y a la ficha de cada obra
- Portadas desde `covers.openlibrary.org`
- Toda la lógica en `js/app.js` (URL, filtro, paginación, vistas, tema, modal)
- Imágenes de marca y fondos en `img/`

## Cómo verificarlo

Sin tests automáticos. Abro la demo, cambio de categoría, paso páginas, alterno lista/galería y tema, y miro que el modal muestre título, autor y portada. También compruebo que al recargar se mantengan tema y vista.

---

Moussi Joelle  
https://github.com/moussijoelle/-Proyecto-uf1845-consumir-api-rest
