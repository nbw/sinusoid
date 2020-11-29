class Circle {
  constructor(x,y, radius, phase, color, inv = false) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.phase = phase;
    this.inv = inv // invulnerability flag
  }

  incrementPhase(amount) {
    this.phase = (this.phase + amount) % Math.PI;
  }

  decreaseOpacity(amount) {
    this.opacity -= amount;
  }
}

export default Circle;
