(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var Circle = /*#__PURE__*/function () {
  function Circle(x, y, radius, phase, color) {
    var inv = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
    (0, _classCallCheck2.default)(this, Circle);
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.phase = phase;
    this.inv = inv; // invulnerability flag
  }

  (0, _createClass2.default)(Circle, [{
    key: "incrementPhase",
    value: function incrementPhase(amount) {
      this.phase = (this.phase + amount) % Math.PI;
    }
  }, {
    key: "decreaseOpacity",
    value: function decreaseOpacity(amount) {
      this.opacity -= amount;
    }
  }]);
  return Circle;
}();

var _default = Circle;
exports.default = _default;

},{"@babel/runtime/helpers/classCallCheck":4,"@babel/runtime/helpers/createClass":5,"@babel/runtime/helpers/interopRequireDefault":6}],2:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _circle = _interopRequireDefault(require("./circle"));

var _midi = _interopRequireDefault(require("./midi"));

var _opzjs = _interopRequireDefault(require("opzjs"));

var PHASE = 0;
var COLORS = ['#CA281D', // Red
'#F4AE01', // Yellow
'#0071BB', // Blue
'#11A159', // Green
'#F56C46', // Orange
'#008080', // Teal/Turq
'#5BB5F2', // Light Blue
'#7832B4' // Purple
];
var TRACKS = ['kick', 'snare', 'perc', 'sample', 'bass', 'lead', 'arp', 'chord'];
var circles = [];
var fadeRate = 0.009; // default

var phaseRate = 0.007; // default

var midi = new _midi.default();
var canvas = document.getElementById('canvas');
var scratch = document.createElement('canvas');
var ctxM = canvas.getContext('2d'); // Main

var ctxS = scratch.getContext('2d'); // Scratch

var setupCanvas = function setupCanvas(c) {
  c.width = window.innerWidth;
  c.height = window.innerHeight;
};

setupCanvas(canvas);
setupCanvas(scratch);

var newCenterCircle = function newCenterCircle(x, y, radius, phase) {
  var color = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "#000";
  return new _circle.default(x, y, radius, phase, color);
};

var circleRadius = function circleRadius() {
  var width = window.innerWidth;
  var tracks = TRACKS.length;
  return width / (2 * tracks);
};

var circleOriginX = function circleOriginX(index) {
  var width = window.innerWidth;
  var tracks = TRACKS.length;
  return circleRadius() + index * width / tracks;
};

var color = function color(index) {
  return COLORS[index % COLORS.length];
};

var whiteCircles = function whiteCircles() {
  for (var i = 0; i < TRACKS.length; i++) {
    var x = circleOriginX(i);
    var y = window.innerHeight / 2;
    var r = circleRadius();
    var p = i * 2 * Math.PI / (TRACKS.length - 1) + PHASE;
    var c = '#FFF';
    circles.push(new _circle.default(x, y, r, p, c, true));
  }
};

var setPhase = function setPhase(velocity) {
  var v = velocity / 128.0;
  phaseRate = 0.05 * v;
};

var setFade = function setFade(velocity) {
  var v = velocity / 128.0;
  fadeRate = Math.max(0.018 * v, 0.005);
};

var midiHandler = function midiHandler(event) {
  var data = _opzjs.default.decode(event.data);

  if (data.velocity > 0 && data.action === "keys") {
    var i = TRACKS.indexOf(data.track);
    if (i < 0) return;
    var x = circleOriginX(i);
    var y = window.innerHeight / 2;
    var r = circleRadius();
    var p = i * 2 * Math.PI / (TRACKS.length - 1) + PHASE;
    var c = color(i);
    circles.push(new _circle.default(x, y, r, p, c));
  }

  if (data.action === "dial" && data.track === "motion") {
    if (data.value.dialColor === "green") {
      setPhase(data.velocity);
    }

    if (data.value.dialColor === "blue") {
      setFade(data.velocity);
    }
  }
};

var drawCircle = function drawCircle(ctx, circle) {
  ctx.beginPath();
  var y = circle.y + Math.sin(circle.phase + PHASE) * window.innerHeight / 4;
  ctx.globalAlpha = circle.opacity;
  ctx.arc(circle.x, y, circle.radius - 1, 0, 2 * Math.PI, false);
  ctx.closePath();
  ctx.strokeStyle = circle.color;
  ctx.stroke();
};

var clearCanvas = function clearCanvas(ctx, c) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

var incrementPhase = function incrementPhase(amount) {
  PHASE = (PHASE + amount) % (2 * Math.PI);
};

var draw = function draw() {
  setupCanvas(canvas);
  setupCanvas(scratch);
  clearCanvas(ctxS, scratch);
  clearCanvas(ctxM, canvas);
  whiteCircles();

  for (var i = circles.length - 1; i >= 0; --i) {
    drawCircle(ctxS, circles[i]); // Remove: white circles OR faded out circles

    if (circles[i].inv || circles[i].opacity < 0) {
      circles.splice(i, 1);
    } else {
      circles[i].decreaseOpacity(fadeRate);
    }
  }

  incrementPhase(phaseRate);
  ctxM.drawImage(scratch, 0, 0);
  window.webkitRequestAnimationFrame(draw);
};

