
const ESCENAS = [
  { nombre: "La raíz", subtitulo: "lo que nos forma", tipo: "raiz", imagen: "assets/imagenes/la_raiz_collage.jpg", cubierta: "assets/imagenes/la_raiz_tierra.jpg", audio: "assets/audio/la_raiz_audio.mp3", tono: "#33261e" },
  { nombre: "Lo que no he dicho", subtitulo: "palabras que vuelan", tipo: "buzon", imagen: "assets/imagenes/lo_que_no_he_dicho.jpg", audio: "", tono: "#4b252d" },
  { nombre: "El jardín del deseo", subtitulo: "lo que nos acerca", tipo: "jardin", imagen: "assets/imagenes/el_jardin_del_deseo.jpg", audio: "assets/audio/el_jardin_del_deseo_fever.mp3", tono: "#571b24" },
  { nombre: "Después de ti", subtitulo: "TEXTO", tipo: "pendiente", imagen: "assets/imagenes/despues_de_ti_collage.jpg", audio: "assets/audio/despues_de_ti_amor_amor.mp3", tono: "#332b2a" },
  { nombre: "Entre sueños", subtitulo: "lo que imagino", tipo: "suenos", imagen: "assets/imagenes/entre_suenos_collage.jpg", audio: "assets/audio/entre_suenos_ixa.mp3", tono: "#1a1518" },
  { nombre: "La frecuencia", subtitulo: "TEXTO", tipo: "pendiente", imagen: "", audio: "", tono: "#32272f" }
];

const AJUSTES = {
  pincel: 128,
  regionRaiz: { x1: 355, y1: 45, x2: 1130, y2: 875 },
  descubrirRaiz: 0.75,
  desaparecerTierra: 2000,
  duracionGloss: 8000,
  volumen: 0.78,
  entradaAudio: 2000,
  duracionSuenos: 25,
  tiempoDescubrimiento: 1000,
  duracionMensaje: 4000
};

const CARTAS = [
  { titulo: "Lo que guardé", verso: "Yo digo aún: ¿Por qué callé aquel día?", autor: "Gustavo Adolfo Bécquer · Rima XXX", x: 40, y: 85, ancho: 365, giro: -2 },
  { titulo: "Lo que recuerdo", verso: "Son nom ? Je me souviens qu’il est doux et sonore", traduccion: "¿Su nombre? Recuerdo que es dulce y sonoro.", autor: "Paul Verlaine · Mon rêve familier", x: 1150, y: 80, ancho: 380, giro: 2 },
  { titulo: "El mensaje sin respuesta", verso: "This is my letter to the World\nThat never wrote to Me—", traduccion: "Esta es mi carta al mundo\nque nunca me escribió.", autor: "Emily Dickinson · This is my letter to the World", x: 25, y: 950, ancho: 370, giro: 2 },
  { titulo: "Lo que dejo ir", verso: "Caminante, no hay camino,\nse hace camino al andar.", autor: "Antonio Machado · Proverbios y cantares, XXIX", x: 1160, y: 950, ancho: 385, giro: -2 }
];

const VIDRIO = [
  [[1070, 0], [1600, 0], [1600, 610], [1400, 616], [1290, 592], [1212, 562], [1100, 472], [1070, 405]],
  [[1450, 588], [1600, 555], [1600, 1163], [1485, 1163], [1462, 1012], [1445, 890]]
];

const ZONAS_SUENOS = {
  luna: { x: 398, y: 235, rx: 187, ry: 195, frase: "Hay cosas que solo aparecen cuando cierro los ojos." },
  flor: { x: 1180, y: 475, rx: 175, ry: 195, frase: "Lo que siento también puede florecer." },
  mano: { x: 475, y: 690, rx: 173, ry: 195, frase: "Lo que todavía no digo empieza a encontrar su forma." }
};

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = id => document.getElementById(id);
const ahora = () => performance.now();
const limitar = (n, min, max) => Math.max(min, Math.min(max, n));
const interp = (a, b, t) => a + (b - a) * t;

let escenaActual = -1;
let lienzo;
let imagenes = {};
let raiz = {};
let buzon = {};
let jardin = {};
let suenos = {};
let audio = null;
let audioContext = null;
let audioFiltro = null;
let volumenApagado = false;
let audioPausadoPorUsuario = false;
let audioError = false;
let audioIniciado = false;
let inicioFade = null;
let overlaySuenos = null;
let progresoPuntero = { x: -100, y: -100, pulsado: false, id: null, anterior: null, tipo: "mouse" };

function setup() {
  lienzo = createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  lienzo.elt.setAttribute("aria-label", "Obra de arte interactiva de IXA");
  lienzo.elt.addEventListener("pointerdown", punteroPresionado, { passive: false });
  lienzo.elt.addEventListener("pointermove", punteroMovido, { passive: false });
  lienzo.elt.addEventListener("pointerup", punteroSoltado);
  lienzo.elt.addEventListener("pointercancel", punteroSoltado);
  window.addEventListener("blur", punteroSoltado);
  document.addEventListener("keydown", eventoTeclado);
  crearBotonesPortada();
  conectarControles();
  cargarImagenes();
  irGaleria();
}

