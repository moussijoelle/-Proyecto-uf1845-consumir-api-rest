// MAPEO DEL DOM

const btnTema = document.getElementById("btn-tema");
const iconoSol = document.getElementById("icono-sol");
const iconoLuna = document.getElementById("icono-luna");
const btnLista = document.getElementById("btn-lista");
const btnGaleria = document.getElementById("btn-galeria");
const contenedorLibros = document.getElementById("contenedor-libros");
const estado = document.getElementById("estado");
const navPaginas = document.getElementById("nav-paginas");
const listaPaginas = document.getElementById("lista-paginas");
const btnPagAnterior = document.getElementById("btn-pag-anterior");
const btnPagSiguiente = document.getElementById("btn-pag-siguiente");
const botonesCategoria = document.querySelectorAll(".categoria-btn");
const dialogLibro = document.getElementById("dialog-libro");
const dialogContenido = document.getElementById("dialog-contenido");

// DECLARACIÓN DE VARIABLES

const API_BASE = "https://openlibrary.org/search.json";
const LIBROS_POR_PAGINA = 10;
const LIMITE_BUSQUEDA = 100;
const FILTRO_IDIOMA = "(language:spa OR language:fre)";
const MAX_PAGINAS = 12;

const CATEGORIAS = {
  biografias: `subject:biography ${FILTRO_IDIOMA}`,
  historia: `subject:history ${FILTRO_IDIOMA}`,
  memorias: `subject:autobiography ${FILTRO_IDIOMA}`,
};

const NOMBRES_CATEGORIA = {
  biografias: "Biografías",
  historia: "Historia",
  memorias: "Memorias",
};

const CLAVE_TEMA = "tema";
const CLAVE_VISTA = "vista";

const CLASE_CONTENEDOR_LISTA =
  "overflow-hidden rounded-xl border border-slate-200 bg-white/95 dark:border-slate-600 dark:bg-slate-800/95";
const CLASE_CONTENEDOR_GALERIA =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

let categoriaActual = null;
let paginaActual = 1;
let totalPaginas = 0;
let librosActuales = [];

// DECLARACIÓN DE FUNCIONES

// --- Independientes (sin DOM) ---

const construirUrlApi = (categoria, pagina) => {
  const url = new URL(API_BASE);
  url.searchParams.set("q", CATEGORIAS[categoria]);
  url.searchParams.set("page", String(pagina));
  url.searchParams.set("limit", String(LIMITE_BUSQUEDA));
  url.searchParams.set(
    "fields",
    "key,title,author_name,cover_i,first_publish_year,publisher,first_sentence,subject,language"
  );
  return url.toString();
};

const obtenerLibros = async (categoria, pagina) => {
  const response = await fetch(construirUrlApi(categoria, pagina));

  if (response.ok === false) {
    throw new Error("No se pudieron cargar los libros.");
  }

  const data = await response.json();
  return data;
};

const obtenerAutor = (libro) => {
  let autor = "";

  if (libro.author_name && libro.author_name.length > 0) {
    autor = libro.author_name[0];
  } else {
    autor = "Autor desconocido";
  }

  return autor;
};

const obtenerIdLibro = (libro) => {
  let id = "";

  if (libro.key) {
    id = libro.key;
  } else {
    const titulo = libro.title || "";
    id = `${titulo}|${obtenerAutor(libro)}`;
  }

  return id;
};

const tieneAutorConocido = (libro) => {
  let valido = false;

  if (libro.author_name && libro.author_name.length > 0) {
    const autor = libro.author_name[0].trim();
    if (autor !== "") {
      valido = true;
    }
  }

  return valido;
};

const tienePortada = (libro) => {
  return Boolean(libro.cover_i);
};

const libroEsValido = (libro) => {
  return tieneAutorConocido(libro) && tienePortada(libro);
};

const filtrarLibrosValidos = (libros) => {
  let filtrados = [];
  const idsEnPagina = new Set();

  for (let indice = 0; indice < libros.length; indice = indice + 1) {
    const libro = libros[indice];
    const id = obtenerIdLibro(libro);

    if (libroEsValido(libro) === false) {
      continue;
    }

    if (idsEnPagina.has(id)) {
      continue;
    }

    idsEnPagina.add(id);
    filtrados.push(libro);
  }

  return filtrados;
};

