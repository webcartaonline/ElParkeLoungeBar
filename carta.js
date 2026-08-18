/* =========================================================
   El Parke Lounge Bar — motor de la carta
   ---------------------------------------------------------
   Toda la web es UNA sola página. El contenido (secciones,
   grupos y productos) vive en carta.json y aquí se dibuja,
   generando exactamente el mismo HTML que tenían las páginas
   antiguas escritas a mano: las mismas etiquetas y las mismas
   clases, para que estilos.css siga funcionando sin tocar nada.

   Qué se muestra lo dice la dirección, en la parte de después
   de la almohadilla:

       #es               -> portada en español
       #en               -> portada en inglés
       #es/tapeo         -> la sección Tapeo en español
       #en/cafeOtros     -> la sección Café y otros en inglés

   Así el botón "atrás" del móvil sigue funcionando, se puede
   enlazar a una sección concreta y al recargar se vuelve al
   mismo sitio. Si no hay nada escrito, se elige el idioma
   guardado de la última visita o el del navegador.

   Bilingüe ES / EN: solo cambia el texto. El precio, los
   alérgenos y los identificadores son los mismos en los dos
   idiomas.
   ========================================================= */

const RUTA_JSON = 'carta.json';
const CLAVE_IDIOMA = 'elParke.idioma';

/* ---------- Textos fijos que no salen del JSON ---------- */
const UI = {
  es: {
    cargando: 'Cargando la carta…',
    error: 'No se ha podido cargar la carta',
    idioma: 'Seleccionar idioma',
    volver: 'Volver a la portada',
    alergenos: 'Alergenos y otros',
    contiene: 'Contiene'
  },
  en: {
    cargando: 'Loading the menu…',
    error: 'The menu could not be loaded',
    idioma: 'Select language',
    volver: 'Back to the home page',
    alergenos: 'Allergens and other information',
    contiene: 'Contains'
  }
};

/* ---------- Alérgenos (los 14 de declaración obligatoria) ----------
   PREPARADO PERO SIN USAR. Mientras la lista "alergenos" de un
   producto esté vacía en carta.json, aquí no se pinta nada y la
   página se ve igual que siempre.

   Para activarlos basta con escribir los nombres en el JSON:
       "alergenos": ["gluten", "lacteos"]
   No hay que tocar este archivo. */
const ALERGENOS = {
  'gluten': { es: 'Gluten', en: 'Gluten', icono: '🌾' },
  'crustaceos': { es: 'Crustáceos', en: 'Crustaceans', icono: '🦐' },
  'huevos': { es: 'Huevos', en: 'Eggs', icono: '🥚' },
  'pescado': { es: 'Pescado', en: 'Fish', icono: '🐟' },
  'cacahuetes': { es: 'Cacahuetes', en: 'Peanuts', icono: '🥜' },
  'soja': { es: 'Soja', en: 'Soya', icono: '🌱' },
  'lacteos': { es: 'Leche', en: 'Milk', icono: '🥛' },
  'frutos-secos': { es: 'Frutos de cáscara', en: 'Tree nuts', icono: '🌰' },
  'apio': { es: 'Apio', en: 'Celery', icono: '🥬' },
  'mostaza': { es: 'Mostaza', en: 'Mustard', icono: '🌭' },
  'sesamo': { es: 'Sésamo', en: 'Sesame', icono: '⚪' },
  'sulfitos': { es: 'Sulfitos', en: 'Sulphites', icono: '🍇' },
  'altramuces': { es: 'Altramuces', en: 'Lupin', icono: '🌸' },
  'moluscos': { es: 'Moluscos', en: 'Molluscs', icono: '🐚' },
  'alcohol': { es: 'Alcohol', en: 'Alcohol', icono: '🍷' }
};

/* ---------- Estado ---------- */
const app = {
  datos: null,
  idioma: 'es',
  seccion: null   // null = portada
};

/* ---------- Utilidades ---------- */

const ui = () => UI[app.idioma];

/* Devuelve el texto en el idioma activo.
   Tolera que el campo sea un texto plano en vez de un objeto {es,en}.

   Ojo: solo se recurre al otro idioma cuando la traducción NO existe.
   Un texto vacío es una decisión válida (hay productos sin descripción
   en español que sí la tienen en inglés), y respetarlo evita que se
   cuele inglés en la carta española. */