function cargarImagenes() {
  const recursos = {
    raiz: ESCENAS[0].imagen,
    tierra: ESCENAS[0].cubierta,
    buzon: ESCENAS[1].imagen,
    jardin: ESCENAS[2].imagen,
    despues: ESCENAS[3].imagen,
    suenos: ESCENAS[4].imagen
  };

  Object.entries(recursos).forEach(([clave, ruta]) => {
    const img = new Image();

    img.onload = () => {
      imagenes[clave] = img;

      if (escenaActual === 0 && imagenes.raiz && imagenes.tierra && !raiz.capa) {
        iniciarEscena();
      }

      if (escenaActual === 4 && imagenes.suenos && !suenos.descubiertos) {
        iniciarEscena();
      }
    };

    img.onerror = () => {
      console.error("No se pudo cargar", ruta);

      if (escenaActual !== -1 && ESCENAS[escenaActual].imagen === ruta) {
        mostrarEstado("Revisa la imagen " + ruta);
      }
    };

    img.src = ruta;
  });
}

function crearBotonesPortada() {
  const nav = $("gallery-links");
  nav.replaceChildren();

  ESCENAS.forEach((escena, indice) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "scene-link pos-" + indice;

    const numero = document.createElement("span");
    numero.className = "number";
    numero.textContent = "0" + (indice + 1);

    const titulo = document.createElement("span");
    titulo.className = "link-title";
    titulo.textContent = escena.nombre;

    const subtitulo = document.createElement("span");
    subtitulo.className = "link-sub";
    subtitulo.textContent = escena.subtitulo;

    boton.append(numero, titulo, subtitulo);
    boton.addEventListener("click", () => entrarEscena(indice));

    nav.appendChild(boton);
  });
}

function conectarControles() {
  $("btn-gallery").addEventListener("click", irGaleria);
  $("btn-restart").addEventListener("click", reiniciarEscena);
  $("btn-action").addEventListener("click", accionEscena);
  $("btn-play").addEventListener("click", alternarMusica);

  $("btn-mute").addEventListener("click", () => {
    volumenApagado = !volumenApagado;

    if (audio) {
      audio.muted = volumenApagado;
    }

    actualizarBotones();
  });
}

function limpiarTexto() {
  $("letters-layer").replaceChildren();
  $("scene-status").textContent = "";
  $("scene-status").style.opacity = "0";
  $("scene-closure").textContent = "";
  $("scene-progress").textContent = "";
}

function irGaleria() {
  detenerAudio();

  escenaActual = -1;
  document.body.className = "";

  $("gallery").classList.remove("is-hidden");
  $("scene-ui").classList.add("is-hidden");

  limpiarTexto();

  progresoPuntero.pulsado = false;

  if (lienzo) {
    lienzo.elt.style.cursor = "default";
  }

  actualizarBotones();
}

function entrarEscena(indice) {
  detenerAudio();

  escenaActual = indice;
  audioPausadoPorUsuario = false;
  audioError = false;
  audioIniciado = false;
  inicioFade = null;
  progresoPuntero.pulsado = false;

  raiz = {};
  buzon = {};
  jardin = {};
  suenos = {};

  limpiarTexto();

  $("gallery").classList.add("is-hidden");
  $("scene-ui").classList.remove("is-hidden");

  document.body.className = "scene-" + ESCENAS[indice].tipo;

  $("scene-title").textContent = ESCENAS[indice].nombre;

  iniciarEscena();
  actualizarBotones();
}

function iniciarEscena() {
  if (escenaActual < 0) return;

  const tipo = ESCENAS[escenaActual].tipo;

  $("btn-action").hidden = false;
  $("scene-hint").textContent = "";

  if (tipo === "raiz") {
    if (!imagenes.raiz || !imagenes.tierra) {
      $("scene-hint").textContent = "Cargando La raíz...";
      $("btn-action").hidden = true;
      return;
    }

    prepararTierra();
    $("scene-hint").textContent = "Mantén presionado y arrastra para retirar la tierra.";
    $("btn-action").textContent = "Descubrir collage";

  } else if (tipo === "buzon") {
    buzon = { cantidad: 0, vuelo: null, ocupado: false };

    $("scene-hint").textContent = "Toca el buzón y deja salir lo que guardaste.";
    $("scene-progress").textContent = "Cartas liberadas: 0 de 4";
    $("btn-action").textContent = "Liberar carta";

  } else if (tipo === "jardin") {
    jardin = { besos: [], inicioGloss: null };

    $("scene-hint").textContent = "Toca el vidrio tres veces. Cada beso te acerca.";
    $("scene-progress").textContent = "0 de 3";
    $("btn-action").textContent = "Dejar un beso";

  } else if (tipo === "suenos") {
    if (!imagenes.suenos) {
      $("scene-hint").textContent = "Cargando Entre sueños...";
      $("btn-action").hidden = true;
      return;
    }

    suenos = {
      descubiertos: { luna: false, flor: false, mano: false },
      luzActiva: false,
      luzX: 0,
      luzY: 0,
      intensidad: 0,
      objetivo: null,
      desde: 0,
      frase: null,
      terminado: false,
      finalDesde: 0,
      opciones: false
    };

    $("scene-hint").textContent = "Mantén presionado y mueve la luz. Encuentra la luna, la flor y la mano.";
    $("scene-progress").textContent = "0 de 3 destellos";
    $("btn-action").textContent = "Revelar collage";

  } else {
    $("scene-hint").textContent = escenaActual === 3
      ? "Interacción de los dos hilos pendiente de integrar."
      : "Esta escena sigue en desarrollo.";

    $("btn-action").hidden = true;
  }
}

function reiniciarEscena() {
  if (escenaActual < 0) return;

  const i = escenaActual;
  entrarEscena(i);
}

function imagenDeEscena() {
  return [
    imagenes.raiz,
    imagenes.buzon,
    imagenes.jardin,
    imagenes.despues,
    imagenes.suenos,
    null
  ][escenaActual];
}

