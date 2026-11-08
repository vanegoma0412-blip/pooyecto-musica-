
let escenaActual = -1;

let fuenteTitulo;
let fuenteManuscrita;


let escenas = [
  {
    titulo: "TEXTO 1",
    subtitulo: "TEXTO 1.1",
    x: 0.23,
    y: 0.36
  },
  {
    titulo: "TEXTO 2",
    subtitulo: "TEXTO 2.1",
    x: 0.77,
    y: 0.36
  },
  {
    titulo: "TEXTO 3",
    subtitulo: "TEXTO 3.1",
    x: 0.50,
    y: 0.52
  },
  {
    titulo: "TEXTO 4",
    subtitulo: "TEXTO 4.1",
    x: 0.23,
    y: 0.70
  },
  {
    titulo: "TEXTO 5",
    subtitulo: "TEXTO 5.1",
    x: 0.77,
    y: 0.70
  },
  {
    titulo: "TEXTO 6",
    subtitulo: "TEXTO 6.1",
    x: 0.50,
    y: 0.87
  }
];


function setup() {
  createCanvas(windowWidth, windowHeight);

  fuenteTitulo = "Georgia";
  fuenteManuscrita = "cursive";

  loadFont("assets/fuentes/CormorantGaramond-Light.ttf")
    .then(function(fuente) {
      fuenteTitulo = fuente;
    })
    .catch(function(error) {
      console.error("Error con Cormorant:", error);
    });

  loadFont("assets/fuentes/MrsSainDelafield-Regular.ttf")
    .then(function(fuente) {
      fuenteManuscrita = fuente;
    })
    .catch(function(error) {
      console.error("Error con Mrs Saint Delafield:", error);
    });
}

function draw() {
  background(24, 14, 20);
  cursor(ARROW);

  if (escenaActual === -1) {
    dibujarInicio();
  } else {
    dibujarEscena();
  }
}

function dibujarInicio() {
  noStroke();
  fill(180, 135, 155, 100);
  circle(width * 0.10, height * 0.10, 180);

  fill(24, 14, 20);
  circle(width * 0.14, height * 0.08, 175);

  textAlign(CENTER, CENTER);
  fill(245, 230, 220);

  textFont(fuenteTitulo);
  textSize(90);
  text("IXA", width / 2, height * 0.11);

  textFont(fuenteManuscrita);
  textSize(42);
  text(
    "Love is the highest frequency 44",
    width / 2,
    height * 0.21
  );

  stroke(170, 120, 135);
  strokeWeight(1);

  line(
    width * 0.30,
    height * 0.27,
    width * 0.70,
    height * 0.27
  );

  for (let i = 0; i < escenas.length; i++) {
    dibujarBoton(escenas[i], i);
  }
}

function dibujarBoton(escena, i) {
  let x = width * escena.x;
  let movimiento = sin(frameCount * 0.02 + i) * 5;
  let y = height * escena.y + movimiento;

  let ancho = min(320, width * 0.42);
  let alto = 85;

  let encima =
    mouseX > x - ancho / 2 &&
    mouseX < x + ancho / 2 &&
    mouseY > y - alto / 2 &&
    mouseY < y + alto / 2;

  noStroke();

  if (encima) {
    fill(250, 224, 214);
    cursor(HAND);
  } else {
    fill(218, 185, 175);
  }

  rect(
    x - ancho / 2,
    y - alto / 2,
    ancho,
    alto,
    25
  );

  fill(48, 25, 33);
  textAlign(CENTER, CENTER);

  textFont(fuenteTitulo);
  textSize(25);
  text(escena.titulo, x, y - 15);

  textFont(fuenteManuscrita);
  textSize(26);
  text(escena.subtitulo, x, y + 18);
}

function dibujarEscena() {
  let escena = escenas[escenaActual];

  fill(245, 230, 220);
  textAlign(CENTER, CENTER);

  textFont(fuenteTitulo);
  textSize(55);
  text(
    escena.titulo,
    width / 2,
    height / 2 - 60
  );

  textFont(fuenteManuscrita);
  textSize(38);
  text(
    escena.subtitulo,
    width / 2,
    height / 2 + 10
  );

  textFont(fuenteTitulo);
  textSize(20);
  text(
    "Aquí irá el contenido de esta escena",
    width / 2,
    height / 2 + 100
  );

  fill(218, 185, 175);
  noStroke();
  rect(30, 30, 145, 45, 20);

  fill(48, 25, 33);
  textFont(fuenteTitulo);
  textSize(22);
  text("← Inicio", 102, 52);

  if (
    mouseX > 30 &&
    mouseX < 175 &&
    mouseY > 30 &&
    mouseY < 75
  ) {
    cursor(HAND);
  }
}

function mousePressed() {
  if (escenaActual === -1) {
    for (let i = 0; i < escenas.length; i++) {
      let escena = escenas[i];

      let x = width * escena.x;
      let y = height * escena.y +
        sin(frameCount * 0.02 + i) * 5;

      let ancho = min(320, width * 0.42);

      if (
        mouseX > x - ancho / 2 &&
        mouseX < x + ancho / 2 &&
        mouseY > y - 42.5 &&
        mouseY < y + 42.5
      ) {
        escenaActual = i;
        break;
      }
    }
  } else {
    if (
      mouseX > 30 &&
      mouseX < 175 &&
      mouseY > 30 &&
      mouseY < 75
    ) {
      escenaActual = -1;
    }
  }
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