const obtenerPortada = (libro, tamano) => {
  return `https://covers.openlibrary.org/b/id/${libro.cover_i}-${tamano}.jpg`;
};

const escaparHtml = (texto) => {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
};

const obtenerNombreCategoria = (categoria) => {
  return NOMBRES_CATEGORIA[categoria] || "General";
};

const obtenerResumen = (libro) => {
  let resumen = "";

  if (libro.first_sentence) {
    if (Array.isArray(libro.first_sentence)) {
      resumen = libro.first_sentence[0];
    } else {
      resumen = libro.first_sentence;
    }
  }

  return resumen.trim();
};

const acortarTexto = (texto, maximo) => {
  let resultado = "";

  if (texto.length > maximo) {
    resultado = texto.substring(0, maximo) + "...";
  } else {
    resultado = texto;
  }

  return resultado;
};

const obtenerDetalleObra = async (libro) => {
  let datos = null;

  if (libro.key) {
    const url = `https://openlibrary.org${libro.key}.json`;
    const response = await fetch(url);

    if (response.ok === true) {
      datos = await response.json();
    }
  }

  return datos;
};

const extraerDescripcion = (datosObra, libro) => {
  let descripcion = obtenerResumen(libro);

  if (datosObra && datosObra.description) {
    let descripcionObra = "";

    if (typeof datosObra.description === "string") {
      descripcionObra = datosObra.description;
    } else if (datosObra.description.value) {
      descripcionObra = datosObra.description.value;
    }

    if (descripcionObra.length > descripcion.length) {
      descripcion = descripcionObra;
    }
  }

  if (descripcion === "") {
    descripcion = "No hay descripción disponible para este libro.";
  }

  return descripcion;
};

const obtenerNumeroLibro = (paginaActual, indice) => {
  return (paginaActual - 1) * LIBROS_POR_PAGINA + indice + 1;
};

const construirItemLista = (libro, indice, categoria) => {
  const titulo = escaparHtml(libro.title || "Sin título");
  const autor = escaparHtml(obtenerAutor(libro));
  const genero = escaparHtml(obtenerNombreCategoria(categoria));
  const anio = libro.first_publish_year || "—";
  const portada = obtenerPortada(libro, "S");
  const textoResumen = obtenerResumen(libro);
  const resumen = escaparHtml(acortarTexto(textoResumen, 120));
  const bloqueResumen = textoResumen
    ? `<p class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">${resumen}</p>`
    : "";

  return `
    <li class="btn-detalle border-b border-slate-100 py-3 pl-2 hover:bg-[#e8f0fe]/50 dark:border-slate-700 dark:hover:bg-[#1e3a5f]/30" data-indice="${indice}">
      <div class="flex gap-3">
        <img src="${portada}" alt="" class="size-14 shrink-0 rounded-md object-cover shadow-sm">
        <div class="min-w-0 flex-1">
          <p class="font-medium text-rose-900 dark:text-rose-200">${titulo}</p>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">${autor} · ${genero} · ${anio}</p>
          ${bloqueResumen}
        </div>
      </div>
    </li>
  `;
};

const construirTarjetaGaleria = (libro, indice) => {
  const titulo = escaparHtml(libro.title || "Sin título");
  const autor = escaparHtml(obtenerAutor(libro));
  const portada = obtenerPortada(libro, "M");

  return `
    <button type="button" class="btn-detalle overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm hover:shadow-md dark:border-slate-600 dark:bg-slate-800" data-indice="${indice}">
      <img src="${portada}" alt="Portada de ${titulo}" class="h-44 w-full object-cover" loading="lazy">
      <div class="p-3">
        <p class="line-clamp-2 font-semibold text-rose-900 dark:text-rose-200">${titulo}</p>
        <p class="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">${autor}</p>
      </div>
    </button>
  `;
};