function rectImagen(img = imagenDeEscena()) {
  if (!img) {
    return { x: 0, y: 0, w: 0, h: 0, escala: 1 };
  }

  let escala = Math.max(
    width / img.width,
    height / img.height
  );

  let x = (width - img.width * escala) / 2;
  let y = (height - img.height * escala) / 2;

  if (escenaActual === 2 && width <= 700) {
    x = width - img.width * escala;
  }

  if (escenaActual === 4 && width <= 700) {
    const espacio = Math.max(100, height - 310);

    escala = Math.min(
      width / img.width,
      espacio / img.height
    );

    x = (width - img.width * escala) / 2;
    y = (height - img.height * escala) / 2;
  }

  return {
    x,
    y,
    w: img.width * escala,
    h: img.height * escala,
    escala
  };
}

function puntoLocal(x, y, r) {
  return {
    x: (x - r.x) / r.escala,
    y: (y - r.y) / r.escala
  };
}

function puntoPantalla(x, y, r) {
  return {
    x: r.x + x * r.escala,
    y: r.y + y * r.escala
  };
}

function puntoEnImagen(x, y, r) {
  return (
    x >= r.x &&
    x <= r.x + r.w &&
    y >= r.y &&
    y <= r.y + r.h
  );
}

function draw() {
  const ctx = drawingContext;

  ctx.save();

  ctx.fillStyle = escenaActual < 0
    ? "#1b1018"
    : ESCENAS[escenaActual].tono;

  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  if (escenaActual < 0) return;

  const img = imagenDeEscena();

  if (img) {
    if (escenaActual === 4 && width <= 700) {
      const esc = Math.max(
        width / img.width,
        height / img.height
      );

      ctx.save();
      ctx.globalAlpha = 0.35;

      ctx.drawImage(
        img,
        (width - img.width * esc) / 2,
        (height - img.height * esc) / 2,
        img.width * esc,
        img.height * esc
      );

      ctx.restore();
    }

    const r = rectImagen(img);

    ctx.drawImage(img, r.x, r.y, r.w, r.h);

    if (escenaActual === 0) dibujarRaiz(r);
    if (escenaActual === 1) dibujarBuzon(r);
    if (escenaActual === 2) dibujarJardin(r);
    if (escenaActual === 4) dibujarSuenos(r);
  }

  if (ESCENAS[escenaActual].tipo === "pendiente" && !img) {
    ctx.fillStyle = "#fff2e6";
    ctx.textAlign = "center";
    ctx.font = "26px Georgia";

    ctx.fillText(
      "Escena en desarrollo",
      width / 2,
      height / 2
    );
  }

  actualizarAudio();
  actualizarCursor();
}

function prepararTierra() {
  const img = imagenes.raiz;
  const capa = document.createElement("canvas");

  capa.width = img.width;
  capa.height = img.height;

  const ctx = capa.getContext("2d");

  ctx.drawImage(
    imagenes.tierra,
    0,
    0,
    capa.width,
    capa.height
  );

  const paso = 10;

  raiz = {
    capa,
    ctx,
    paso,
    columnas: Math.ceil(img.width / paso),
    filas: Math.ceil(img.height / paso),
    marcadas: new Set(),
    total: 0,
    reveladas: 0,
    empiezaFinal: null,
    terminada: false
  };

  recalcularRegionRaiz();
}

function recalcularRegionRaiz() {
  if (!raiz.capa || escenaActual !== 0) return;

  const r = rectImagen();
  const a = AJUSTES.regionRaiz;

  raiz.region = {
    x1: Math.max(a.x1, -r.x / r.escala),
    y1: Math.max(a.y1, -r.y / r.escala),
    x2: Math.min(a.x2, (width - r.x) / r.escala),
    y2: Math.min(a.y2, (height - r.y) / r.escala)
  };

  raiz.total = 0;
  raiz.reveladas = 0;

  for (let y = 0; y < raiz.filas; y++) {
    for (let x = 0; x < raiz.columnas; x++) {
      const cx = (x + 0.5) * raiz.paso;
      const cy = (y + 0.5) * raiz.paso;

      if (
        cx >= raiz.region.x1 &&
        cx <= raiz.region.x2 &&
        cy >= raiz.region.y1 &&
        cy <= raiz.region.y2
      ) {
        raiz.total++;

        if (raiz.marcadas.has(y * raiz.columnas + x)) {
          raiz.reveladas++;
        }
      }
    }
  }
}

