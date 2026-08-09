/*
    CAMBIO DE IDIOMA
    Este script se carga en todas las páginas.
    Al elegir un idioma en el <select> invisible que hay sobre el icono,
    se calcula la ruta equivalente en el otro idioma y se navega a ella.

    La página no cambia: solo cambian la carpeta (SeccionesES <-> SeccionesEN),
    el sufijo del archivo (comidaES.html <-> comidaEN.html)
    o la portada (index.html <-> indexEN.html).
*/

const MenuIdioma = document.querySelector('.MenuIdioma');

if (MenuIdioma) {
    MenuIdioma.addEventListener('change', () => {
        const IdiomaElegido = MenuIdioma.value; // "ES" o "EN"
        let RutaActual = window.location.pathname;

        // Si la URL termina en "/", el servidor está mostrando index.html
        // aunque no aparezca escrito (pasa en GitHub Pages al entrar a la raíz)
        if (RutaActual.endsWith('/')) {
            RutaActual += 'index.html';
        }

        let RutaNueva;

        if (/index(EN)?\.html$/.test(RutaActual)) {
            // Portadas: index.html <-> indexEN.html
            const IndexDestino = IdiomaElegido === 'EN' ? 'indexEN.html' : 'index.html';
            RutaNueva = RutaActual.replace(/index(EN)?\.html$/, IndexDestino);
        } else {
            // Páginas de sección: cambia carpeta y sufijo
            RutaNueva = RutaActual
                .replace(/Secciones(ES|EN)\//, 'Secciones' + IdiomaElegido + '/')
                .replace(/(ES|EN)\.html$/, IdiomaElegido + '.html');
        }

        // Solo navegamos si la ruta realmente cambia
        if (RutaNueva !== window.location.pathname) {
            window.location.href = RutaNueva;
        }
    });
}