window.webkitRequestAnimationFrame(draw); // Midi connect handler

document.getElementById("midi-connect").addEventListener("click", function (e) {
  midi.setup();
  setTimeout(function () {
    if (midi.devices.length > 0) {
      for (var deviceId in midi.devices) {
        midi.selectDevice(deviceId, midiHandler);
      }

      var menu = document.getElementById("menu");
      menu.classList.add("hide");
    } else {
      var error = document.getElementById("midi-connect-error");
      error.innerHTML = "Couldn't detect any midi devices (check browser support)";
    }
  }, 200);
});

},{"./circle":1,"./midi":3,"@babel/runtime/helpers/interopRequireDefault":6,"opzjs":7}],3:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var Midi = /*#__PURE__*/function () {
  function Midi() {
    (0, _classCallCheck2.default)(this, Midi);
    this.self = this;
    this.devices = [];
    this.supported = this.checkMidiSupport();
  }

  (0, _createClass2.default)(Midi, [{
    key: "setup",
    value: function setup() {
      navigator.requestMIDIAccess().then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
    }
  }, {
    key: "onMIDISuccess",
    value: function onMIDISuccess(midiAccess) {
      var inputs = midiAccess.inputs.values();

      var _iterator = _createForOfIteratorHelper(midiAccess.inputs.values()),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var input = _step.value;
          this.devices.push(input);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "onMIDIFailure",
    value: function onMIDIFailure() {
      console.log('Could not access your MIDI devices.');
    }
  }, {
    key: "checkMidiSupport",
    value: function checkMidiSupport() {
      if (navigator.requestMIDIAccess) {
        console.log('This browser supports WebMIDI!');
        return true;
      } else {
        console.log('WebMIDI is not supported in this browser.');
        return false;
      }
    }
  }, {
    key: "selectDevice",
    value: function selectDevice(deviceIndex, handler) {
      var device = this.devices[deviceIndex];
      device.onmidimessage = handler;
      console.log("Connected to \"".concat(device.name, "\""));
    }
  }]);
  return Midi;
}();

var _default = Midi;
exports.default = _default;

},{"@babel/runtime/helpers/classCallCheck":4,"@babel/runtime/helpers/createClass":5,"@babel/runtime/helpers/interopRequireDefault":6}],4:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;

},{}],5:[function(require,module,exports){
"use strict";

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;

},{}],6:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;

},{}],7:[function(require,module,exports){
"use strict";

var _MIDI = require('./opz.json');

var error = function error(value) {
  console.log('[OPZ]: Untracked midi value. Please create an issue https://github.com/nbw/opz/issues');
  console.log("[OPZ]: ".concat(value));
  return value;
};

var get = function get() {
  var value = _MIDI;

  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  for (var i = 0; i < args.length; i++) {
    value = value[args[i]];
    if (!value) throw 'Untracked value';
  }

  return value;
};

var track = function track(input) {
  if (input.length < 1) return null;
  return get('track', input[0]);
};

var action = function action(input) {
  if (input.length < 1) return null;
  return get('action', input[0]);
};

var note = function note(input) {
  if (input.length < 2) return null;
  var n = input[1];
  return {
    value: n,
    note: get('notes', n % 12)
  };
};

var dial = function dial(input) {
  if (input.length < 2) return null;
  var d = input[1];
  return {
    dial: (d - 1) % 4,
    // 0 - 3
    dialColor: get('dial', 'color', d % 100),
    page: Math.floor((d - 1) / 4),
    // 0 - 3
    pageColor: get('dial', 'page', track(input), d % 100)
  };
};

var pitch = function pitch(input) {
  if (input.length < 3) return null;
  return {
    absolute: input[1],
    relative: input[2]
  };
};

var value = function value(input) {
  if (input.length < 3) return null;

  switch (action(input)) {
    case 'keys':
      return note(input);

    case 'dial':
      return dial(input);

    case 'pitch bend':
      return pitch(input);

    default:
      return {};
  }
};

var velocity = function velocity(input) {
  if (input.length < 3) return -1;
  return input[2];
};

var control = function control(input) {
  var c = get('control', input[0]);
  return {
    track: c,
    action: c,
    velocity: velocity(input),
    value: {}
  };
};

var decode = function decode(input) {
  try {
    if (input.length === 1) return control(input);
    if (input.length === 2) return null;
    return {
      track: track(input),
      action: action(input),
      velocity: velocity(input),
      value: value(input)
    };
  } catch (e) {
    error(input);
  }
};

module.exports = {
  decode: decode,
  velocity: velocity
};

},{"./opz.json":8}],8:[function(require,module,exports){
module.exports={
  "dictionary": {
    "action": {
      "dial": "dial",
      "keys": "keys",
      "pitch": "pitch bend"
    },
    "color": {
      "blue": "blue",
      "green": "green",
      "purple": "purple",
      "red": "red",
      "white": "white",
      "yellow": "yellow"
    },
    "track": {
      "arp": "arp",
      "bass": "bass",
      "chord": "chord",
      "fx1": "fx1",
      "fx2": "fx2",
      "kick": "kick",
      "lead": "lead",
      "lights": "lights",
      "master": "master",
      "module": "module",
      "motion": "motion",
      "perc": "perc",
      "perform": "perform",
      "sample": "sample",
      "snare": "snare",
      "tape": "tape"
    },
    "clock": "clock",
    "kill": "kill",
    "start": "start",
    "stop": "stop"
  },
  "control": {
    "248": "clock",
    "250": "start",
    "252": "stop"
  },
  "action": {
    "128": "keys",
    "129": "keys",
    "130": "keys",
    "131": "keys",
    "132": "keys",
    "133": "keys",
    "134": "keys",
    "135": "keys",
    "136": "keys",
    "137": "keys",
    "138": "keys",
    "139": "keys",
    "140": "keys",
    "141": "keys",
    "142": "keys",
    "143": "keys",
    "144": "keys",
    "145": "keys",
    "146": "keys",
    "147": "keys",
    "148": "keys",
    "149": "keys",
    "150": "keys",
    "151": "keys",
    "152": "keys",
    "153": "keys",
    "154": "keys",
    "155": "keys",
    "156": "keys",
    "157": "keys",
    "158": "keys",
    "159": "keys",
    "176": "dial",
    "177": "dial",
    "178": "dial",
    "179": "dial",
    "180": "dial",
    "181": "dial",
    "182": "dial",
    "183": "dial",
    "184": "dial",
    "185": "dial",
    "186": "dial",
    "187": "dial",
    "188": "dial",
    "189": "dial",
    "190": "dial",
    "191": "dial",
    "224": "pitch bend",
    "225": "pitch bend",
    "226": "pitch bend",
    "227": "pitch bend",
    "228": "pitch bend",
    "229": "pitch bend",
    "230": "pitch bend",
    "231": "pitch bend",
    "232": "pitch bend",
    "233": "pitch bend",
    "234": "pitch bend",
    "235": "pitch bend",
    "236": "pitch bend",
    "237": "pitch bend",
    "238": "pitch bend",
    "239": "pitch bend"
  },
  "track": {
    "128": "kick",
    "129": "snare",
    "130": "perc",
    "131": "sample",
    "132": "bass",
    "133": "lead",
    "134": "arp",
    "135": "chord",
    "136": "fx1",
    "137": "fx2",
    "138": "tape",
    "139": "master",
    "140": "perform",
    "141": "module",
    "142": "lights",
    "143": "motion",
    "144": "kick",
    "145": "snare",
    "146": "perc",
    "147": "sample",
    "148": "bass",
    "149": "lead",
    "150": "arp",
    "151": "chord",
    "152": "fx1",
    "153": "fx2",
    "154": "tape",
    "155": "master",
    "156": "perform",
    "157": "module",
    "158": "lights",
    "159": "motion",
    "176": "kick",
    "177": "snare",
    "178": "perc",
    "179": "sample",
    "180": "bass",
    "181": "lead",
    "182": "arp",
    "183": "chord",
    "184": "fx1",
    "185": "fx2",
    "186": "tape",
    "187": "master",
    "188": "perform",
    "189": "lights",
    "190": "lights",
    "191": "motion",
    "224": "kick",
    "225": "snare",
    "226": "perc",
    "227": "sample",
    "228": "bass",
    "229": "lead",
    "230": "arp",
    "231": "chord",
    "232": "fx1",
    "233": "fx2",
    "234": "tape",
    "235": "master",
    "236": "perform",
    "237": "module",
    "238": "lights",
    "239": "motion"
  },
  "notes": {
    "0": "C",
    "1": "C#",
    "2": "D",
    "3": "D#",
    "4": "E",
    "5": "F",
    "6": "F#",
    "7": "G",
    "8": "G#",
    "9": "A",
    "10": "A#",
    "11": "B"
  },
  "dial": {
    "color": {
      "1": "green",
      "2": "blue",
      "3": "yellow",
      "4": "red",
      "5": "green",
      "6": "blue",
      "7": "yellow",
      "8": "red",
      "9": "green",
      "10": "blue",
      "11": "yellow",
      "12": "red",
      "13": "green",
      "14": "blue",
      "15": "yellow",
      "16": "red",
      "23": "kill"
    },
    "page": {
      "kick": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "snare": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "perc": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "sample": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "bass": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "lead": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "arp": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "blue",
        "10": "blue",
        "11": "blue",
        "12": "blue",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "chord": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "fx1": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "fx2": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "tape": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "master": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "perform": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "module": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "lights": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      },
      "motion": {
        "1": "white",
        "2": "white",
        "3": "white",
        "4": "white",
        "5": "green",
        "6": "green",
        "7": "green",
        "8": "green",
        "9": "purple",
        "10": "purple",
        "11": "purple",
        "12": "purple",
        "13": "yellow",
        "14": "yellow",
        "15": "yellow",
        "16": "yellow",
        "23": "kill"
      }
    }
  }
}

},{}]},{},[2]);