function dibujarRaiz(r) {
  if (!raiz.capa) return;

  const progreso = raiz.empiezaFinal === null
    ? 0
    : limitar(
        (ahora() - raiz.empiezaFinal) / AJUSTES.desaparecerTierra,
        0,
        1
      );

  if (progreso < 1) {
    const ctx = drawingContext;

    ctx.save();
    ctx.globalAlpha = 1 - progreso;
    ctx.drawImage(raiz.capa, r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  if (progreso === 1 && !raiz.terminada) {
    raiz.terminada = true;

    $("scene-hint").textContent = "";
    $("scene-closure").textContent = "Lo que te forma sigue viviendo en ti.";

    actualizarBotones();
  }

  if (
    progresoPuntero.tipo !== "touch" &&
    raiz.empiezaFinal === null &&
    puntoEnImagen(progresoPuntero.x, progresoPuntero.y, r)
  ) {
    const ctx = drawingContext;

    ctx.save();
    ctx.translate(progresoPuntero.x, progresoPuntero.y);
    ctx.rotate(-0.45);
    ctx.fillStyle = "#8a5f36";
    ctx.fillRect(0, -5, 80, 10);
    ctx.fillStyle = "#d5c5a3";

    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

function borrarTierra(desde, hasta) {
  if (!raiz.capa || raiz.empiezaFinal !== null) return;

  const radio = AJUSTES.pincel / 2;
  const distancia = Math.hypot(
    hasta.x - desde.x,
    hasta.y - desde.y
  );

  const pasos = Math.max(1, Math.ceil(distancia / 22));

  for (let i = 0; i <= pasos; i++) {
    const x = interp(desde.x, hasta.x, i / pasos);
    const y = interp(desde.y, hasta.y, i / pasos);

    const ctx = raiz.ctx;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const grad = ctx.createRadialGradient(
      x,
      y,
      radio * 0.72,
      x,
      y,
      radio
    );

    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const a = raiz.region;

    for (
      let gy = Math.max(0, Math.floor((y - radio) / 10));
      gy < Math.min(raiz.filas, Math.ceil((y + radio) / 10));
      gy++
    ) {
      for (
        let gx = Math.max(0, Math.floor((x - radio) / 10));
        gx < Math.min(raiz.columnas, Math.ceil((x + radio) / 10));
        gx++
      ) {
        const cx = (gx + 0.5) * 10;
        const cy = (gy + 0.5) * 10;

        if (
          cx < a.x1 ||
          cx > a.x2 ||
          cy < a.y1 ||
          cy > a.y2 ||
          Math.hypot(cx - x, cy - y) > radio * 0.76
        ) {
          continue;
        }

        const indice = gy * raiz.columnas + gx;

        if (!raiz.marcadas.has(indice)) {
          raiz.marcadas.add(indice);
          raiz.reveladas++;
        }
      }
    }
  }

  if (
    raiz.total > 0 &&
    raiz.reveladas / raiz.total >= AJUSTES.descubrirRaiz
  ) {
    raiz.empiezaFinal = ahora();
  }
}

function cercaBuzon(p) {
  return (
    p.x >= 536 &&
    p.x <= 985 &&
    p.y >= 380 &&
    p.y <= 1030
  );
}

function liberarCarta() {
  if (!buzon || buzon.ocupado || buzon.cantidad >= 4) return;

  const indice = buzon.cantidad++;

  buzon.ocupado = true;
  buzon.vuelo = {
    indice,
    comienzo: ahora(),
    mostrada: false
  };

  $("scene-progress").textContent =
    `Cartas liberadas: ${buzon.cantidad} de 4`;

  actualizarBotones();
}

function dibujarBuzon(r) {
  if (!buzon.vuelo) return;

  const vuelo = buzon.vuelo;

  const progreso = limitar(
    (ahora() - vuelo.comienzo) / (reducirMovimiento ? 600 : 1750),
    0,
    1
  );

  if (progreso < 0.75) {
    const destino = CARTAS[vuelo.indice];

    const x = interp(
      760,
      destino.x + destino.ancho / 2,
      progreso
    );

    const y =
      interp(540, destino.y + 65, progreso) -
      100 * Math.sin(progreso * Math.PI);

    const p = puntoPantalla(x, y, r);
    const ctx = drawingContext;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-0.12);
    ctx.fillStyle = "#e8d9bc";
    ctx.strokeStyle = "#6d5145";
    ctx.lineWidth = 1;

    ctx.fillRect(-24, -16, 48, 32);
    ctx.strokeRect(-24, -16, 48, 32);

    ctx.beginPath();
    ctx.moveTo(-24, -16);
    ctx.lineTo(0, 6);
    ctx.lineTo(24, -16);
    ctx.stroke();

    ctx.restore();
  }

  if (progreso >= 0.65 && !vuelo.mostrada) {
    vuelo.mostrada = true;
    agregarCarta(vuelo.indice);
  }

  if (progreso >= 1) {
    buzon.vuelo = null;
    buzon.ocupado = false;

    if (buzon.cantidad === 4) {
      $("scene-hint").textContent =
        "Lo que no dije también encontró una forma de salir.";
    }

    actualizarBotones();
  }
}

function agregarCarta(indice) {
  const datos = CARTAS[indice];
  const carta = document.createElement("article");

  carta.className = "letter-card";
  carta.dataset.indice = String(indice);
  carta.style.setProperty("--tilt", datos.giro + "deg");

  const titulo = document.createElement("div");
  titulo.className = "letter-label";
  titulo.textContent = datos.titulo;

  const verso = document.createElement("p");
  verso.className = "letter-verse";
  verso.textContent = datos.verso;

  const autor = document.createElement("div");
  autor.className = "letter-author";
  autor.textContent = datos.autor;

  carta.append(titulo, verso, autor);

  if (datos.traduccion) {
    const boton = document.createElement("button");

    boton.type = "button";
    boton.className = "letter-translate";
    boton.textContent = "Ver traducción";

    const texto = document.createElement("div");

    texto.className = "letter-translation";
    texto.textContent = datos.traduccion;
    texto.hidden = true;

    boton.addEventListener("click", () => {
      texto.hidden = !texto.hidden;

      boton.textContent = texto.hidden
        ? "Ver traducción"
        : "Ocultar traducción";
    });

    carta.append(boton, texto);
  }

  $("letters-layer").append(carta);
  colocarCarta(carta, indice);
}

function colocarCarta(carta, indice) {
  if (width <= 700) {
    carta.style.left = "";
    carta.style.top = "";
    carta.style.width = "";
    return;
  }

  const datos = CARTAS[indice];
  const r = rectImagen();

  const ancho = Math.min(
    datos.ancho * r.escala,
    width * 0.34
  );

  carta.style.width = ancho + "px";

  carta.style.left =
    limitar(
      r.x + datos.x * r.escala,
      12,
      width - ancho - 12
    ) + "px";

  carta.style.top =
    limitar(
      r.y + datos.y * r.escala,
      125,
      Math.max(125, height - 190)
    ) + "px";
}

function estaDentroPoligono(p, poligono) {
  let dentro = false;

  for (
    let i = 0, j = poligono.length - 1;
    i < poligono.length;
    j = i++
  ) {
    const a = poligono[i];
    const b = poligono[j];

    if (
      (a[1] > p.y) !== (b[1] > p.y) &&
      p.x <
        (b[0] - a[0]) *
        (p.y - a[1]) /
        (b[1] - a[1]) +
        a[0]
    ) {
      dentro = !dentro;
    }
  }

  return dentro;
}

function esVidrio(p) {
  return VIDRIO.some(pol => estaDentroPoligono(p, pol));
}

function dejarBeso(p) {
  if (!esVidrio(p)) return;

  const n = jardin.besos.length;

  jardin.besos.push({
    x: p.x,
    y: p.y,
    inicio: ahora(),
    angulo: ((n * 37) % 50 - 25) * Math.PI / 180
  });

  if (jardin.besos.length > 15) {
    jardin.besos.shift();
  }

  const cantidad = Math.min(3, jardin.besos.length);

  if (jardin.inicioGloss === null) {
    $("scene-progress").textContent = cantidad + " de 3";

    if (cantidad === 3) {
      jardin.inicioGloss = ahora();
    }

    if (!audioIniciado && !audioPausadoPorUsuario) {
      iniciarAudio(true);
    }

    if (audioFiltro && audioContext) {
      const frecuencia = cantidad === 1
        ? 680
        : cantidad === 2
          ? 3000
          : 19000;

      audioFiltro.frequency.setTargetAtTime(
        frecuencia,
        audioContext.currentTime,
        0.18
      );
    }
  }
}

function dibujarJardin(r) {
  const ctx = drawingContext;

  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.scale(r.escala, r.escala);
  ctx.beginPath();

  VIDRIO.forEach(pol => {
    ctx.moveTo(pol[0][0], pol[0][1]);

    pol.slice(1).forEach(([x, y]) => {
      ctx.lineTo(x, y);
    });

    ctx.closePath();
  });

  ctx.clip();

  jardin.besos.forEach(b => {
    const escala = reducirMovimiento
      ? 1
      : limitar((ahora() - b.inicio) / 250, 0, 1);

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angulo);
    ctx.scale(escala, escala);
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#b30d32";

    ctx.beginPath();
    ctx.moveTo(-48, -3);
    ctx.bezierCurveTo(-34, -22, -17, -24, 0, -11);
    ctx.bezierCurveTo(18, -29, 38, -18, 48, -3);
    ctx.bezierCurveTo(19, -5, 3, -6, 0, -4);
    ctx.bezierCurveTo(-16, -7, -29, -6, -48, -3);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-48, 4);
    ctx.quadraticCurveTo(0, 14, 48, 4);
    ctx.quadraticCurveTo(0, 57, -48, 4);
    ctx.fill();

    ctx.restore();
  });

  if (jardin.inicioGloss !== null) {
    const progreso = limitar(
      (ahora() - jardin.inicioGloss) / AJUSTES.duracionGloss,
      0,
      1
    );

    [
      [1120, 46, 220],
      [1280, 34, 340],
      [1430, 54, 250],
      [1550, 38, 420]
    ].forEach(([x, ancho, alto]) => {
      const h = alto * progreso;

      if (h < 1) return;

      const grad = ctx.createLinearGradient(
        x - ancho,
        0,
        x + ancho,
        0
      );

      grad.addColorStop(0, "#6f0b1a");
      grad.addColorStop(0.5, "#eb2d43");
      grad.addColorStop(1, "#8e1123");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x - ancho, 0);
      ctx.lineTo(x + ancho, 0);

      ctx.bezierCurveTo(
        x + ancho * 0.65,
        h * 0.6,
        x + ancho * 0.4,
        h + 32,
        x,
        h
      );

      ctx.bezierCurveTo(
        x - ancho * 0.4,
        h + 32,
        x - ancho * 0.65,
        h * 0.6,
        x - ancho,
        0
      );

      ctx.fill();
    });

    if (progreso === 1) {
      $("scene-hint").textContent = "";
      $("scene-progress").textContent = "";
    }
  }

  ctx.restore();
}