const construirHtmlLibros = (libros, esGaleria, paginaActual, categoria) => {
  let html = "";

  if (esGaleria === true) {
    for (let indice = 0; indice < libros.length; indice = indice + 1) {
      html = html + construirTarjetaGaleria(libros[indice], indice);
    }
  } else {
    const inicioLista = obtenerNumeroLibro(paginaActual, 0);
    html = `<ol class="list-decimal space-y-0 px-6 py-4 marker:font-semibold marker:text-rose-800 dark:marker:text-rose-200" start="${inicioLista}">`;

    for (let indice = 0; indice < libros.length; indice = indice + 1) {
      html = html + construirItemLista(libros[indice], indice, categoria);
    }

    html = html + "</ol>";
  }

  return html;
};

const construirHtmlDialog = (libro, categoria, descripcion) => {
  const titulo = escaparHtml(libro.title || "Sin título");
  const autor = escaparHtml(obtenerAutor(libro));
  const anio = libro.first_publish_year || "No disponible";
  const editorial = libro.publisher ? escaparHtml(libro.publisher[0]) : "No disponible";
  const genero = escaparHtml(obtenerNombreCategoria(categoria));
  const portada = obtenerPortada(libro, "L");
  const descripcionHtml = escaparHtml(descripcion);

  return `
    <div class="flex flex-col gap-4 sm:flex-row">
      <img src="${portada}" alt="Portada de ${titulo}" class="mx-auto h-52 w-36 shrink-0 rounded-lg object-cover shadow-md sm:mx-0">
      <div class="min-w-0 flex-1">
        <h2 class="mb-2 text-xl font-bold text-rose-900 dark:text-rose-200">${titulo}</h2>
        <p class="mb-1"><strong>Autor:</strong> ${autor}</p>
        <p class="mb-1"><strong>Género:</strong> ${genero}</p>
        <p class="mb-1"><strong>Año:</strong> ${anio}</p>
        <p><strong>Editorial:</strong> ${editorial}</p>
      </div>
    </div>
    <div class="mt-4 rounded-lg border border-slate-200 p-3 dark:border-slate-600">
      <h3 class="mb-2 font-semibold">Descripción</h3>
      <p class="max-h-48 overflow-y-auto text-sm leading-relaxed text-slate-700 dark:text-slate-300">${descripcionHtml}</p>
    </div>
  `;
};

const calcularTotalPaginas = (numFound) => {
  return Math.min(MAX_PAGINAS, Math.ceil(numFound / LIBROS_POR_PAGINA));
};

const calcularPaginasAMostrar = (totalPaginas) => {
  let paginas = totalPaginas;

  if (paginas > MAX_PAGINAS) {
    paginas = MAX_PAGINAS;
  }

  if (paginas < 1) {
    paginas = 1;
  }

  return paginas;
};

const acumularLibrosValidos = async (categoria, paginaInicio) => {
  let librosValidos = [];
  let numFound = 0;
  let apiPagina = paginaInicio;
  const idsVistos = new Set();
  const maxApiPagina = paginaInicio + MAX_PAGINAS;

  while (librosValidos.length < LIBROS_POR_PAGINA && apiPagina <= maxApiPagina) {
    const data = await obtenerLibros(categoria, apiPagina);
    numFound = data.numFound || 0;

    const docs = data.docs || [];
    if (docs.length === 0) {
      break;
    }

    const filtrados = filtrarLibrosValidos(docs);

    for (let indice = 0; indice < filtrados.length; indice = indice + 1) {
      const libro = filtrados[indice];
      const id = obtenerIdLibro(libro);

      if (idsVistos.has(id)) {
        continue;
      }

      idsVistos.add(id);
      librosValidos.push(libro);

      if (librosValidos.length >= LIBROS_POR_PAGINA) {
        break;
      }
    }

    const totalApiPaginas = Math.ceil(numFound / LIMITE_BUSQUEDA);
    if (apiPagina >= totalApiPaginas) {
      break;
    }

    apiPagina = apiPagina + 1;
  }

  return { librosValidos, numFound };
};

const prepararDescripcionDetalle = async (libro) => {
  let descripcion = obtenerResumen(libro);

  try {
    const datosObra = await obtenerDetalleObra(libro);
    descripcion = extraerDescripcion(datosObra, libro);
  } catch (error) {
    if (descripcion === "") {
      descripcion = "No se pudo cargar la descripción.";
    }
  }

  return descripcion;
};

