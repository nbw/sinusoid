import Circle from "./circle";
import Midi from "./midi";
import OPZ from "opzjs";

let PHASE = 0;

const COLORS = [
  '#CA281D', // Red
  '#F4AE01', // Yellow
  '#0071BB', // Blue
  '#11A159', // Green
  '#F56C46', // Orange
  '#008080', // Teal/Turq
  '#5BB5F2', // Light Blue
  '#7832B4', // Purple
];

const TRACKS = [
  'kick',
  'snare',
  'perc',
  'sample',
  'bass',
  'lead',
  'arp',
  'chord'
]

const circles = [];

let fadeRate = 0.009; // default
let phaseRate = 0.007; // default

const midi = new Midi();

const canvas  = document.getElementById('canvas');
const scratch = document.createElement('canvas');
const ctxM = canvas.getContext('2d'); // Main
const ctxS = scratch.getContext('2d'); // Scratch

const setupCanvas = (c) => {
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}

setupCanvas(canvas);
setupCanvas(scratch);

const newCenterCircle = (x, y, radius, phase, color = "#000") => {
  return new Circle(x, y, radius, phase, color);
};

const circleRadius = () => {
  const width = window.innerWidth;
  const tracks = TRACKS.length;
  return width/(2*tracks);
};

const circleOriginX = (index) => {
  const width = window.innerWidth;
  const tracks = TRACKS.length;
  return circleRadius() + index*width/tracks;
}

const color = (index) => {
  return COLORS[index % COLORS.length];
}

const whiteCircles = () => {
  for (let i = 0; i < TRACKS.length; i++) {
    const x = circleOriginX(i);
    const y = window.innerHeight/2;
    const r = circleRadius();
    const p = i*2*Math.PI/(TRACKS.length - 1) + PHASE;
    const c = '#FFF';
    circles.push(new Circle(x, y, r, p, c, true));
  }
}

const setPhase = (velocity) => {
  const v = velocity/128.0;

  phaseRate = 0.05*v;
};

const setFade = (velocity) => {
  const v = velocity/128.0;

  fadeRate = Math.max(0.018*v, 0.005);
};

const midiHandler = (event) => {
  const data = OPZ.decode(event.data);

  if (data.velocity > 0 && data.action === "keys") {
    const i = TRACKS.indexOf(data.track);

    if (i < 0) return;

    const x = circleOriginX(i);
    const y = window.innerHeight/2;
    const r = circleRadius();
    const p = i*2*Math.PI/(TRACKS.length - 1) + PHASE;
    const c = color(i);

    circles.push(new Circle(x, y, r, p, c));
  }

  if (data.action === "dial" && data.track === "motion") {
    if(data.value.dialColor === "green") {
      setPhase(data.velocity);
    }
    if(data.value.dialColor === "blue") {
      setFade(data.velocity);
    }
  }
};

const drawCircle = (ctx, circle) => {
  ctx.beginPath();
  const y = circle.y + Math.sin(circle.phase + PHASE)*window.innerHeight/4;
  ctx.globalAlpha = circle.opacity;
  ctx.arc(circle.x, y, circle.radius-1, 0, 2 * Math.PI, false);
  ctx.closePath();
  ctx.strokeStyle = circle.color;
  ctx.stroke();
}

const clearCanvas = (ctx, c) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const incrementPhase = (amount) => {
  PHASE = (PHASE + amount) % (2*Math.PI);
}

const draw = () => {
  setupCanvas(canvas);
  setupCanvas(scratch);
  clearCanvas(ctxS, scratch);
  clearCanvas(ctxM, canvas);

  whiteCircles();

  for (var i = circles.length - 1; i >= 0; --i) {
    drawCircle(ctxS, circles[i]);
    // Remove: white circles OR faded out circles
    if (circles[i].inv || circles[i].opacity < 0) {
      circles.splice(i,1);
    } else {
      circles[i].decreaseOpacity(fadeRate);
    }
  }

  incrementPhase(phaseRate);

  ctxM.drawImage(scratch, 0, 0);

  window.webkitRequestAnimationFrame(draw);
}

window.webkitRequestAnimationFrame(draw);

// Midi connect handler
document.getElementById("midi-connect").addEventListener("click", (e) => {
  midi.setup();
  setTimeout( () => {
    if (midi.devices.length > 0) {
      for (let deviceId in midi.devices) {
        midi.selectDevice(deviceId, midiHandler)
      }
      const menu = document.getElementById("menu");
      menu.classList.add("hide")
    } else {
      const error = document.getElementById("midi-connect-error")
      error.innerHTML = "Couldn't detect any midi devices (check browser support)";
    }
  }, 200);
});