function cantidadSuenos() {
  return suenos.descubiertos
    ? Object.values(suenos.descubiertos).filter(Boolean).length
    : 0;
}

function descubrirSuenos(nombre) {
  if (!suenos.descubiertos || suenos.descubiertos[nombre]) return;

  suenos.descubiertos[nombre] = true;

  suenos.frase = {
    texto: ZONAS_SUENOS[nombre].frase,
    desde: ahora()
  };

  suenos.objetivo = null;

  $("scene-progress").textContent =
    cantidadSuenos() + " de 3 destellos";

  if (cantidadSuenos() === 3) {
    suenos.terminado = true;
    suenos.finalDesde = ahora();

    $("scene-hint").textContent = "";
    $("scene-closure").textContent =
      "Lo que imaginaba empezó a tener voz.";

    actualizarBotones();
  }
}

function actualizarDescubrimientosSuenos(r) {
  if (
    !suenos.descubiertos ||
    !suenos.luzActiva ||
    suenos.terminado
  ) {
    if (suenos.descubiertos) {
      suenos.objetivo = null;
    }

    return;
  }

  const p = puntoLocal(
    suenos.luzX,
    suenos.luzY,
    r
  );

  const nombre = Object.keys(ZONAS_SUENOS).find(clave => {
    if (suenos.descubiertos[clave]) return false;

    const z = ZONAS_SUENOS[clave];

    return (
      ((p.x - z.x) / z.rx) ** 2 +
      ((p.y - z.y) / z.ry) ** 2 <= 1
    );
  }) || null;

  if (!nombre) {
    suenos.objetivo = null;
    return;
  }

  if (suenos.objetivo !== nombre) {
    suenos.objetivo = nombre;
    suenos.desde = ahora();

  } else if (
    ahora() - suenos.desde >= AJUSTES.tiempoDescubrimiento
  ) {
    descubrirSuenos(nombre);
  }
}

