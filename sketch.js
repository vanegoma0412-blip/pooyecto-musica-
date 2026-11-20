
(() => {
  const E = [
    { nombre: "La raíz", subtitulo: "lo que nos forma", tipo: "raiz", imagen: "assets/imagenes/la_raiz_collage.jpg", cubierta: "assets/imagenes/la_raiz_tierra.jpg", audio: "assets/audio/la_raiz_audio.mp3", fondo: "#33261e" },
    { nombre: "Lo que no he dicho", subtitulo: "palabras que vuelan", tipo: "buzon", imagen: "assets/imagenes/lo_que_no_he_dicho.jpg", audio: "assets/audio/lo_que_no_he_dicho_audio.mp3", fondo: "#4b252d" },
    { nombre: "El jardín del deseo", subtitulo: "lo que nos acerca", tipo: "jardin", imagen: "assets/imagenes/el_jardin_del_deseo.jpg", audio: "assets/audio/el_jardin_del_deseo_fever.mp3", fondo: "#571b24" },
    { nombre: "Después de ti", subtitulo: "lo que aprendí a soltar", tipo: "hilos", imagen: "assets/imagenes/despues_de_ti_collage.jpg", audio: "assets/audio/despues_de_ti_amor_amor.mp3", fondo: "#332b2a" },
    { nombre: "Entre sueños", subtitulo: "lo que imagino", tipo: "suenos", imagen: "assets/imagenes/entre_suenos_collage.jpg", audio: "", fondo: "#1a1518" },
    { nombre: "La frecuencia", subtitulo: "todas las piezas de mí", tipo: "frecuencia", imagen: "assets/imagenes/la_frecuencia_completa.png", audio: "", fondo: "#1c1411" }
  ];

  const IMG6 = [
    "la_frecuencia_01.png",
    "la_frecuencia_02.png",
    "la_frecuencia_03.png",
    "la_frecuencia_04.png",
    "la_frecuencia_05.png",
    "la_frecuencia_06.png"
  ];

  const CARTAS = [
    { titulo: "Lo que guardé", verso: "Yo digo aún: ¿Por qué callé aquel día?", autor: "Gustavo Adolfo Bécquer · Rima XXX", x: .06, y: .11, giro: -2 },
    { titulo: "Lo que recuerdo", verso: "Son nom ? Je me souviens qu’il est doux et sonore", traduccion: "¿Su nombre? Recuerdo que es dulce y sonoro.", autor: "Paul Verlaine · Mon rêve familier", x: .70, y: .11, giro: 2 },
    { titulo: "El mensaje sin respuesta", verso: "This is my letter to the World\nThat never wrote to Me—", traduccion: "Esta es mi carta al mundo\nque nunca me escribió.", autor: "Emily Dickinson · This is my letter to the World", x: .04, y: .75, giro: 2 },
    { titulo: "Lo que dejo ir", verso: "Caminante, no hay camino,\nse hace camino al andar.", autor: "Antonio Machado · Proverbios y cantares, XXIX", x: .69, y: .75, giro: -2 }
  ];

  const ZONAS = {
    luna: { x: .25, y: .22, rx: .13, ry: .20, frase: "Hay cosas que solo aparecen cuando cierro los ojos." },
    flor: { x: .74, y: .47, rx: .12, ry: .19, frase: "Lo que siento también puede florecer." },
    mano: { x: .30, y: .70, rx: .12, ry: .19, frase: "Lo que todavía no digo empieza a encontrar su forma." }
  };

  const $ = id => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reloj = () => performance.now();
  const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let canvas, ctx, ancho = 0, alto = 0, escena = -1, img = {}, fallidas = new Set();
  let musica = null, silencio = false, pausaManual = false, fadeAudio = null, anteriorAudio = null, audioContext = null, audioFiltro = null;
  let audioIniciado = false, estado = {}, arrastre = null, cursor = { x: -200, y: -200, tipo: "mouse" };
  let capaSuenos = null;
  let audioHilos = null;

  const HILOS = {
    origenRojo: { x: .045, y: .54 },
    extremoRojo: { x: .40, y: .55 },
    origenPlata: { x: .955, y: .54 },
    extremoPlata: { x: .60, y: .55 },
    segmentos: 27,
    holgura: 1.28,
    gravedad: .17,
    amortiguacion: .92,
    respuestaMs: 300,
    contactoPx: 32,
    rearmadoPx: 76,
    temblorMs: 320,
    temblorPx: 4,
    retrocesoMs: 430,
    retroceso: .115,
    esperaFraseMs: 4000,
    grosorRojo: 5.2,
    grosorPlata: 7.2
  };

  function recurso(ruta, nombre, opcional = false) {
    if (!ruta) return;
    const imagen = new Image();
    imagen.onload = () => {
      img[nombre] = imagen;
      if (escena === 0 && img.raiz && img.tierra && !estado.capa) iniciarEstado();
      if (escena === 4 && img.suenos && !estado.encontrados) iniciarEstado();
      if (escena === 5 && nombre.startsWith("f6_")) actualizarEstadoCarga6();
    };
    imagen.onerror = () => {
      if (opcional) return;
      fallidas.add(nombre);
      console.error("No se pudo cargar:", ruta);
      if (escena >= 0) mensaje("Falta el archivo " + ruta);
    };
    imagen.src = ruta;
  }

  function iniciarCarga() {
    recurso(E[0].imagen, "raiz");
    recurso(E[0].cubierta, "tierra");
    recurso(E[1].imagen, "buzon");
    recurso(E[2].imagen, "jardin");
    recurso(E[3].imagen, "despues");
    const fondoLimpio = "";
    if (fondoLimpio) recurso(fondoLimpio, "despuesLimpio", true);
    recurso(E[4].imagen, "suenos");
    recurso(E[5].imagen, "f6_final");
    recurso("assets/imagenes/la_frecuencia_fondo.jpg", "f6_fondo");
    IMG6.forEach((ruta, i) => recurso("assets/imagenes/" + ruta, "f6_" + (i + 1)));
    ["04_besos", "04_orquideas", "06_microfono", "06_disco"].forEach(n => {
      recurso("assets/imagenes/la_frecuencia_" + n + ".png", "f6_" + n);
    });
  }

  function portada() {
    const nav = $("gallery-links");
    nav.replaceChildren();
    E.forEach((item, i) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "scene-link pos-" + i;
      const numero = document.createElement("span");
      numero.className = "number";
      numero.textContent = "0" + (i + 1);
      const titulo = document.createElement("span");
      titulo.className = "link-title";
      titulo.textContent = item.nombre;
      const sub = document.createElement("span");
      sub.className = "link-sub";
      sub.textContent = item.subtitulo;
      boton.append(numero, titulo, sub);
      boton.addEventListener("click", () => entrar(i));
      nav.append(boton);
    });
  }

  function conectar() {
    $("btn-gallery").addEventListener("click", galeria);
    $("btn-restart").addEventListener("click", reiniciar);
    $("btn-action").addEventListener("click", accion);
    $("btn-play").addEventListener("click", musicaManual);
    $("btn-mute").addEventListener("click", () => {
      silencio = !silencio;
      if (musica) musica.muted = silencio;
      botones();
    });
    canvas.addEventListener("pointerdown", bajar, { passive: false });
    canvas.addEventListener("pointermove", mover, { passive: false });
    canvas.addEventListener("pointerup", subir);
    canvas.addEventListener("pointercancel", subir);
    window.addEventListener("blur", subir);
    window.addEventListener("keydown", teclado);
    window.addEventListener("resize", redimensionar);
  }

  function limpiar() {
    $("letters-layer").replaceChildren();
    $("scene-progress").textContent = "";
    $("scene-hint").textContent = "";
    $("scene-closure").textContent = "";
    $("scene-closure").style.opacity = "1";
    $("scene-closure").style.transition = "";
    mensaje("");
    $("btn-action").hidden = false;
    $("btn-restart").hidden = false;
  }

  function galeria() {
    pararAudio();
    subir();
    escena = -1;
    estado = {};
    document.body.className = "";
    $("gallery").classList.remove("is-hidden");
    $("scene-ui").classList.add("is-hidden");
    limpiar();
    canvas.style.cursor = "default";
    botones();
  }

  function entrar(i) {
    pararAudio();
    subir();
    escena = i;
    estado = {};
    audioIniciado = false;
    pausaManual = false;
    limpiar();
    document.body.className = "scene-" + E[i].tipo;
    $("gallery").classList.add("is-hidden");
    $("scene-ui").classList.remove("is-hidden");
    $("scene-title").textContent = E[i].nombre;
    canvas.setAttribute("aria-label", i === 3 ? "Extremo rojo: Enter para sujetar o soltar y flechas para moverlo" : "Lienzo interactivo de la galería de IXA");
    iniciarEstado();
    botones();
    canvas.focus({ preventScroll: true });
  }

  function iniciarEstado() {
    if (escena < 0) return;
    limpiar();
    const tipo = E[escena].tipo;
    if (tipo === "raiz") {
      if (!img.raiz || !img.tierra) {
        $("scene-hint").textContent = "Cargando La raíz...";
        $("btn-action").hidden = true;
        return;
      }
      const c = document.createElement("canvas");
      c.width = img.raiz.width;
      c.height = img.raiz.height;
      const g = c.getContext("2d");
      g.drawImage(img.tierra, 0, 0, c.width, c.height);
      estado = { capa: c, g, revelado: null, celdas: new Set(), progreso: 0 };
      $("scene-hint").textContent = "Mantén presionado y arrastra para retirar la tierra.";
      $("btn-action").textContent = "Descubrir collage";
    } else if (tipo === "buzon") {
      estado = { cantidad: 0, vuelo: null };
      $("scene-hint").textContent = "Toca el buzón y deja salir lo que guardaste.";
      $("scene-progress").textContent = "Cartas liberadas: 0 de 4";
      $("btn-action").textContent = "Liberar carta";
    } else if (tipo === "jardin") {
      estado = { besos: [], gloss: null };
      $("scene-hint").textContent = "Toca el vidrio tres veces. Cada beso te acerca.";
      $("scene-progress").textContent = "0 de 3";
      $("btn-action").textContent = "Dejar un beso";
    } else if (tipo === "hilos") {
      estado = { hilos: crearEstadoHilos() };
      $("scene-hint").textContent = "No todas las historias están destinadas a perdurar.";
      $("scene-progress").textContent = "Mantén presionado el extremo del hilo rojo y arrástralo hacia el plateado. Suelta para dejar ir.";
      $("btn-action").hidden = true;
      const cierre = $("scene-closure");
      cierre.style.whiteSpace = "pre-line";
      cierre.style.opacity = "0";
      cierre.style.transition = "opacity 650ms ease";
    } else if (tipo === "suenos") {
      if (!img.suenos) {
        $("scene-hint").textContent = "Cargando Entre sueños...";
        $("btn-action").hidden = true;
        return;
      }
      estado = { encontrados: { luna: false, flor: false, mano: false }, luz: false, x: 0, y: 0, intensidad: 0, objetivo: "", desde: 0, frase: null, final: null, opciones: false };
      $("scene-hint").textContent = "Mantén presionado y mueve la luz. Encuentra la luna, la flor y la mano.";
      $("scene-progress").textContent = "0 de 3 destellos";
      $("btn-action").textContent = "Revelar collage";
    } else if (tipo === "frecuencia") {
      estado = { visibles: 0, animacion: null, final: null, opciones: false };
      $("scene-hint").textContent = "Cada fragmento tiene algo de mí. Toca seis veces para reunirlos.";
      $("scene-progress").textContent = "0 de 6 fragmentos";
      $("btn-action").textContent = "Añadir fragmento";
      actualizarEstadoCarga6();
    }
  }

  function actualizarEstadoCarga6() {
    if (escena !== 5) return;
    const faltan = ["f6_fondo", "f6_final", ...IMG6.map((_, i) => "f6_" + (i + 1))].filter(k => !img[k]);
    if (faltan.length) {
      $("scene-hint").textContent = "Cargando los fragmentos de La frecuencia...";
      $("btn-action").disabled = true;
    } else if (estado.visibles === 0 && !estado.animacion) {
      $("scene-hint").textContent = "Cada fragmento tiene algo de mí. Toca seis veces para reunirlos.";
      $("btn-action").disabled = false;
    }
  }

  function reiniciar() {
    if (escena < 0) return;
    if (escena === 5) {
      estado = { visibles: 0, animacion: null, final: null, opciones: false };
      limpiar();
      $("scene-hint").textContent = "Cada fragmento tiene algo de mí. Toca seis veces para reunirlos.";
      $("scene-progress").textContent = "0 de 6 fragmentos";
      $("btn-action").textContent = "Añadir fragmento";
      actualizarEstadoCarga6();
      botones();
      return;
    }
    const i = escena;
    entrar(i);
  }

  function escenaImagen() {
    return [img.raiz, img.buzon, img.jardin, img.despuesLimpio || img.despues, img.suenos, img.f6_final][escena];
  }

  function encuadre(im, modo = "cover") {
    if (!im) return { x: 0, y: 0, w: 0, h: 0, s: 1 };
    let s = modo === "contain" ? Math.min(ancho / im.width, alto / im.height) : Math.max(ancho / im.width, alto / im.height);
    if (escena === 4 && ancho <= 700 && modo === "cover") {
      s = Math.min(ancho / im.width, Math.max(90, alto - 290) / im.height);
    }
    const w = im.width * s, h = im.height * s;
    let x = (ancho - w) / 2;
    if (escena === 2 && ancho <= 700 && modo === "cover") x = ancho - w;
    return { x, y: (alto - h) / 2, w, h, s };
  }

  function local(x, y, r) {
    return { x: (x - r.x) / r.s, y: (y - r.y) / r.s };
  }

  function dentro(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  function puntoHilo(p) {
    return { x: ancho * p.x, y: alto * p.y };
  }

  function fabricarCuerda(inicio, fin, lado) {
    const puntos = [];
    for (let i = 0; i < HILOS.segmentos; i++) {
      const t = i / (HILOS.segmentos - 1);
      const x = lerp(inicio.x, fin.x, t);
      const y = lerp(inicio.y, fin.y, t) + Math.sin(t * Math.PI) * (lado === "rojo" ? 27 : -22);
      puntos.push({ x, y, anteriorX: x, anteriorY: y });
    }
    return {
      puntos,
      ancla: inicio,
      longitud: Math.hypot(fin.x - inicio.x, fin.y - inicio.y) * HILOS.holgura / (HILOS.segmentos - 1),
      lado
    };
  }

  function crearEstadoHilos() {
    const rojoInicio = puntoHilo(HILOS.origenRojo);
    const rojoFinal = puntoHilo(HILOS.extremoRojo);
    const plataInicio = puntoHilo(HILOS.origenPlata);
    const plataFinal = puntoHilo(HILOS.extremoPlata);
    return {
      rojo: fabricarCuerda(rojoInicio, rojoFinal, "rojo"),
      plata: fabricarCuerda(plataInicio, plataFinal, "plata"),
      sujeto: false,
      teclado: false,
      objetivo: rojoFinal,
      historial: [{ tiempo: reloj() - HILOS.respuestaMs, x: rojoFinal.x, y: rojoFinal.y }],
      ultima: reloj(),
      ultimoContacto: -Infinity,
      choque: null,
      separacionLista: true,
      agarres: 0,
      ultimoSoltar: null,
      fraseVisible: false,
      recuperarAudio: null,
      objetivoPlata: plataFinal
    };
  }

  function extremoCuerda(cuerda) {
    return cuerda.puntos[cuerda.puntos.length - 1];
  }

  function empujarHistorialHilos(h, instante) {
    const rojo = extremoCuerda(h.rojo);
    h.historial.push({ tiempo: instante, x: rojo.x, y: rojo.y });
    while (h.historial.length > 2 && h.historial[1].tiempo < instante - 750) h.historial.shift();
  }

  function ajustaCuerda(cuerda, objetivoFinal, sujetarFinal, fraccion) {
    const puntos = cuerda.puntos;
    const primero = puntos[0];
    const ultimo = puntos[puntos.length - 1];
    const gravedad = HILOS.gravedad * fraccion * fraccion;
    for (let i = 1; i < puntos.length; i++) {
      if (sujetarFinal && i === puntos.length - 1) continue;
      const p = puntos[i];
      const vx = (p.x - p.anteriorX) * HILOS.amortiguacion;
      const vy = (p.y - p.anteriorY) * HILOS.amortiguacion;
      p.anteriorX = p.x;
      p.anteriorY = p.y;
      p.x += vx * fraccion;
      p.y += vy * fraccion + gravedad;
      p.x = clamp(p.x, 7, ancho - 7);
      p.y = clamp(p.y, 85, alto - 35);
    }
    for (let vuelta = 0; vuelta < 6; vuelta++) {
      primero.x = cuerda.ancla.x;
      primero.y = cuerda.ancla.y;
      if (sujetarFinal && objetivoFinal) {
        ultimo.x = objetivoFinal.x;
        ultimo.y = objetivoFinal.y;
        ultimo.anteriorX = ultimo.x;
        ultimo.anteriorY = ultimo.y;
      }
      for (let i = 1; i < puntos.length; i++) {
        const a = puntos[i - 1];
        const b = puntos[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distancia = Math.max(.001, Math.hypot(dx, dy));
        const diferencia = (distancia - cuerda.longitud) / distancia;
        const fijadoA = i === 1;
        const fijadoB = sujetarFinal && i === puntos.length - 1;
        if (fijadoA && fijadoB) continue;
        if (fijadoA) {
          b.x -= dx * diferencia;
          b.y -= dy * diferencia;
        } else if (fijadoB) {
          a.x += dx * diferencia;
          a.y += dy * diferencia;
        } else {
          a.x += dx * diferencia * .5;
          a.y += dy * diferencia * .5;
          b.x -= dx * diferencia * .5;
          b.y -= dy * diferencia * .5;
        }
      }
    }
    primero.x = cuerda.ancla.x;
    primero.y = cuerda.ancla.y;
    if (sujetarFinal && objetivoFinal) {
      ultimo.x = objetivoFinal.x;
      ultimo.y = objetivoFinal.y;
    }
  }

  function actualizarHilos() {
    const h = estado.hilos;
    if (!h) return;
    const ahora = reloj();
    const fraccion = clamp((ahora - h.ultima) / 16.67, .2, 1.5);
    h.ultima = ahora;
    const rojo = extremoCuerda(h.rojo);
    const plata = extremoCuerda(h.plata);
    if (h.sujeto) {
      h.objetivo.x = clamp(h.objetivo.x, ancho * .08, ancho * .64);
      h.objetivo.y = clamp(h.objetivo.y, alto * .16, alto * .87);
    }
    ajustaCuerda(h.rojo, h.objetivo, h.sujeto || h.agarres === 0, fraccion);
    empujarHistorialHilos(h, ahora);
    const retrasada = h.historial.findLast(p => p.tiempo <= ahora - HILOS.respuestaMs) || h.historial[0];
    if (h.sujeto) {
      h.objetivoPlata.x = clamp(ancho - retrasada.x + Math.sin(ahora / 460) * ancho * .009, ancho * .37, ancho * .88);
      h.objetivoPlata.y = clamp(retrasada.y + Math.sin(ahora / 490) * 9, alto * .17, alto * .85);
    }
    let metaPlata = { x: h.objetivoPlata.x, y: h.objetivoPlata.y };
    if (h.choque && ahora - h.choque < HILOS.retrocesoMs) {
      const t = (ahora - h.choque) / HILOS.retrocesoMs;
      const impulso = 1 - Math.pow(t, 1.3);
      metaPlata.x = clamp(metaPlata.x + ancho * HILOS.retroceso * impulso, ancho * .38, ancho * .91);
      metaPlata.y -= alto * .03 * impulso;
    }
    const metaSuave = {
      x: lerp(plata.x, metaPlata.x, .10 * fraccion),
      y: lerp(plata.y, metaPlata.y, .10 * fraccion)
    };
    ajustaCuerda(h.plata, metaSuave, true, fraccion);
    const distancia = Math.hypot(rojo.x - plata.x, rojo.y - plata.y);
    const umbral = ancho <= 700 ? 25 : HILOS.contactoPx;
    if (!h.separacionLista && distancia > HILOS.rearmadoPx) h.separacionLista = true;
    if (h.sujeto && h.separacionLista && distancia < umbral && ahora - h.ultimoContacto > 1000) {
      h.ultimoContacto = ahora;
      h.choque = ahora;
      h.separacionLista = false;
      modificarAudioHilos("contacto");
      h.recuperarAudio = ahora + 900;
    }
    if (h.recuperarAudio && ahora > h.recuperarAudio) {
      h.recuperarAudio = null;
      modificarAudioHilos(h.sujeto ? "sujeto" : "suelto");
    }
    if (!h.sujeto && h.agarres > 0 && h.ultimoSoltar !== null && !h.fraseVisible && ahora - h.ultimoSoltar >= HILOS.esperaFraseMs) {
      h.fraseVisible = true;
      $("scene-closure").textContent = "Soltar no borra lo que vivimos.\nDespués de ti, sigo aquí.";
      $("scene-closure").style.opacity = "1";
    }
  }

  function caminoHilo(puntos) {
    ctx.beginPath();
    ctx.moveTo(puntos[0].x, puntos[0].y);
    for (let i = 1; i < puntos.length - 1; i++) {
      const medioX = (puntos[i].x + puntos[i + 1].x) / 2;
      const medioY = (puntos[i].y + puntos[i + 1].y) / 2;
      ctx.quadraticCurveTo(puntos[i].x, puntos[i].y, medioX, medioY);
    }
    const final = puntos[puntos.length - 1];
    ctx.lineTo(final.x, final.y);
  }

  function dibujarCuerda(cuerda, metal) {
    const puntos = cuerda.puntos;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    caminoHilo(puntos);
    ctx.strokeStyle = metal ? "rgba(24,25,29,.92)" : "#550b10";
    ctx.lineWidth = metal ? HILOS.grosorPlata + 2.4 : HILOS.grosorRojo + 1.7;
    ctx.stroke();
    caminoHilo(puntos);
    ctx.strokeStyle = metal ? "#aeb1b8" : "#c91b24";
    ctx.lineWidth = metal ? HILOS.grosorPlata : HILOS.grosorRojo;
    ctx.stroke();
    caminoHilo(puntos);
    ctx.strokeStyle = metal ? "rgba(253,251,250,.88)" : "rgba(245,99,87,.76)";
    ctx.lineWidth = metal ? 1.35 : .9;
    ctx.stroke();
    ctx.restore();
  }

  function dibujarDespuesDeTi(im, r) {
    const h = estado.hilos;
    if (!h) return;
    actualizarHilos();
    const ahora = reloj();
    const t = h.choque === null ? Infinity : ahora - h.choque;
    const temblando = !reducido && t < HILOS.temblorMs;
    const intensidad = temblando ? (1 - t / HILOS.temblorMs) * HILOS.temblorPx : 0;
    const desplazamientoX = intensidad * Math.sin(t * .22);
    const desplazamientoY = intensidad * .6 * Math.cos(t * .28);
    ctx.save();
    ctx.translate(desplazamientoX, desplazamientoY);
    ctx.drawImage(im, r.x, r.y, r.w, r.h);
    dibujarCuerda(h.plata, true);
    dibujarCuerda(h.rojo, false);
    const rojo = extremoCuerda(h.rojo);
    const plata = extremoCuerda(h.plata);
    const pulso = reducido ? 1 : .5 + .5 * Math.sin(ahora * .004);
    ctx.beginPath();
    ctx.arc(rojo.x, rojo.y, ancho <= 700 ? 10 : 8, 0, Math.PI * 2);
    ctx.fillStyle = "#ba1722";
    ctx.fill();
    ctx.strokeStyle = `rgba(250,209,192,${h.sujeto ? .9 : .25 + pulso * .55})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rojo.x, rojo.y, (ancho <= 700 ? 17 : 15) + pulso * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(plata.x, plata.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#e9e9ef";
    ctx.fill();
    ctx.restore();
    if (reducido && t < HILOS.temblorMs) {
      ctx.save();
      ctx.fillStyle = `rgba(245,230,222,${.10 * (1 - t / HILOS.temblorMs)})`;
      ctx.fillRect(0, 0, ancho, alto);
      ctx.restore();
    }
    canvas.style.cursor = h.sujeto ? "grabbing" : Math.hypot(cursor.x - rojo.x, cursor.y - rojo.y) < (ancho <= 700 ? 62 : 47) ? "grab" : "default";
    if (document.activeElement === canvas && h.teclado) {
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "#f8ecdf";
      ctx.beginPath();
      ctx.arc(rojo.x, rojo.y, 29, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function sujetarRojo(x, y, porTeclado = false) {
    const h = estado.hilos;
    if (!h || h.sujeto) return;
    h.sujeto = true;
    h.teclado = porTeclado;
    h.objetivo = { x: clamp(x, ancho * .08, ancho * .64), y: clamp(y, alto * .16, alto * .87) };
    h.ultimoSoltar = null;
    h.fraseVisible = false;
    $("scene-closure").style.opacity = "0";
    h.agarres++;
    modificarAudioHilos("sujeto");
    if (!audioIniciado && !pausaManual) iniciarAudio(1000);
  }

  function soltarRojo() {
    const h = estado.hilos;
    if (!h || !h.sujeto) return;
    h.sujeto = false;
    h.teclado = false;
    h.ultimoSoltar = reloj();
    h.objetivo = { x: extremoCuerda(h.rojo).x, y: extremoCuerda(h.rojo).y };
    h.recuperarAudio = null;
    modificarAudioHilos("suelto");
  }

  function iniciarEfectosHilos(elemento) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioContext = new AC();
      const origen = audioContext.createMediaElementSource(elemento);
      const filtro = audioContext.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.value = 18000;
      const seco = audioContext.createGain();
      const humedo = audioContext.createGain();
      seco.gain.value = 1;
      humedo.gain.value = .09;
      const reverberacion = audioContext.createConvolver();
      const frecuencia = audioContext.sampleRate;
      const longitud = Math.floor(frecuencia * 1.3);
      const impulso = audioContext.createBuffer(2, longitud, frecuencia);
      for (let canal = 0; canal < 2; canal++) {
        const muestras = impulso.getChannelData(canal);
        let ruido = 237 + canal * 17;
        for (let i = 0; i < longitud; i++) {
          ruido = (ruido * 1664525 + 1013904223) >>> 0;
          const aleatorio = (ruido / 4294967295) * 2 - 1;
          muestras[i] = aleatorio * Math.pow(1 - i / longitud, 2.8) * .28;
        }
      }
      reverberacion.buffer = impulso;
      origen.connect(filtro);
      filtro.connect(seco);
      seco.connect(audioContext.destination);
      filtro.connect(reverberacion);
      reverberacion.connect(humedo);
      humedo.connect(audioContext.destination);
      audioHilos = { seco, humedo, filtro };
    } catch (error) {
      console.warn("Efectos de los hilos no disponibles", error);
      audioHilos = null;
    }
  }

  function modificarAudioHilos(modo) {
    if (!audioHilos || !audioContext) return;
    const t = audioContext.currentTime;
    const meta = modo === "contacto"
      ? { seco: .72, humedo: .29, frecuencia: 1900 }
      : modo === "suelto"
        ? { seco: .89, humedo: .16, frecuencia: 10000 }
        : { seco: 1, humedo: .06, frecuencia: 18000 };
    audioHilos.seco.gain.setTargetAtTime(meta.seco, t, .22);
    audioHilos.humedo.gain.setTargetAtTime(meta.humedo, t, .22);
    audioHilos.filtro.frequency.setTargetAtTime(meta.frecuencia, t, .24);
  }

  function reescalarHilos(fx, fy) {
    if (!estado.hilos) return;
    const h = estado.hilos;
    for (const cuerda of [h.rojo, h.plata]) {
      for (const p of cuerda.puntos) {
        p.x *= fx;
        p.anteriorX *= fx;
        p.y *= fy;
        p.anteriorY *= fy;
      }
      cuerda.ancla.x *= fx;
      cuerda.ancla.y *= fy;
      cuerda.longitud *= (fx + fy) / 2;
    }
    h.objetivo.x *= fx;
    h.objetivo.y *= fy;
    h.objetivoPlata.x *= fx;
    h.objetivoPlata.y *= fy;
    for (const m of h.historial) {
      m.x *= fx;
      m.y *= fy;
    }
  }

  function frame() {
    ctx.clearRect(0, 0, ancho, alto);
    ctx.fillStyle = escena < 0 ? "#1b1018" : E[escena].fondo;
    ctx.fillRect(0, 0, ancho, alto);
    if (escena >= 0) {
      const im = escenaImagen();
      if (escena === 5) {
        dibujarFrecuencia();
      } else if (im) {
        const r = encuadre(im);
        if (escena === 3 && estado.hilos) {
          dibujarDespuesDeTi(im, r);
        } else {
          ctx.drawImage(im, r.x, r.y, r.w, r.h);
        }
        if (escena === 0) dibujarRaiz(r);
        if (escena === 1) dibujarBuzon(r);
        if (escena === 2) dibujarJardin(r);
        if (escena === 4) dibujarSuenos(r);
      }
    }
    actualizarAudio();
    requestAnimationFrame(frame);
  }

  function dibujarRaiz(r) {
    if (!estado.capa) return;
    const t = estado.revelado === null ? 0 : clamp((reloj() - estado.revelado) / 2000, 0, 1);
    if (t < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.drawImage(estado.capa, r.x, r.y, r.w, r.h);
      ctx.restore();
    }
    if (t === 1 && !estado.terminada) {
      estado.terminada = true;
      $("scene-closure").textContent = "Lo que te forma sigue viviendo en ti.";
      $("scene-hint").textContent = "";
      botones();
    }
  }

  function borrarRaiz(a, b) {
    if (!estado.capa || estado.revelado !== null) return;
    const r = encuadre(img.raiz);
    const radio = 64;
    const distancia = Math.hypot(a.x - b.x, a.y - b.y);
    const pasos = Math.max(1, Math.ceil(distancia / 25));
    for (let k = 0; k <= pasos; k++) {
      const x = lerp(a.x, b.x, k / pasos);
      const y = lerp(a.y, b.y, k / pasos);
      const g = estado.g;
      g.save();
      g.globalCompositeOperation = "destination-out";
      const grad = g.createRadialGradient(x, y, radio * .7, x, y, radio);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, radio, 0, Math.PI * 2);
      g.fill();
      g.restore();
      for (let iy = Math.floor((y - radio) / 16); iy <= Math.ceil((y + radio) / 16); iy++) {
        for (let ix = Math.floor((x - radio) / 16); ix <= Math.ceil((x + radio) / 16); ix++) {
          const cx = ix * 16 + 8;
          const cy = iy * 16 + 8;
          if (cx < Math.max(355, -r.x / r.s) || cx > Math.min(1130, (ancho - r.x) / r.s)) continue;
          if (cy < Math.max(45, -r.y / r.s) || cy > Math.min(875, (alto - r.y) / r.s)) continue;
          if (Math.hypot(cx - x, cy - y) < radio * .75) estado.celdas.add(iy * 10000 + ix);
        }
      }
    }
    const regionW = Math.max(1, Math.min(1130, (ancho - r.x) / r.s) - Math.max(355, -r.x / r.s));
    const regionH = Math.max(1, Math.min(875, (alto - r.y) / r.s) - Math.max(45, -r.y / r.s));
    if (estado.celdas.size / Math.max(1, regionW * regionH / 256) >= .75) estado.revelado = reloj();
  }

  function clickBuzon(p, im) {
    if (!im) return false;
    return p.x > im.width * .34 && p.x < im.width * .59 && p.y > im.height * .32 && p.y < im.height * .90;
  }

  function soltarCarta() {
    if (estado.vuelo || estado.cantidad >= 4) return;
    if (!audioIniciado && !pausaManual) iniciarAudio(2000);
    estado.vuelo = { indice: estado.cantidad, desde: reloj(), mostrada: false };
    botones();
  }

  function dibujarBuzon(r) {
    const vuelo = estado.vuelo;
    if (!vuelo) return;
    const t = clamp((reloj() - vuelo.desde) / (reducido ? 500 : 1600), 0, 1);
    const destino = CARTAS[vuelo.indice];
    if (t < .7) {
      ctx.save();
      const px = r.x + r.w * lerp(.48, destino.x, t);
      const py = r.y + r.h * lerp(.50, destino.y, t) - Math.sin(t * Math.PI) * 70;
      ctx.translate(px, py);
      ctx.rotate(-.11);
      ctx.fillStyle = "#f3e5cb";
      ctx.strokeStyle = "#7e5947";
      ctx.fillRect(-25, -14, 50, 30);
      ctx.strokeRect(-25, -14, 50, 30);
      ctx.restore();
    }
    if (t >= .65 && !vuelo.mostrada) {
      vuelo.mostrada = true;
      crearCarta(vuelo.indice, r);
    }
    if (t >= 1) {
      estado.cantidad++;
      estado.vuelo = null;
      $("scene-progress").textContent = `Cartas liberadas: ${estado.cantidad} de 4`;
      if (estado.cantidad === 4) $("scene-hint").textContent = "Lo que no dije también encontró una forma de salir.";
      botones();
    }
  }

  function crearCarta(indice, r) {
    const d = CARTAS[indice];
    const carta = document.createElement("article");
    carta.className = "letter-card";
    carta.dataset.indice = indice;
    carta.style.setProperty("--tilt", d.giro + "deg");

    const titulo = document.createElement("div");
    titulo.className = "letter-label";
    titulo.textContent = d.titulo;

    const verso = document.createElement("p");
    verso.className = "letter-verse";
    verso.textContent = d.verso;

    const autor = document.createElement("div");
    autor.className = "letter-author";
    autor.textContent = d.autor;

    carta.append(titulo, verso, autor);

    if (d.traduccion) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "letter-translate";
      boton.textContent = "Ver traducción";
      const traduccion = document.createElement("div");
      traduccion.className = "letter-translation";
      traduccion.textContent = d.traduccion;
      traduccion.hidden = true;
      boton.addEventListener("click", () => {
        traduccion.hidden = !traduccion.hidden;
        boton.textContent = traduccion.hidden ? "Ver traducción" : "Ocultar traducción";
      });
      carta.append(boton, traduccion);
    }

    $("letters-layer").append(carta);
    posicionarCarta(carta);
  }

  function posicionarCarta(carta) {
    if (escena !== 1 || !img.buzon) return;
    const d = CARTAS[Number(carta.dataset.indice)];
    if (ancho <= 700) {
      carta.style.left = "";
      carta.style.top = "";
      carta.style.width = "";
      return;
    }
    const r = encuadre(img.buzon);
    const w = Math.min(ancho * .29, 340);
    carta.style.width = w + "px";
    carta.style.left = clamp(r.x + r.w * d.x, 12, ancho - w - 12) + "px";
    carta.style.top = clamp(r.y + r.h * d.y, 135, Math.max(135, alto - 190)) + "px";
  }

  function vidrio(p, im) {
    if (!im) return false;
    const x = p.x / im.width;
    const y = p.y / im.height;
    return (x >= .67 && y <= .53) || (x >= .90 && y >= .45);
  }

  function dejarBeso(p) {
    if (!vidrio(p, img.jardin)) return;
    if (!audioIniciado && !pausaManual) iniciarAudio(2000);
    estado.besos.push({
      x: p.x,
      y: p.y,
      desde: reloj(),
      rot: (estado.besos.length % 5 - 2) * .15
    });
    if (estado.besos.length > 15) estado.besos.shift();
    const n = Math.min(3, estado.besos.length);
    if (estado.gloss === null) {
      $("scene-progress").textContent = n + " de 3";
      if (n === 3) estado.gloss = reloj();
    }
    if (musica && audioFiltro && audioContext) {
      audioFiltro.frequency.setTargetAtTime(
        n === 1 ? 680 : n === 2 ? 3000 : 18000,
        audioContext.currentTime,
        .2
      );
    }
  }

  function dibujarJardin(r) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x + r.w * .66, r.y, r.w * .34, r.h);
    ctx.clip();

    for (const b of estado.besos) {
      const x = r.x + b.x * r.s;
      const y = r.y + b.y * r.s;
      const t = reducido ? 1 : clamp((reloj() - b.desde) / 280, 0, 1);

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(t * r.s, t * r.s);
      ctx.rotate(b.rot);
      ctx.globalAlpha = .73;
      ctx.fillStyle = "#ab1136";

      ctx.beginPath();
      ctx.moveTo(-52, -2);
      ctx.bezierCurveTo(-30, -26, -12, -20, 0, -11);
      ctx.bezierCurveTo(14, -26, 36, -19, 52, -2);
      ctx.quadraticCurveTo(0, -8, -52, -2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-52, 5);
      ctx.quadraticCurveTo(0, 16, 52, 5);
      ctx.quadraticCurveTo(0, 46, -52, 5);
      ctx.fill();
      ctx.restore();
    }

    if (estado.gloss !== null) {
      const t = clamp((reloj() - estado.gloss) / 8000, 0, 1);
      for (const [x, w, h] of [[.71,.024,.22],[.79,.027,.30],[.89,.029,.27],[.96,.022,.37]]) {
        const px = r.x + r.w * x;
        const py = r.y + r.h * h * t;
        const grad = ctx.createLinearGradient(px-r.w*w, 0, px+r.w*w, 0);
        grad.addColorStop(0, "#74071a");
        grad.addColorStop(.55, "#e42640");
        grad.addColorStop(1, "#960d27");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(px-r.w*w, r.y);
        ctx.lineTo(px+r.w*w, r.y);
        ctx.quadraticCurveTo(px+r.w*w*.65, py, px, py+r.w*w*.32);
        ctx.quadraticCurveTo(px-r.w*w*.65, py, px-r.w*w, r.y);
        ctx.fill();
      }
      if (t === 1 && !estado.listo) {
        estado.listo = true;
        $("scene-hint").textContent = "";
        $("scene-progress").textContent = "";
      }
    }
    ctx.restore();
  }

  function totalSuenos() {
    return estado.encontrados
      ? Object.values(estado.encontrados).filter(Boolean).length
      : 0;
  }

  function descubrir(nombre) {
    if (!estado.encontrados || estado.encontrados[nombre]) return;
    estado.encontrados[nombre] = true;
    estado.frase = { texto: ZONAS[nombre].frase, desde: reloj() };
    $("scene-progress").textContent = totalSuenos() + " de 3 destellos";
    if (totalSuenos() === 3) {
      estado.final = reloj();
      $("scene-closure").textContent = "Lo que imaginaba empezó a tener voz.";
      $("scene-hint").textContent = "";
    }
    botones();
  }

  function dibujarSuenos(r) {
    if (!estado.encontrados) return;

    if (estado.luz && estado.final === null) {
      const p = local(estado.x, estado.y, r);
      const objetivo = Object.keys(ZONAS).find(k => {
        if (estado.encontrados[k]) return false;
        const z = ZONAS[k];
        return (
          ((p.x / img.suenos.width - z.x) / z.rx) ** 2 +
          ((p.y / img.suenos.height - z.y) / z.ry) ** 2 < 1
        );
      }) || "";

      if (!objetivo) {
        estado.objetivo = "";
        estado.desde = 0;
      } else if (objetivo !== estado.objetivo) {
        estado.objetivo = objetivo;
        estado.desde = reloj();
      } else if (reloj() - estado.desde >= 1000) {
        descubrir(objetivo);
        estado.objetivo = "";
      }
    }

    estado.intensidad = lerp(
      estado.intensidad,
      estado.luz && estado.final === null ? 1 : 0,
      reducido ? 1 : .16
    );

    if (!capaSuenos || capaSuenos.width !== ancho || capaSuenos.height !== alto) {
      capaSuenos = document.createElement("canvas");
      capaSuenos.width = ancho;
      capaSuenos.height = alto;
    }

    const g = capaSuenos.getContext("2d");
    g.clearRect(0, 0, ancho, alto);
    g.fillStyle = "rgba(0,0,0,0.75)";
    g.fillRect(r.x, r.y, r.w, r.h);
    g.save();
    g.globalCompositeOperation = "destination-out";

    const iluminar = (x, y, radio, opacidad) => {
      const grad = g.createRadialGradient(x, y, radio * .16, x, y, radio);
      grad.addColorStop(0, `rgba(0,0,0,${opacidad})`);
      grad.addColorStop(.62, `rgba(0,0,0,${opacidad * .7})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, radio, 0, Math.PI * 2);
      g.fill();
    };

    for (const [k, z] of Object.entries(ZONAS)) {
      if (estado.encontrados[k]) {
        iluminar(
          r.x + z.x * r.w,
          r.y + z.y * r.h,
          Math.max(z.rx * r.w, z.ry * r.h) * 1.3,
          .91
        );
      }
    }

    if (estado.intensidad > .01) {
      iluminar(
        estado.x,
        estado.y,
        ancho <= 700 ? 110 : 170,
        estado.intensidad
      );
    }

    g.restore();

    ctx.save();
    ctx.globalAlpha = estado.final === null
      ? 1
      : 1 - clamp((reloj() - estado.final) / 2000, 0, 1);
    ctx.drawImage(capaSuenos, 0, 0);
    ctx.restore();

    if (estado.frase) {
      const t = reloj() - estado.frase.desde;
      if (t >= 4000) {
        estado.frase = null;
        mensaje("");
      } else {
        const op = Math.min(1, t / 350, (4000 - t) / 350);
        $("scene-status").textContent = estado.frase.texto;
        $("scene-status").style.opacity = String(op);
      }
    }

    if (
      estado.final !== null &&
      !estado.opciones &&
      reloj() - estado.final >= 2000
    ) {
      estado.opciones = true;
      opcionesFlotantes(
        "Volver a explorar",
        reiniciar,
        "Continuar",
        () => entrar(5)
      );
    }
  }

  function listo6() {
    return img.f6_fondo &&
      img.f6_final &&
      IMG6.every((_, i) => img["f6_" + (i + 1)]);
  }

  function paso6() {
    if (
      escena !== 5 ||
      !listo6() ||
      estado.final !== null ||
      estado.animacion
    ) return;

    if (estado.visibles >= 6) return;
    if (estado.visibles === 0 && !audioIniciado && !pausaManual) iniciarAudio(2000);

    estado.animacion = {
      paso: estado.visibles + 1,
      desde: reloj()
    };
    $("btn-action").disabled = true;
  }

  function pintar6(cual, r, t, paso) {
    if (!cual) return;
    const ease = 1 - (1 - t) ** 3;

    ctx.save();
    ctx.globalAlpha = clamp(t, 0, 1);

    let offsetY = 0;
    if (paso === 1) offsetY = -26 * (1 - ease);
    if (paso === 3) offsetY = 16 * (1 - ease);

    ctx.drawImage(cual, r.x, r.y + offsetY, r.w, r.h);

    if (paso === 2 && t > .2 && t < .98 && !reducido) {
      ctx.globalAlpha = .12 * Math.sin(Math.PI * t);
      const grad = ctx.createLinearGradient(r.x, 0, r.x+r.w, 0);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(clamp(t-.1,0,1), "rgba(230,230,240,0)");
      grad.addColorStop(clamp(t,0,1), "rgba(255,255,255,.8)");
      grad.addColorStop(clamp(t+.12,0,1), "rgba(230,230,240,0)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }

    ctx.restore();
  }

  function grupo6(paso, r, t) {
    if (paso === 4 && img.f6_04_besos && img.f6_04_orquideas) {
      pintar6(img.f6_04_besos, r, clamp(t/.56,0,1), 4);
      pintar6(img.f6_04_orquideas, r, clamp((t-.37)/.63,0,1), 4);
    } else if (paso === 6 && img.f6_06_microfono && img.f6_06_disco) {
      pintar6(img.f6_06_disco, r, clamp(t/.76,0,1), 6);
      pintar6(img.f6_06_microfono, r, clamp((t-.2)/.8,0,1), 6);
    } else {
      pintar6(img["f6_" + paso], r, t, paso);
    }
  }

  function destello(x, y, size, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = `rgba(255,246,220,${a})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.stroke();
    ctx.restore();
  }

  function dibujarFrecuencia() {
    if (!listo6()) return;

    const r = encuadre(img.f6_final, "contain");
    const b = encuadre(img.f6_fondo, "cover");

    ctx.drawImage(img.f6_fondo, b.x, b.y, b.w, b.h);
    ctx.save();
    ctx.fillStyle = "rgba(15,8,8,.29)";
    ctx.fillRect(0, 0, ancho, alto);
    ctx.restore();
    ctx.drawImage(img.f6_fondo, r.x, r.y, r.w, r.h);

    const orden = [1, 2, 4, 3, 5, 6];

    for (const paso of orden) {
      if (paso <= estado.visibles) {
        grupo6(paso, r, 1);
      } else if (estado.animacion && estado.animacion.paso === paso) {
        grupo6(
          paso,
          r,
          clamp(
            (reloj() - estado.animacion.desde) / (reducido ? 120 : 800),
            0,
            1
          )
        );
      }
    }

    if (estado.animacion) {
      const t = (reloj() - estado.animacion.desde) / (reducido ? 120 : 800);
      if (t >= 1) {
        estado.visibles = estado.animacion.paso;
        estado.animacion = null;
        $("scene-progress").textContent = `${estado.visibles} de 6 fragmentos`;

        if (estado.visibles === 6) {
          estado.final = reloj();
          $("scene-hint").textContent = "";
          $("scene-progress").textContent = "";
          $("btn-action").hidden = true;
        }

        botones();
      }
    }

    if (estado.final !== null) {
      const t = clamp(
        (reloj() - estado.final) / (reducido ? 120 : 800),
        0,
        1
      );

      ctx.save();
      ctx.globalAlpha = t;
      ctx.drawImage(img.f6_final, r.x, r.y, r.w, r.h);
      ctx.restore();

      const dt = reloj() - estado.final;

      if (!reducido && dt < 2000) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.clip();

        const desplazamiento = r.x + r.w * (dt / 2000);
        const grad = ctx.createLinearGradient(
          desplazamiento - 90,
          0,
          desplazamiento + 90,
          0
        );

        grad.addColorStop(0, "rgba(255,245,230,0)");
        grad.addColorStop(.5, "rgba(255,238,215,0.12)");
        grad.addColorStop(1, "rgba(255,245,230,0)");

        ctx.fillStyle = grad;
        ctx.fillRect(desplazamiento - 90, r.y, 180, r.h);

        const brillo = .45 * Math.sin(Math.PI * dt / 2000);

        [[.71,.69],[.83,.67],[.96,.3],[.88,.84],[.77,.95]].forEach(([x,y],i) => {
          const a = brillo * (.5 + .5 * Math.sin(dt * .005 + i * 2));
          destello(r.x + r.w * x, r.y + r.h * y, 5 + i % 3, a);
        });

        ctx.restore();
      }

      if (dt >= 2000 && !estado.opciones) {
        estado.opciones = true;
        $("scene-closure").textContent = "Todo lo que fui también está en mi voz.";
        $("scene-hint").textContent = "Love is the highest frequency.";
        $("btn-restart").hidden = true;

        opcionesFlotantes(
          "Volver a la galería",
          galeria,
          "Construir de nuevo",
          reiniciar
        );
      }
    }
  }

  function opcionesFlotantes(a, fa, b, fb) {
    $("letters-layer").replaceChildren();

    const div = document.createElement("div");
    div.className = "scene-text-actions";

    Object.assign(div.style, {
      position: "absolute",
      bottom: ancho <= 700 ? "145px" : "125px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      gap: "25px",
      justifyContent: "center",
      alignItems: "center",
      flexWrap: "wrap",
      width: "min(95vw,720px)",
      zIndex: "20",
      pointerEvents: "auto"
    });

    [[a, fa], [b, fb]].forEach(([titulo, fn]) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "scene-text-link";
      boton.textContent = titulo;

      Object.assign(boton.style, {
        background: "none",
        border: "0",
        color: "#fff0e8",
        fontFamily: "var(--display, Georgia, serif)",
        fontSize: "clamp(18px,2.2vw,25px)",
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: "6px",
        textShadow: "0 2px 12px #000",
        padding: "3px 6px"
      });

      boton.addEventListener("click", fn);
      div.appendChild(boton);
    });

    $("letters-layer").append(div);
  }

  function bajar(e) {
    if (escena < 0) return;

    cursor = {
      x: e.clientX,
      y: e.clientY,
      tipo: e.pointerType
    };

    if (escena === 5) {
      e.preventDefault();
      paso6();
      return;
    }

    if (escena === 3 && estado.hilos) {
      const rojo = extremoCuerda(estado.hilos.rojo);

      if (
        Math.hypot(e.clientX - rojo.x, e.clientY - rojo.y) <=
        (ancho <= 700 ? 62 : 47)
      ) {
        e.preventDefault();
        arrastre = { id: e.pointerId, tipo: 3 };
        canvas.setPointerCapture(e.pointerId);
        sujetarRojo(e.clientX, e.clientY);
      }
      return;
    }

    const im = escenaImagen();
    if (!im) return;

    const r = encuadre(im);
    if (!dentro(e.clientX, e.clientY, r)) return;

    const p = local(e.clientX, e.clientY, r);

    if (escena === 0 && estado.capa && estado.revelado === null) {
      e.preventDefault();
      arrastre = { id: e.pointerId, tipo: 0, anterior: p };
      canvas.setPointerCapture(e.pointerId);
      borrarRaiz(p, p);

      if (!audioIniciado && !pausaManual) iniciarAudio(2000);

    } else if (escena === 1 && clickBuzon(p, im)) {
      e.preventDefault();
      soltarCarta();

    } else if (escena === 2 && vidrio(p, im)) {
      e.preventDefault();
      dejarBeso(p);

    } else if (
      escena === 4 &&
      estado.encontrados &&
      estado.final === null
    ) {
      e.preventDefault();
      arrastre = { id: e.pointerId, tipo: 4 };
      canvas.setPointerCapture(e.pointerId);
      estado.luz = true;
      estado.x = e.clientX;
      estado.y = e.clientY;

      if (!audioIniciado && !pausaManual) iniciarAudio(2000);
    }
  }

  function mover(e) {
    cursor = {
      x: e.clientX,
      y: e.clientY,
      tipo: e.pointerType
    };

    if (!arrastre || arrastre.id !== e.pointerId) return;
    e.preventDefault();

    if (
      arrastre.tipo === 0 &&
      escena === 0 &&
      estado.capa &&
      estado.revelado === null
    ) {
      const r = encuadre(img.raiz);
      const p = local(e.clientX, e.clientY, r);

      p.x = clamp(p.x, 0, img.raiz.width);
      p.y = clamp(p.y, 0, img.raiz.height);

      borrarRaiz(arrastre.anterior || p, p);
      arrastre.anterior = p;
    }

    if (arrastre.tipo === 3 && escena === 3 && estado.hilos) {
      estado.hilos.objetivo = {
        x: clamp(e.clientX, ancho * .08, ancho * .64),
        y: clamp(e.clientY, alto * .16, alto * .87)
      };
    }

    if (arrastre.tipo === 4 && escena === 4) {
      estado.x = e.clientX;
      estado.y = e.clientY;
    }
  }

  function subir() {
    if (arrastre && arrastre.tipo === 3 && escena === 3) {
      soltarRojo();
    }

    if (
      arrastre &&
      canvas &&
      canvas.hasPointerCapture(arrastre.id)
    ) {
      canvas.releasePointerCapture(arrastre.id);
    }

    arrastre = null;

    if (escena === 4 && estado.encontrados) {
      estado.luz = false;
      estado.objetivo = "";
      estado.desde = 0;
    }
  }

  function teclado(e) {
    if (escena < 0) return;

    if (
      escena === 3 &&
      estado.hilos &&
      document.activeElement === canvas
    ) {
      const h = estado.hilos;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();

        if (h.sujeto && h.teclado) {
          soltarRojo();
        } else if (!h.sujeto) {
          const tip = extremoCuerda(h.rojo);
          sujetarRojo(tip.x, tip.y, true);
        }
        return;
      }

      if (e.key === "Escape" && h.sujeto && h.teclado) {
        e.preventDefault();
        soltarRojo();
        return;
      }

      if (
        h.sujeto &&
        h.teclado &&
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
      ) {
        e.preventDefault();

        const paso = e.shiftKey ? 30 : 15;

        h.objetivo.x += e.key === "ArrowRight"
          ? paso
          : e.key === "ArrowLeft" ? -paso : 0;

        h.objetivo.y += e.key === "ArrowDown"
          ? paso
          : e.key === "ArrowUp" ? -paso : 0;

        h.objetivo.x = clamp(
          h.objetivo.x,
          ancho * .08,
          ancho * .64
        );

        h.objetivo.y = clamp(
          h.objetivo.y,
          alto * .16,
          alto * .87
        );
        return;
      }
    }

    if (e.key === "Escape") {
      if (document.activeElement === canvas) galeria();
      return;
    }

    if (
      (e.key === "Enter" || e.key === " ") &&
      !["BUTTON", "INPUT", "TEXTAREA", "A"].includes(document.activeElement?.tagName)
    ) {
      if (escena === 5) {
        e.preventDefault();
        paso6();
      } else if (escena === 4) {
        e.preventDefault();
        accion();
      }
    }
  }

  function accion() {
    if (escena === 0 && estado.capa && estado.revelado === null) {
      estado.revelado = reloj();
      if (!audioIniciado && !pausaManual) iniciarAudio(2000);

    } else if (escena === 1) {
      soltarCarta();

    } else if (escena === 2 && img.jardin) {
      const puntos = [[.8,.2],[.93,.3],[.72,.17],[.91,.48]];
      const [x, y] = puntos[estado.besos.length % puntos.length];
      dejarBeso({
        x: x * img.jardin.width,
        y: y * img.jardin.height
      });

    } else if (escena === 4 && estado.encontrados) {
      const siguiente = Object.keys(ZONAS).find(k => !estado.encontrados[k]);

      if (siguiente) {
        if (!audioIniciado && !pausaManual) iniciarAudio(2000);
        descubrir(siguiente);
      }

    } else if (escena === 5) {
      paso6();
    }

    botones();
  }

  function iniciarAudio(duracion) {
    if (escena < 0 || !E[escena].audio || pausaManual) return;

    if (!musica) {
      musica = new Audio(E[escena].audio);
      musica.preload = "auto";
      musica.muted = silencio;
      musica.loop = false;

      const actual = musica;

      actual.addEventListener("error", () => {
        if (musica !== actual) return;
        mensaje("Revisa el audio: " + E[escena].audio);
      });

      actual.addEventListener("ended", () => {
        if (musica === actual) {
          audioIniciado = false;
          botones();
        }
      });

      if (escena === 3) iniciarEfectosHilos(actual);

      if (escena === 2) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;

          if (AC) {
            audioContext = new AC();

            const fuente = audioContext.createMediaElementSource(musica);

            audioFiltro = audioContext.createBiquadFilter();
            audioFiltro.type = "lowpass";
            audioFiltro.frequency.value = 680;

            fuente.connect(audioFiltro);
            audioFiltro.connect(audioContext.destination);
          }
        } catch (err) {
          console.warn("Filtro no disponible", err);
        }
      }
    }

    if (audioIniciado && !musica.paused) return;
    if (musica.ended) musica.currentTime = 0;

    if (audioContext?.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    audioIniciado = true;
    musica.volume = duracion ? 0 : .78;

    fadeAudio = duracion
      ? { inicio: reloj(), duracion }
      : null;

    musica.play()
      .then(botones)
      .catch(() => {
        audioIniciado = false;
        mensaje("Para escuchar, pulsa Música.");
        botones();
      });

    botones();
  }

  function actualizarAudio() {
    if (!musica || musica.paused) return;

    if (fadeAudio) {
      const t = clamp(
        (reloj() - fadeAudio.inicio) / fadeAudio.duracion,
        0,
        1
      );

      musica.volume = .78 * t;
      if (t === 1) fadeAudio = null;
    }

    if (Number.isFinite(musica.duration) && musica.duration > 0) {
      const resta = musica.duration - musica.currentTime;

      if (resta < 1.2) {
        musica.volume = Math.min(
          musica.volume,
          .78 * clamp(resta / 1.2, 0, 1)
        );
      }
    }
  }

  function musicaManual() {
    if (escena < 0 || !E[escena].audio) return;

    if (musica && !musica.paused) {
      musica.pause();
      pausaManual = true;
      fadeAudio = null;
      botones();
    } else {
      pausaManual = false;
      iniciarAudio(500);
    }
  }

  function pararAudio() {
    fadeAudio = null;

    const anterior = musica;
    const ac = audioContext;

    musica = null;
    audioContext = null;
    audioFiltro = null;
    audioHilos = null;
    audioIniciado = false;

    if (anterior) {
      const inicio = reloj();
      const volumen = anterior.volume;

      const salida = () => {
        const t = clamp((reloj() - inicio) / 260, 0, 1);
        anterior.volume = volumen * (1 - t);

        if (t < 1) {
          requestAnimationFrame(salida);
        } else {
          anterior.pause();
          anterior.removeAttribute("src");
          anterior.load();

          if (ac) ac.close().catch(() => {});
        }
      };

      if (anterior.paused) {
        anterior.removeAttribute("src");
        anterior.load();
        if (ac) ac.close().catch(() => {});
      } else {
        requestAnimationFrame(salida);
      }
    } else if (ac) {
      ac.close().catch(() => {});
    }
  }

  function botones() {
    const activo = escena >= 0;

    $("btn-play").disabled = !activo || !E[escena]?.audio;
    $("btn-play").textContent = musica && !musica.paused
      ? "Pausar"
      : "Música";

    $("btn-mute").textContent = silencio
      ? "Activar sonido"
      : "Silenciar";

    $("btn-mute").disabled = !activo || !E[escena]?.audio;

    if (!activo) return;

    if (escena === 5) {
      $("btn-action").disabled =
        !listo6() ||
        !!estado.animacion ||
        estado.visibles === 6;
    }

    if (escena === 1) {
      $("btn-action").disabled =
        !!estado.vuelo ||
        estado.cantidad === 4;
    }

    if (escena === 0) {
      $("btn-action").disabled =
        !estado.capa ||
        estado.revelado !== null;
    }

    if (escena === 4) {
      $("btn-action").disabled =
        !estado.encontrados ||
        totalSuenos() === 3;
    }
  }

  function mensaje(texto) {
    $("scene-status").textContent = texto;
    $("scene-status").style.opacity = texto ? "1" : "0";
  }

  function redimensionar() {
    const anteriorAncho = ancho;
    const anteriorAlto = alto;

    ancho = window.innerWidth;
    alto = window.innerHeight;

    if (
      anteriorAncho > 0 &&
      anteriorAlto > 0 &&
      escena === 3 &&
      estado.hilos
    ) {
      reescalarHilos(
        ancho / anteriorAncho,
        alto / anteriorAlto
      );
    }

    const dpr = Math.min(2, window.devicePixelRatio || 1);

    canvas.width = Math.floor(ancho * dpr);
    canvas.height = Math.floor(alto * dpr);
    canvas.style.width = ancho + "px";
    canvas.style.height = alto + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    capaSuenos = null;

    if (escena === 1) {
      $("letters-layer")
        .querySelectorAll(".letter-card")
        .forEach(posicionarCarta);
    }
  }

  function boot() {
    canvas = document.createElement("canvas");

    canvas.setAttribute("tabindex", "0");
    canvas.setAttribute(
      "aria-label",
      "Lienzo interactivo de la galería de IXA"
    );

    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.zIndex = "0";
    canvas.style.touchAction = "none";

    document.body.prepend(canvas);

    ctx = canvas.getContext("2d", { alpha: false });

    redimensionar();
    portada();
    conectar();
    galeria();
    iniciarCarga();

    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