function t(campo) {
  if (campo == null) return '';
  if (typeof campo === 'string') return campo;
  const propio = campo[app.idioma];
  if (propio !== undefined && propio !== null) return propio;
  return campo.es ?? campo.en ?? '';
}

function escapar(x) {
  return String(x ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* Los precios se escriben como en la carta de papel: 2,50 € */
function euros(precio) {
  return `${(Number(precio) || 0).toFixed(2).replace('.', ',')} €`;
}

/* Dirección interna de una vista: #es, #es/tapeo… */
const enlace = (idioma, archivo) => `#${idioma}${archivo ? '/' + archivo : ''}`;

function normalizar(nombre) {
  return String(nombre ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[\s_]+/g, '-');
}

function datosAlergeno(nombre) {
  const clave = normalizar(nombre);
  const ficha = ALERGENOS[clave];
  return {
    clave,
    etiqueta: ficha ? (ficha[app.idioma] || ficha.es) : nombre,
    icono: ficha ? ficha.icono : '❓'
  };
}

/* ---------- Piezas comunes ---------- */

function pintarCabecera({ enlazarLogo }) {
  const logo = app.datos.negocio.logo;
  const icono = app.datos.negocio.iconoIdioma;

  const imagenLogo =
    `<img class="Logo" src="${escapar(logo.src)}" alt="${escapar(t(logo.alt))}">`;

  const marca = enlazarLogo
    ? `<a href="${enlace(app.idioma)}" aria-label="${escapar(ui().volver)}">${imagenLogo}</a>`
    : imagenLogo;

  return `
    <header>
        ${marca}

        <div class="SelectorIdioma">
            <img class="IconoIdioma" src="${escapar(icono.src)}" alt="${escapar(t(icono.alt))}">
            <select class="MenuIdioma" aria-label="${escapar(ui().idioma)}">
                <option value="ES"${app.idioma === 'es' ? ' selected' : ''}>Español</option>
                <option value="EN"${app.idioma === 'en' ? ' selected' : ''}>English</option>
            </select>
        </div>
    </header>`;
}

/* ---------- Vista 1: la portada ---------- */

function pintarPortada() {
  const botones = app.datos.secciones.map((sec) => {
    const alerta = sec.inicio.alerta
      ? `\n            <p class="AlertaInicio">${escapar(t(sec.inicio.alerta))}</p>`
      : '';
    const clase = sec.imagen.claseInicio ? ` class="${escapar(sec.imagen.claseInicio)}"` : '';

    return `
        <a href="${enlace(app.idioma, sec.archivo)}" class="${escapar(sec.inicio.clase)}">${alerta}
            <img${clase} src="${escapar(sec.imagen.src)}" alt="${escapar(t(sec.imagen.alt))}">
            <p>${escapar(t(sec.inicio.texto))}</p>
        </a>`;
  }).join('\n');

  document.body.className = 'Portada';
  document.title = app.datos.negocio.nombre;
  document.body.innerHTML = `
${pintarCabecera({ enlazarLogo: false })}

    <main>
        <h1 class="Welcome">${escapar(t(app.datos.negocio.portada.bienvenida))}</h1>
        <h3 class="QueApetece">${escapar(t(app.datos.negocio.portada.pregunta))}</h3>
${botones}

    </main>`;
}

/* ---------- Vista 2: una sección ---------- */

function pintarNavbar(actual) {
  const pestanas = app.datos.secciones.map((sec) => {
    const activa = sec.id === actual.id;
    return `            <li><a href="${enlace(app.idioma, sec.archivo)}" class="Tab${activa ? ' Activo' : ''}">${escapar(t(sec.pestana))}</a></li>`;
  }).join('\n');

  return `
    <nav class="navbar">
        <ul class="menu">
${pestanas}
        </ul>
    </nav>`;
}

/* Los avisos que van justo debajo de la imagen de la sección
   (tipos de pan, en qué zona se sirve, etc.). */
function pintarAvisosSeccion(seccion) {
  return seccion.avisos.map((a) => `
        <div class="${escapar(a.clase)}">
            <h3>${escapar(t(a.titulo))}</h3>
            <p>${escapar(t(a.texto))}</p>
        </div>`).join('');
}

/* Un producto de la lista. Los alérgenos solo aparecen si el
   JSON los declara; mientras no los haya, esto pinta lo mismo
   de siempre. */
function pintarItem(item) {
  const lista = Array.isArray(item.alergenos) ? item.alergenos : [];
  const alergenos = lista.length
    ? `
                    <ul class="ItemAlergenos" aria-label="${escapar(ui().contiene)}">
${lista.map((a) => {
      const f = datosAlergeno(a);
      return `                        <li class="ItemAlergeno" title="${escapar(f.etiqueta)}"><span aria-hidden="true">${f.icono}</span> ${escapar(f.etiqueta)}</li>`;
    }).join('\n')}
                    </ul>`
    : '';

  return `
                <li class="Item">
                    <div class="ItemInfo">
                        <span class="ItemNombre">${escapar(t(item.nombre))}</span>
                        <span class="ItemPrecio">${escapar(euros(item.precio))}</span>
                    </div>
                    <p class="ItemDescripcion">${escapar(t(item.descripcion))}</p>${alergenos}
                </li>`;
}

/* Un grupo plegable.

   Las "notas" de la carta tienen dos usos distintos y cada uno
   lleva su color:
     - avisos (naranja): "EXTRA DE AGUACATE + 0,70 €"
     - subdivisiones (azul): "TERCIOS", "MEDIA", "HAMBURGUESAS"

   Los avisos van siempre pegados al título del grupo: el último
   cierra en redondo (.Nota) y los de encima van cuadrados (.Nota3).

   Las subdivisiones pueden ir de dos maneras, y el hueco que dejan
   no es el mismo, así que cada una lleva apuntado en el JSON cómo
   iba en la carta original:
     - "listaAparte": la nota va fuera de la lista y abre una nueva.
       Si además es la primera del grupo y no hay avisos, es la que
       cierra en redondo bajo el título (.NotaAzul).
     - si no, la nota va dentro de la lista, entre dos productos. */
function pintarGrupo(grupo) {
  const avisos = grupo.avisos ?? [];
  const bloques = grupo.bloques ?? [];
  const primero = bloques[0];
  const tituloPegado = primero && primero.titulo && primero.listaAparte;

  // Con algo colgando debajo, el título no puede ir redondeado por abajo
  const claseTitulo = (avisos.length || tituloPegado) ? 'TituloPlegable' : 'TituloPlegableSinNota';

  const partes = [];
  let listaAbierta = false;
  const abrirLista = () => { if (!listaAbierta) { partes.push('\n            <ul class="ListaPlegada">'); listaAbierta = true; } };
  const cerrarLista = () => { if (listaAbierta) { partes.push('\n            </ul>'); listaAbierta = false; } };

  avisos.forEach((a, i) => {
    partes.push(`\n            <p class="${i === avisos.length - 1 ? 'Nota' : 'Nota3'}">${escapar(t(a))}</p>`);
  });

  bloques.forEach((bloque, i) => {
    if (bloque.titulo) {
      if (bloque.listaAparte) {
        cerrarLista();
        const clase = (i === 0 && !avisos.length) ? 'NotaAzul' : 'Nota2';
        partes.push(`\n            <p class="${clase}">${escapar(t(bloque.titulo))}</p>`);
      } else {
        abrirLista();
        partes.push(`\n                <p class="Nota2">${escapar(t(bloque.titulo))}</p>`);
      }
    }
    abrirLista();
    bloque.items.forEach((it) => partes.push(pintarItem(it)));
  });
  cerrarLista();

  return `
        <section class="${escapar(grupo.clase)}">
        <details class="Plegable">
            <summary class="${claseTitulo}">${escapar(t(grupo.nombre))}</summary>
${partes.join('')}
        </details>
        </section>`;
}

/* Leyenda de alérgenos al pie de la sección. Igual que en los
   productos: si nadie ha declarado alérgenos, no se pinta. */
function pintarLeyenda(seccion) {
  const presentes = new Set();
  seccion.grupos.forEach((g) => g.bloques.forEach((b) => b.items.forEach((i) =>
    (i.alergenos ?? []).forEach((a) => presentes.add(normalizar(a))))));

  if (!presentes.size) return '';

  const orden = Object.keys(ALERGENOS).filter((c) => presentes.has(c));
  [...presentes].forEach((c) => { if (!orden.includes(c)) orden.push(c); });

  return `
        <div class="Alergenos">
            <h2>${escapar(ui().alergenos)}</h2>
            <article class="ListaAlergenos">
${orden.map((c) => {
    const f = datosAlergeno(c);
    return `                <p>${escapar(f.etiqueta)} ${f.icono}</p>`;
  }).join('\n')}
            </article>
        </div>`;
}

function pintarSeccion(seccion) {
  document.body.className = 'Seccion';
  document.title = `${app.datos.negocio.nombre} - ${t(seccion.tituloPagina)}`;
  document.body.innerHTML = `
${pintarCabecera({ enlazarLogo: true })}
${pintarNavbar(seccion)}

    <main>
        <div class="PortadaSeccion">
            <h1>${escapar(t(seccion.titulo))}</h1>
            <img class="${escapar(seccion.imagen.clasePortada)}" src="${escapar(seccion.imagen.src)}" alt="${escapar(t(seccion.imagen.alt))}">
        </div>
${pintarAvisosSeccion(seccion)}

        <hr class="VacioPequeño">
${seccion.grupos.map(pintarGrupo).join('\n')}
${pintarLeyenda(seccion)}
    </main>`;

  // Deja la pestaña abierta centrada en la barra, como antes
  const activa = document.querySelector('.Tab.Activo');
  if (activa) activa.scrollIntoView({ inline: 'center', block: 'nearest' });
}

/* ---------- Direcciones ---------- */

/* Lee "#es/tapeo" y devuelve { idioma, archivo }. Si viene vacío o
   con algo que no existe, decide un idioma razonable y se queda en
   la portada. */
function leerDireccion() {
  const [posibleIdioma, posibleSeccion] = window.location.hash.replace(/^#\/?/, '').split('/');

  let idioma = String(posibleIdioma || '').toLowerCase();
  if (!app.datos.negocio.idiomas.includes(idioma)) idioma = idiomaPorDefecto();

  const seccion = app.datos.secciones.find((s) => s.archivo === posibleSeccion) || null;
  return { idioma, seccion };
}

function idiomaPorDefecto() {
  let guardado = null;
  try { guardado = localStorage.getItem(CLAVE_IDIOMA); } catch { }
  if (app.datos.negocio.idiomas.includes(guardado)) return guardado;
  return (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es';
}

function pintar() {
  const { idioma, seccion } = leerDireccion();
  const cambiaSeccion = app.seccion?.id !== seccion?.id;

  // Si la dirección venía mal escrita (idioma raro, sección que no
  // existe), se corrige sin dejar rastro en el historial
  const correcta = enlace(idioma, seccion?.archivo);
  if (window.location.hash !== correcta) window.history.replaceState(null, '', correcta);

  app.idioma = idioma;
  app.seccion = seccion;
  document.documentElement.lang = idioma;
  try { localStorage.setItem(CLAVE_IDIOMA, idioma); } catch { }

  if (seccion) pintarSeccion(seccion);
  else pintarPortada();

  // Al cambiar de sección se empieza a leer desde arriba, igual que
  // cuando cada sección era una página aparte
  if (cambiaSeccion) window.scrollTo(0, 0);
}

/* ---------- Interacción ----------
   Las pestañas y los botones son enlaces de verdad, así que basta
   con escuchar los cambios de dirección: eso cubre también el botón
   "atrás" del navegador. */

document.addEventListener('change', (ev) => {
  const menu = ev.target.closest('.MenuIdioma');
  if (!menu) return;

  const elegido = menu.value.toLowerCase();          // "es" o "en"
  window.location.hash = enlace(elegido, app.seccion?.archivo);
});

window.addEventListener('hashchange', pintar);

/* ---------- Arranque ---------- */

async function cargar() {
  try {
    const respuesta = await fetch(RUTA_JSON, { cache: 'no-store' });
    if (!respuesta.ok) throw new Error(String(respuesta.status));
    app.datos = await respuesta.json();

    // Si se entra sin dirección, dejamos escrita la del idioma elegido
    if (!window.location.hash) {
      window.history.replaceState(null, '', enlace(idiomaPorDefecto()));
    }
    pintar();
  } catch (e) {
    document.body.className = 'Portada';
    document.body.innerHTML =
      `<main><h1 class="Welcome">${escapar(ui().error)}</h1>` +
      `<h3 class="QueApetece">${escapar(e.message)}</h3></main>`;
  }
}

cargar();