function dibujarSuenos(r) {
  if (!suenos.descubiertos) return;

  const ctx = drawingContext;

  actualizarDescubrimientosSuenos(r);

  suenos.intensidad += (
    (suenos.luzActiva ? 1 : 0) - suenos.intensidad
  ) * (reducirMovimiento ? 1 : 0.17);

  if (
    !overlaySuenos ||
    overlaySuenos.width !== width ||
    overlaySuenos.height !== height
  ) {
    overlaySuenos = document.createElement("canvas");
    overlaySuenos.width = width;
    overlaySuenos.height = height;
  }

  const oscuro = overlaySuenos.getContext("2d");

  oscuro.clearRect(0, 0, width, height);
  oscuro.fillStyle = "rgba(0,0,0,0.76)";
  oscuro.fillRect(r.x, r.y, r.w, r.h);
  oscuro.save();
  oscuro.globalCompositeOperation = "destination-out";

  Object.entries(suenos.descubiertos).forEach(([clave, descubierto]) => {
    if (!descubierto) return;

    const z = ZONAS_SUENOS[clave];
    const p = puntoPantalla(z.x, z.y, r);

    oscuro.save();
    oscuro.translate(p.x, p.y);
    oscuro.scale(
      z.rx * r.escala * 1.18,
      z.ry * r.escala * 1.18
    );

    const grad = oscuro.createRadialGradient(
      0,
      0,
      0.18,
      0,
      0,
      1
    );

    grad.addColorStop(0, "rgba(0,0,0,0.93)");
    grad.addColorStop(0.67, "rgba(0,0,0,0.75)");
    grad.addColorStop(1, "rgba(0,0,0,0)");

    oscuro.fillStyle = grad;
    oscuro.beginPath();
    oscuro.arc(0, 0, 1, 0, Math.PI * 2);
    oscuro.fill();

    oscuro.restore();
  });

  if (suenos.intensidad > 0.01) {
    const radio = width <= 700 ? 85 : 165;

    const grad = oscuro.createRadialGradient(
      suenos.luzX,
      suenos.luzY,
      radio * 0.16,
      suenos.luzX,
      suenos.luzY,
      radio
    );

    grad.addColorStop(
      0,
      `rgba(0,0,0,${0.98 * suenos.intensidad})`
    );

    grad.addColorStop(
      0.48,
      `rgba(0,0,0,${0.75 * suenos.intensidad})`
    );

    grad.addColorStop(1, "rgba(0,0,0,0)");

    oscuro.fillStyle = grad;
    oscuro.beginPath();
    oscuro.arc(
      suenos.luzX,
      suenos.luzY,
      radio,
      0,
      Math.PI * 2
    );
    oscuro.fill();
  }

  oscuro.restore();

  ctx.save();

  ctx.globalAlpha = suenos.terminado
    ? 1 - limitar(
        (ahora() - suenos.finalDesde) / 2000,
        0,
        1
      )
    : 1;

  ctx.drawImage(overlaySuenos, 0, 0);
  ctx.restore();

  Object.entries(suenos.descubiertos).forEach(([clave, descubierto]) => {
    if (!descubierto || suenos.terminado) return;

    const z = ZONAS_SUENOS[clave];
    const p = puntoPantalla(z.x, z.y, r);

    ctx.save();
    ctx.lineWidth = 1.8;

    ctx.strokeStyle = clave === "flor"
      ? "rgba(176,43,65,0.5)"
      : "rgba(225,231,238,0.5)";

    ctx.shadowBlur = 18;

    ctx.shadowColor = clave === "flor"
      ? "#96172d"
      : "#e4e8ed";

    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y,
      z.rx * r.escala * 0.95,
      z.ry * r.escala * 0.95,
      0,
      0,
      Math.PI * 2
    );

    ctx.stroke();
    ctx.restore();
  });

  const status = $("scene-status");

  if (suenos.frase) {
    const t = ahora() - suenos.frase.desde;

    if (t >= AJUSTES.duracionMensaje) {
      suenos.frase = null;
      status.style.opacity = "0";
      status.textContent = "";

    } else {
      const op = Math.min(
        1,
        t / 350,
        (AJUSTES.duracionMensaje - t) / 350
      );

      status.textContent = suenos.frase.texto;
      status.style.opacity = String(op);
    }
  }

  if (
    suenos.terminado &&
    !suenos.opciones &&
    ahora() - suenos.finalDesde >= 2000
  ) {
    suenos.opciones = true;

    const div = document.createElement("div");
    div.className = "scene-text-actions";

    const volver = document.createElement("button");
    volver.type = "button";
    volver.className = "scene-text-link";
    volver.textContent = "Volver a explorar";
    volver.addEventListener("click", reiniciarEscena);

    const continuar = document.createElement("button");
    continuar.type = "button";
    continuar.className = "scene-text-link";
    continuar.textContent = "Continuar";
    continuar.addEventListener("click", () => entrarEscena(5));

    div.append(volver, continuar);
    $("letters-layer").append(div);
  }
}