const prepararCargaLibros = async (categoria, paginaInicio) => {
  const resultadoApi = await acumularLibrosValidos(categoria, paginaInicio);
  const libros = resultadoApi.librosValidos.slice(0, LIBROS_POR_PAGINA);
  const total = calcularTotalPaginas(resultadoApi.numFound);

  return {
    libros,
    totalPaginas: total,
    hayLibros: libros.length > 0,
  };
};

const construirTextoEstado = (categoria, pagina, cantidadLibros) => {
  const nombre = obtenerNombreCategoria(categoria);
  return `${nombre} — Página ${pagina} — ${cantidadLibros} libros`;
};

const construirTextoSinLibros = (categoria) => {
  const nombre = obtenerNombreCategoria(categoria);
  return `${nombre} — No hay libros con autor y portada en esta página.`;
};

const guardarTemaEnStorage = (clave, esOscuro) => {
  let valor = "";

  if (esOscuro === true) {
    valor = "dark";
  } else {
    valor = "light";
  }

  localStorage.setItem(clave, valor);
  return valor;
};

const guardarVistaEnStorage = (clave, vista) => {
  localStorage.setItem(clave, vista);
  return vista;
};

const obtenerVistaDesdeStorage = (clave) => {
  return localStorage.getItem(clave);
};

const resolverVistaInicial = (vistaGuardada) => {
  let vista = "";

  if (vistaGuardada === "galeria") {
    vista = "galeria";
  } else {
    vista = "lista";
  }

  return vista;
};

// --- Interfaz (con DOM) ---

const esVistaGaleria = () => {
  return btnGaleria.classList.contains("activo");
};

const actualizarIconoTema = () => {
  const esOscuro = document.documentElement.classList.contains("dark");

  if (esOscuro === true) {
    iconoSol.classList.add("hidden");
    iconoLuna.classList.remove("hidden");
  } else {
    iconoSol.classList.remove("hidden");
    iconoLuna.classList.add("hidden");
  }
};

const cambiarTema = () => {
  document.documentElement.classList.toggle("dark");
  const esOscuro = document.documentElement.classList.contains("dark");
  guardarTemaEnStorage(CLAVE_TEMA, esOscuro);
  actualizarIconoTema();
};

const aplicarVista = (vista) => {
  let vistaFinal = vista;

  if (vista === "galeria") {
    contenedorLibros.className = CLASE_CONTENEDOR_GALERIA;
    btnLista.classList.remove("activo");
    btnGaleria.classList.add("activo");
    btnLista.setAttribute("aria-pressed", "false");
    btnGaleria.setAttribute("aria-pressed", "true");
  } else {
    contenedorLibros.className = CLASE_CONTENEDOR_LISTA;
    btnGaleria.classList.remove("activo");
    btnLista.classList.add("activo");
    btnGaleria.setAttribute("aria-pressed", "false");
    btnLista.setAttribute("aria-pressed", "true");
    vistaFinal = "lista";
  }

  guardarVistaEnStorage(CLAVE_VISTA, vistaFinal);
};

const abrirDialogDetalle = async (libro, categoria) => {
  dialogContenido.innerHTML = `
    <p class="mb-3 text-center text-sm italic text-slate-500">Cargando descripción...</p>
  `;
  dialogLibro.showModal();

  const descripcion = await prepararDescripcionDetalle(libro);
  const html = construirHtmlDialog(libro, categoria, descripcion);
  dialogContenido.innerHTML = html;
};

const alClicarDetalle = (evento) => {
  const indice = Number(evento.currentTarget.dataset.indice);
  const libro = librosActuales[indice];
  abrirDialogDetalle(libro, categoriaActual);
};

const pintarLibros = (libros, pagina, categoria) => {
  const esGaleria = esVistaGaleria();
  const html = construirHtmlLibros(libros, esGaleria, pagina, categoria);
  contenedorLibros.innerHTML = html;

  const botonesDetalle = contenedorLibros.querySelectorAll(".btn-detalle");
  for (const boton of botonesDetalle) {
    boton.addEventListener("click", alClicarDetalle);
  }
};

const marcarCategoriaActiva = (categoria) => {
  for (const boton of botonesCategoria) {
    if (boton.dataset.categoria === categoria) {
      boton.classList.add("activo");
    } else {
      boton.classList.remove("activo");
    }
  }
};

