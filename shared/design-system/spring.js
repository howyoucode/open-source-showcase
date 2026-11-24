export function project(velocity, decelerationRate = 0.998) {
  if (!Number.isFinite(velocity)) return 0;
  const rate = Math.max(0.001, Math.min(0.999, decelerationRate));
  return (velocity / 1000) * rate / (1 - rate);
}

export function rubberband(overshoot, dimension, constant = 0.55) {
  if (!Number.isFinite(overshoot) || !Number.isFinite(dimension) || dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export const SPRING_PRESETS = {
  default: { damping: 1, response: 0.35 },
  momentum: { damping: 0.8, response: 0.35 },
  sheet: { damping: 0.8, response: 0.3 },
};

export class Spring {
  constructor(current, target = current, velocity = 0, preset = "default") {
    this.values = Array.isArray(current) ? current.slice() : [current];
    this.targets = Array.isArray(target) ? target.slice() : [target];
    this.velocities = (Array.isArray(velocity) ? velocity : [velocity]).slice();
    while (this.velocities.length < this.values.length) this.velocities.push(0);
    this.preset = typeof preset === "string" ? SPRING_PRESETS[preset] : preset;
  }

  setTarget(target, velocity) {
    this.targets = Array.isArray(target) ? target.slice() : [target];
    if (velocity !== undefined) {
      const velocities = Array.isArray(velocity) ? velocity : [velocity];
      for (let i = 0; i < this.values.length; i++) this.velocities[i] = velocities[i] ?? this.velocities[i];
    }
  }

  setVelocity(velocity) {
    this.velocities = (Array.isArray(velocity) ? velocity : [velocity]).slice();
  }

  step(dt) {
    const { damping, response } = this.preset;
    const omega = (2 * Math.PI) / Math.max(response, 0.001);
    const frame = Math.max(0, Math.min(dt, 1 / 30));
    for (let i = 0; i < this.values.length; i++) {
      const displacement = this.values[i] - this.targets[i];
      const acceleration = -omega * omega * displacement - 2 * damping * omega * this.velocities[i];
      this.velocities[i] += acceleration * frame;
      this.values[i] += this.velocities[i] * frame;
      if (Math.abs(this.values[i] - this.targets[i]) < 0.001 && Math.abs(this.velocities[i]) < 0.001) {
        this.values[i] = this.targets[i];
        this.velocities[i] = 0;
      }
    }
  }

  get values() { return this._values; }
  set values(value) { this._values = value; }

  get x() { return this._values[0]; }
  get y() { return this._values[1] ?? this._values[0]; }
  get vx() { return this.velocities[0] || 0; }
  get vy() { return this.velocities[1] || this.velocities[0] || 0; }
  get settled() {
    return this._values.every((value,i)=>value === this.targets[i] && this.velocities[i] === 0);
  }
}