function punteroPresionado(e) {
  if (
    escenaActual < 0 ||
    ESCENAS[escenaActual].tipo === "pendiente"
  ) {
    return;
  }

  const r = rectImagen();

  if (!puntoEnImagen(e.clientX, e.clientY, r)) return;

  e.preventDefault();

  progresoPuntero.x = e.clientX;
  progresoPuntero.y = e.clientY;
  progresoPuntero.tipo = e.pointerType;

  const p = puntoLocal(e.clientX, e.clientY, r);

  if (
    escenaActual === 0 &&
    raiz.capa &&
    raiz.empiezaFinal === null
  ) {
    progresoPuntero.pulsado = true;
    progresoPuntero.id = e.pointerId;
    progresoPuntero.anterior = p;

    lienzo.elt.setPointerCapture(e.pointerId);

    borrarTierra(p, p);

    if (!audioIniciado && !audioPausadoPorUsuario) {
      iniciarAudio(true);
    }

  } else if (
    escenaActual === 1 &&
    cercaBuzon(p)
  ) {
    liberarCarta();

  } else if (
    escenaActual === 2 &&
    esVidrio(p)
  ) {
    dejarBeso(p);

  } else if (
    escenaActual === 4 &&
    suenos.descubiertos &&
    !suenos.terminado
  ) {
    progresoPuntero.pulsado = true;
    progresoPuntero.id = e.pointerId;

    lienzo.elt.setPointerCapture(e.pointerId);

    suenos.luzActiva = true;
    suenos.luzX = e.clientX;
    suenos.luzY = e.clientY;

    if (!audioIniciado && !audioPausadoPorUsuario) {
      iniciarAudio(true);
    }
  }
}

function punteroMovido(e) {
  progresoPuntero.x = e.clientX;
  progresoPuntero.y = e.clientY;
  progresoPuntero.tipo = e.pointerType;

  if (
    !progresoPuntero.pulsado ||
    progresoPuntero.id !== e.pointerId
  ) {
    return;
  }

  e.preventDefault();

  if (
    escenaActual === 0 &&
    raiz.capa &&
    raiz.empiezaFinal === null
  ) {
    const r = rectImagen();
    const p = puntoLocal(e.clientX, e.clientY, r);

    p.x = limitar(p.x, 0, imagenes.raiz.width);
    p.y = limitar(p.y, 0, imagenes.raiz.height);

    borrarTierra(progresoPuntero.anterior || p, p);
    progresoPuntero.anterior = p;
  }

  if (escenaActual === 4 && suenos.luzActiva) {
    suenos.luzX = e.clientX;
    suenos.luzY = e.clientY;
  }
}

function punteroSoltado() {
  if (escenaActual === 4 && suenos.descubiertos) {
    suenos.luzActiva = false;
    suenos.objetivo = null;
  }

  progresoPuntero.pulsado = false;
  progresoPuntero.anterior = null;

  if (
    lienzo &&
    progresoPuntero.id !== null &&
    lienzo.elt.hasPointerCapture(progresoPuntero.id)
  ) {
    lienzo.elt.releasePointerCapture(progresoPuntero.id);
  }

  progresoPuntero.id = null;
}

function eventoTeclado(e) {
  if (e.key === "Escape" && escenaActual !== -1) {
    if (
      document.activeElement &&
      document.activeElement.tagName === "BUTTON"
    ) {
      return;
    }

    irGaleria();
  }
}

function accionEscena() {
  if (escenaActual === 0 && raiz.capa) {
    if (raiz.empiezaFinal === null) {
      raiz.empiezaFinal = ahora();
    }

    if (!audioIniciado && !audioPausadoPorUsuario) {
      iniciarAudio(true);
    }

  } else if (escenaActual === 1) {
    liberarCarta();

  } else if (escenaActual === 2) {
    const puntos = [
      [1260, 240],
      [1500, 320],
      [1150, 170],
      [1440, 500],
      [1530, 200]
    ];

    const [x, y] = puntos[
      jardin.besos.length % puntos.length
    ];

    dejarBeso({ x, y });

  } else if (
    escenaActual === 4 &&
    suenos.descubiertos
  ) {
    const siguiente = Object.keys(
      suenos.descubiertos
    ).find(k => !suenos.descubiertos[k]);

    if (siguiente) {
      if (!audioIniciado && !audioPausadoPorUsuario) {
        iniciarAudio(true);
      }

      descubrirSuenos(siguiente);
    }
  }

  actualizarBotones();
}

function prepararAudio() {
  if (
    audio ||
    escenaActual < 0 ||
    !ESCENAS[escenaActual].audio ||
    audioError
  ) {
    return;
  }

  audio = new Audio(ESCENAS[escenaActual].audio);
  audio.preload = "auto";
  audio.loop = false;
  audio.volume = AJUSTES.volumen;
  audio.muted = volumenApagado;

  const actual = audio;

  actual.addEventListener("error", () => {
    if (audio !== actual) return;

    audioError = true;

    mostrarEstado(
      "El archivo de música de esta escena todavía no está disponible."
    );

    actualizarBotones();
  });

  actual.addEventListener("ended", () => {
    if (audio !== actual) return;

    audioPausadoPorUsuario = true;
    actualizarBotones();
  });

  if (escenaActual === 2) {
    try {
      const AudioCtx =
        window.AudioContext ||
        window.webkitAudioContext;

      if (AudioCtx) {
        audioContext = new AudioCtx();

        const source =
          audioContext.createMediaElementSource(actual);

        audioFiltro =
          audioContext.createBiquadFilter();

        audioFiltro.type = "lowpass";
        audioFiltro.frequency.value = 680;

        source.connect(audioFiltro);
        audioFiltro.connect(audioContext.destination);
      }

    } catch (err) {
      console.warn("Efecto de audio no disponible", err);
      audioFiltro = null;
    }
  }
}

