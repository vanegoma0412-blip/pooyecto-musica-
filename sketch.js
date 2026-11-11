let escenaActual = -1;

let fuenteTitulo = "Georgia";
let fondoPrincipal;

let escala = 1;
let margenX = 0;
let margenY = 0;

const anchoBase = 1366;
const altoBase = 768;

const colorCrema = "#eee0c8";
const colorRojo = "#c5443b";

let escenas = [
  {
    titulo: "La raíz",
    x: 350,
    y: 375,
    hover: 0
  },
  {
    titulo: "Lo que no dije",
    x: 660,
    y: 375,
    hover: 0
  },
  {
    titulo: "El jardín del deseo",
    x: 350,
    y: 448,
    hover: 0
  },
  {
    titulo: "Después de ti",
    x: 660,
    y: 448,
    hover: 0
  },
  {
    titulo: "Entre sueños",
    x: 350,
    y: 521,
    hover: 0
  },
  {
    titulo: "La frecuencia",
    x: 660,
    y: 521,
    hover: 0
  }
];

function setup() {
  createCanvas(windowWidth, windowHeight);

  loadFont("assets/fuentes/CormorantGaramond-Light.ttf")
    .then(function(fuente) {
      fuenteTitulo = fuente;
    })
    .catch(function(error) {
      console.error("No se pudo cargar la fuente:", error);
    });
  loadImage("assets/imagenes/fondo-principal.png")
    .then(function(imagen) {
      fondoPrincipal = imagen;
    })
    .catch(function(error) {
      console.error("No se pudo cargar el fondo:", error);
    });
}

function actualizarEscala() {
  escala = min(width / anchoBase, height / altoBase);
  margenX = (width - anchoBase * escala) / 2;
  margenY = (height - altoBase * escala) / 2;
}

function draw() {
  background("#241c18");
  cursor(ARROW);

  actualizarEscala();

  if (escenaActual === -1 && fondoPrincipal) {
    let escalaFondo = max(
      width / fondoPrincipal.width,
      height / fondoPrincipal.height
    );
    let anchoFondo = fondoPrincipal.width * escalaFondo;
    let altoFondo = fondoPrincipal.height * escalaFondo;

    image(
      fondoPrincipal,
      (width - anchoFondo) / 2,
      (height - altoFondo) / 2,
      anchoFondo,
      altoFondo
    );
  }

  push();
  translate(margenX, margenY);
  scale(escala);

  if (escenaActual === -1) {
    dibujarInicio();
  } else {
    dibujarEscena();
  }
  pop();
}

function dibujarInicio() {
  noStroke();
  fill(colorCrema);
  textAlign(CENTER, CENTER);
  textFont(fuenteTitulo);
  textStyle(NORMAL);
  textSize(155);
  text("IXA", 650, 130);
  textStyle(ITALIC);
  textSize(45);
  text("Love is the highest frequency", 650, 225);
  textStyle(NORMAL);
  stroke("#9d4439");
  strokeWeight(1);
  line(515, 274, 785, 274);

  noStroke();
  fill(colorCrema);
  textSize(20);
  text("LOVE IN PIECES", 650, 300);

  textStyle(ITALIC);
  textSize(18);
  text("The Art of Falling Apart", 650, 328);
  textStyle(NORMAL);
  for (let i = 0; i < escenas.length; i++) {
    dibujarBoton(escenas[i], i);
  }
}

function obtenerMouse() {
  return {
    x: (mouseX - margenX) / escala,
    y: (mouseY - margenY) / escala
  };
}

function mouseSobreBoton(escena) {
  let mouse = obtenerMouse();

  return (
    mouse.x >= escena.x &&
    mouse.x <= escena.x + 290 &&
    mouse.y >= escena.y - 27 &&
    mouse.y <= escena.y + 30
  );
}

function dibujarBoton(escena, indice) {
  let encima = mouseSobreBoton(escena);
  let destino = encima ? 1 : 0;
  let suavidad = 1 - Math.exp(-deltaTime / 120);
  escena.hover = lerp(escena.hover, destino, suavidad);

  if (encima) {
    cursor(HAND);
  }

  let fondo = lerpColor(
  color(35, 25, 20, 65),
  color(125, 12, 22, 240),
  escena.hover
);

let borde = lerpColor(
  color(205, 183, 150, 170),
  color(205, 100, 90),
  escena.hover
);

  fill(fondo);
  stroke(borde);
  strokeWeight(1.2);
  rect(escena.x, escena.y - 27, 290, 57);
  let x = escena.x + escena.hover * 5;
  let y = escena.y - escena.hover * 2;

  noStroke();
  textFont(fuenteTitulo);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);
  fill(colorRojo);
  textSize(23);
  text(String(indice + 1).padStart(2, "0"), x + 12, y);

  fill(colorCrema);

  let tamanoTexto = 29;
  textSize(tamanoTexto);

  while (textWidth(escena.titulo) > 190 && tamanoTexto > 16) {
    tamanoTexto--;
    textSize(tamanoTexto);
  }

  text(escena.titulo, x + 50, y);

  stroke(colorCrema);
  strokeWeight(1.3);
  let flechaX = x + 269;

  line(flechaX - 15, y, flechaX, y);
  line(flechaX - 6, y - 5, flechaX, y);
  line(flechaX - 6, y + 5, flechaX, y);

  noStroke();
}

function dibujarEscena() {
  let escena = escenas[escenaActual];

  noStroke();
  fill("#241c18");
  rect(0, 0, anchoBase, altoBase);
  fill(colorCrema);
  textFont(fuenteTitulo);
  textStyle(NORMAL);
  textAlign(CENTER, CENTER);
  textSize(65);
  text(escena.titulo, anchoBase / 2, altoBase / 2 - 45);
  textSize(26);
  text(
    "Aquí irá el contenido de esta escena",
    anchoBase / 2,
    altoBase / 2 + 35
  );

  let encima = mouseSobreInicio();

  fill(encima ? colorRojo : colorCrema);
  textAlign(LEFT, CENTER);
  textSize(28);
  text("← Inicio", 45, 55);

  if (encima) {
    cursor(HAND);
  }
}

function mouseSobreInicio() {
  let mouse = obtenerMouse();
  return (
    mouse.x >= 30 &&
    mouse.x <= 180 &&
    mouse.y >= 30 &&
    mouse.y <= 80
  );
}

function mousePressed() {
  if (escenaActual === -1) {
    for (let i = 0; i < escenas.length; i++) {
      if (mouseSobreBoton(escenas[i])) {
        escenaActual = i;
        break;
      }
    }
  } else if (mouseSobreInicio()) {
    escenaActual = -1;
    for (let escena of escenas) {
      escena.hover = 0;
    }
  }
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}