const alClicarPagina = (evento) => {
  if (categoriaActual !== null) {
    paginaActual = Number(evento.currentTarget.dataset.pagina);
    cargarLibros();
  }
};

const pintarPaginacion = (pagina, total) => {
  listaPaginas.innerHTML = "";
  const paginasAMostrar = calcularPaginasAMostrar(total);

  for (let numero = 1; numero <= paginasAMostrar; numero = numero + 1) {
    const li = document.createElement("li");
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn-pagina";
    boton.textContent = String(numero);
    boton.dataset.pagina = String(numero);

    if (numero === pagina) {
      boton.classList.add("activo");
    } else {
      boton.classList.remove("activo");
    }

    boton.addEventListener("click", alClicarPagina);
    li.appendChild(boton);
    listaPaginas.appendChild(li);
  }

  btnPagAnterior.disabled = pagina <= 1;
  btnPagSiguiente.disabled = pagina >= paginasAMostrar;
  navPaginas.classList.remove("hidden");
};

const actualizarEstado = (categoria, pagina, cantidadLibros) => {
  estado.textContent = construirTextoEstado(categoria, pagina, cantidadLibros);
};

const cargarLibros = async () => {
  if (categoriaActual !== null) {
    try {
      estado.textContent = "Cargando libros...";
      contenedorLibros.innerHTML = "";

      const resultado = await prepararCargaLibros(categoriaActual, paginaActual);
      librosActuales = resultado.libros;
      totalPaginas = resultado.totalPaginas;

      if (resultado.hayLibros === false) {
        estado.textContent = construirTextoSinLibros(categoriaActual);
        pintarPaginacion(paginaActual, totalPaginas);
      } else {
        pintarLibros(librosActuales, paginaActual, categoriaActual);
        pintarPaginacion(paginaActual, totalPaginas);
        actualizarEstado(categoriaActual, paginaActual, librosActuales.length);
      }
    } catch (error) {
      estado.textContent = error.message;
      contenedorLibros.innerHTML = "";
      navPaginas.classList.add("hidden");
    }
  }
};

const elegirCategoria = (categoria) => {
  categoriaActual = categoria;
  paginaActual = 1;
  marcarCategoriaActiva(categoria);
  cargarLibros();
};

const alClicarCategoria = (evento) => {
  const categoria = evento.currentTarget.dataset.categoria;
  elegirCategoria(categoria);
};

const irPaginaAnterior = () => {
  if (categoriaActual !== null && paginaActual > 1) {
    paginaActual = paginaActual - 1;
    cargarLibros();
  }
};

const irPaginaSiguiente = () => {
  const maxPag = calcularPaginasAMostrar(totalPaginas);

  if (categoriaActual !== null && paginaActual < maxPag) {
    paginaActual = paginaActual + 1;
    cargarLibros();
  }
};

const alClicarLista = () => {
  aplicarVista("lista");

  if (librosActuales.length > 0) {
    pintarLibros(librosActuales, paginaActual, categoriaActual);
  }
};

const alClicarGaleria = () => {
  aplicarVista("galeria");

  if (librosActuales.length > 0) {
    pintarLibros(librosActuales, paginaActual, categoriaActual);
  }
};

const enlazarEscuchadores = () => {
  btnTema.addEventListener("click", cambiarTema);
  btnLista.addEventListener("click", alClicarLista);
  btnGaleria.addEventListener("click", alClicarGaleria);

  for (const boton of botonesCategoria) {
    boton.addEventListener("click", alClicarCategoria);
  }

  btnPagAnterior.addEventListener("click", irPaginaAnterior);
  btnPagSiguiente.addEventListener("click", irPaginaSiguiente);
};

const aplicarVistaGuardada = () => {
  const vistaGuardada = obtenerVistaDesdeStorage(CLAVE_VISTA);
  const vista = resolverVistaInicial(vistaGuardada);
  aplicarVista(vista);
};

// FUNCIÓN PRINCIPAL

const funcionPrincipal = () => {
  enlazarEscuchadores();
  actualizarIconoTema();
  aplicarVistaGuardada();
};

// EJECUCIÓN DE CÓDIGO

funcionPrincipal();