function iniciarAudio(conFade) {
  if (
    escenaActual < 0 ||
    audioError ||
    audioPausadoPorUsuario
  ) {
    return;
  }

  prepararAudio();

  if (!audio || audioIniciado) return;

  audioIniciado = true;

  if (
    audioContext &&
    audioContext.state === "suspended"
  ) {
    audioContext.resume().catch(() => {});
  }

  if (conFade) {
    audio.volume = 0;
    inicioFade = ahora();

  } else {
    audio.volume = AJUSTES.volumen;
  }

  audio.play()
    .then(actualizarBotones)
    .catch(() => {
      audioIniciado = false;

      mostrarEstado(
        "Pulsa Música para comenzar a escuchar."
      );

      actualizarBotones();
    });

  actualizarBotones();
}

function alternarMusica() {
  if (
    escenaActual < 0 ||
    !ESCENAS[escenaActual].audio
  ) {
    return;
  }

  prepararAudio();

  if (!audio || audioError) return;

  if (!audio.paused) {
    audio.pause();
    audioPausadoPorUsuario = true;
    inicioFade = null;

  } else {
    audioPausadoPorUsuario = false;

    if (
      audio.ended ||
      (
        escenaActual === 4 &&
        audio.currentTime >= AJUSTES.duracionSuenos
      )
    ) {
      audio.currentTime = 0;
    }

    audioIniciado = true;
    inicioFade = ahora();
    audio.volume = 0;

    if (
      audioContext &&
      audioContext.state === "suspended"
    ) {
      audioContext.resume().catch(() => {});
    }

    audio.play().catch(() => {
      mostrarEstado("No se pudo reproducir el audio.");
    });
  }

  actualizarBotones();
}

function actualizarAudio() {
  if (!audio || audio.paused) return;

  if (
    escenaActual === 4 &&
    audio.currentTime >= AJUSTES.duracionSuenos
  ) {
    audio.pause();
    audioPausadoPorUsuario = true;
    actualizarBotones();
    return;
  }

  if (inicioFade !== null) {
    const t = limitar(
      (ahora() - inicioFade) / AJUSTES.entradaAudio,
      0,
      1
    );

    audio.volume = AJUSTES.volumen * t;

    if (t === 1) {
      inicioFade = null;
    }
  }

  const fin = escenaActual === 4
    ? Math.min(
        audio.duration || Infinity,
        AJUSTES.duracionSuenos
      )
    : audio.duration;

  if (
    Number.isFinite(fin) &&
    fin - audio.currentTime <= 1.2
  ) {
    const salida = limitar(
      (fin - audio.currentTime) / 1.2,
      0,
      1
    );

    audio.volume = Math.min(
      audio.volume,
      AJUSTES.volumen * salida
    );
  }
}

function detenerAudio() {
  const anterior = audio;
  const anteriorContexto = audioContext;

  audio = null;
  audioContext = null;
  audioFiltro = null;
  inicioFade = null;
  audioIniciado = false;

  if (anterior) {
    anterior.pause();
    anterior.removeAttribute("src");
    anterior.load();
  }

  if (anteriorContexto) {
    anteriorContexto.close().catch(() => {});
  }
}

function actualizarBotones() {
  if (!$("btn-play")) return;

  $("btn-play").textContent =
    audio && !audio.paused
      ? "Pausar"
      : "Música";

  $("btn-mute").textContent =
    volumenApagado
      ? "Activar sonido"
      : "Silenciar";

  $("btn-play").disabled =
    escenaActual < 0 ||
    !ESCENAS[escenaActual].audio;

  const tipo = escenaActual < 0
    ? ""
    : ESCENAS[escenaActual].tipo;

  $("btn-action").disabled =
    (
      tipo === "raiz" &&
      raiz.empiezaFinal !== null
    ) ||
    (
      tipo === "buzon" &&
      (buzon.ocupado || buzon.cantidad === 4)
    ) ||
    (
      tipo === "suenos" &&
      cantidadSuenos() === 3
    );
}

function mostrarEstado(mensaje) {
  $("scene-status").textContent = mensaje;
  $("scene-status").style.opacity = mensaje ? "1" : "0";
}

function actualizarCursor() {
  if (!lienzo || escenaActual < 0) return;

  const r = rectImagen();

  const p = puntoLocal(
    progresoPuntero.x,
    progresoPuntero.y,
    r
  );

  const cerca = puntoEnImagen(
    progresoPuntero.x,
    progresoPuntero.y,
    r
  );

  let cursor = "default";

  if (
    cerca &&
    escenaActual === 0 &&
    raiz.capa &&
    raiz.empiezaFinal === null
  ) {
    cursor = "none";
  }

  if (
    cerca &&
    escenaActual === 1 &&
    cercaBuzon(p)
  ) {
    cursor = "pointer";
  }

  if (
    cerca &&
    escenaActual === 2 &&
    esVidrio(p)
  ) {
    cursor = "pointer";
  }

  if (
    cerca &&
    escenaActual === 4 &&
    suenos.descubiertos &&
    !suenos.terminado
  ) {
    cursor = "crosshair";
  }

  lienzo.elt.style.cursor = cursor;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  recalcularRegionRaiz();

  overlaySuenos = null;

  document.querySelectorAll(".letter-card").forEach(carta => {
    colocarCarta(
      carta,
      Number(carta.dataset.indice)
    );
  });
}
