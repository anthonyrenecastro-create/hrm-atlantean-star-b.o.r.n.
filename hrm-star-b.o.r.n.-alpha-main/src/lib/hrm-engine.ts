// src/lib/hrm-engine.ts

export type GunaTriple = {
  s: number; // sattva / coherence
  r: number; // rajas / activity
  t: number; // tamas / inertia
};

export interface HRMFieldSnapshot {
  matter: number[][];
  gauge: number[][];
  ameterasu: number[][];
}

export interface HRMState {
  theta: number;              // 0..1 macro-cycle
  channel: number;            // 1..12
  domain: number;             // 1..22
  layer: number;              // 1..14

  coherence: number;          // 0..1
  stability: number;          // 0..1
  optimization: number;       // 0..1
  fractalDepth: number;       // 0..1
  precision: number;          // 0..1

  stateVector: number[];      // 24-component HRM internal state
  traits: Record<string, number>; // 12 STAR-facing traits
  guna: GunaTriple;

  metrics: {
    energyDensity: number;
    chaosMetric: number;
    meanMatter: number;
    meanGauge: number;
    meanAmeterasu: number;
    routeEntropy: number;
    operatorDrift: number;
    objective: number;
  };

  fields: HRMFieldSnapshot;
}

export interface HRMConfig {
  width: number;
  height: number;
  dt: number;
  dx: number;
  syntropyTarget: number;
  initialMass: number;
  initialCoupling: number;
  cycleRate: number;
}

type ObjectiveTerms = {
  F_fractal: number;
  F_precision: number;
  F_stability: number;
  F_coherence: number;
  R: number;
  J: number;
};

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const clampSigned = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr: number[]): number {
  if (!arr.length) return 0;
  const m = mean(arr);
  return arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length;
}

function l2(arr: number[]): number {
  return Math.sqrt(arr.reduce((s, x) => s + x * x, 0));
}

function matrixMean(grid: number[][]): number {
  const flat = grid.flat();
  return mean(flat);
}

function matrixVariance(grid: number[][]): number {
  const flat = grid.flat();
  return variance(flat);
}

function deepCopy2D(a: number[][]): number[][] {
  return a.map(r => [...r]);
}

class ModularIntelligence {
  weights1: number[][];
  weights2: number[][];
  learningRate: number;

  constructor(inputSize = 8, hiddenSize = 12, outputSize = 4) {
    this.weights1 = Array.from({ length: inputSize }, () =>
      Array.from({ length: hiddenSize }, () => Math.random() * 0.2 - 0.1)
    );
    this.weights2 = Array.from({ length: hiddenSize }, () =>
      Array.from({ length: outputSize }, () => Math.random() * 0.2 - 0.1)
    );
    this.learningRate = 0.01;
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  forward(inputs: number[]): number[] {
    const hidden = new Array(this.weights1[0].length).fill(0);
    for (let j = 0; j < hidden.length; j++) {
      for (let i = 0; i < inputs.length; i++) hidden[j] += inputs[i] * this.weights1[i][j];
      hidden[j] = this.relu(hidden[j]);
    }

    const outputs = new Array(this.weights2[0].length).fill(0);
    for (let k = 0; k < outputs.length; k++) {
      for (let j = 0; j < hidden.length; j++) outputs[k] += hidden[j] * this.weights2[j][k];
    }
    return outputs;
  }

  train(inputs: number[], targets: number[]): number {
    const hidden = new Array(this.weights1[0].length).fill(0);
    for (let j = 0; j < hidden.length; j++) {
      for (let i = 0; i < inputs.length; i++) hidden[j] += inputs[i] * this.weights1[i][j];
      hidden[j] = this.relu(hidden[j]);
    }

    const outputs = new Array(this.weights2[0].length).fill(0);
    for (let k = 0; k < outputs.length; k++) {
      for (let j = 0; j < hidden.length; j++) outputs[k] += hidden[j] * this.weights2[j][k];
    }

    const outErr = outputs.map((o, i) => targets[i] - o);
    const hidErr = new Array(hidden.length).fill(0);
    for (let j = 0; j < hidden.length; j++) {
      for (let k = 0; k < outErr.length; k++) hidErr[j] += outErr[k] * this.weights2[j][k];
    }

    for (let j = 0; j < hidden.length; j++) {
      for (let k = 0; k < outErr.length; k++) {
        this.weights2[j][k] += this.learningRate * outErr[k] * hidden[j];
      }
    }

    for (let i = 0; i < inputs.length; i++) {
      for (let j = 0; j < hidden.length; j++) {
        if (hidden[j] > 0) this.weights1[i][j] += this.learningRate * hidErr[j] * inputs[i];
      }
    }

    return mean(outErr.map(e => e * e));
  }
}

class FieldEngine {
  width: number;
  height: number;
  dt: number;
  dx: number;

  mass: number;
  coupling: number;
  syntropyTarget: number;

  gamma = 0.5;
  alpha = 0.1;
  beta = 0.1;
  c = 1.0;
  g = 0.1;

  matter: number[][];
  gauge: number[][];
  ameterasu: number[][];

  constructor(config: HRMConfig) {
    this.width = config.width;
    this.height = config.height;
    this.dt = config.dt;
    this.dx = config.dx;
    this.mass = config.initialMass;
    this.coupling = config.initialCoupling;
    this.syntropyTarget = config.syntropyTarget;

    this.matter = [];
    this.gauge = [];
    this.ameterasu = [];
    this.reset();
  }

  reset() {
    this.matter = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => Math.random() * 0.2 - 0.1)
    );
    this.gauge = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => Math.random() * 0.02 - 0.01)
    );
    this.ameterasu = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => Math.random() * 0.2 - 0.1)
    );
  }

  private idx(i: number, max: number): number {
    return (i + max) % max;
  }

  private laplacian(grid: number[][], x: number, y: number): number {
    const up = grid[this.idx(y - 1, this.height)][x];
    const down = grid[this.idx(y + 1, this.height)][x];
    const left = grid[y][this.idx(x - 1, this.width)];
    const right = grid[y][this.idx(x + 1, this.width)];
    const c = grid[y][x];
    return (up + down + left + right - 4 * c) / (this.dx ** 2);
  }

  stepMatter() {
    const next = deepCopy2D(this.matter);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const psi = this.matter[y][x];
        const lap = this.laplacian(this.matter, x, y);
        const dpsi = this.gamma * lap + this.alpha * psi - this.beta * psi ** 3;
        next[y][x] = psi + this.dt * dpsi;
      }
    }
    this.matter = next;
  }

  stepGauge() {
    const next = deepCopy2D(this.gauge);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const A = this.gauge[y][x];
        const lap = this.laplacian(this.gauge, x, y);
        const current = this.coupling * this.ameterasu[y][x];
        next[y][x] = A + this.dt * (this.c ** 2 * lap - current);
      }
    }
    this.gauge = next;
  }

  stepAmeterasu(inputVector: number[], theta: number) {
    const next = deepCopy2D(this.ameterasu);
    const source = inputVector.length ? mean(inputVector) : 0;
    const phaseDrive = Math.sin(theta * Math.PI * 2) * 0.05;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const phi = this.ameterasu[y][x];
        const lap = this.laplacian(this.ameterasu, x, y);
        const dV = this.mass ** 2 * phi;
        const dI = this.g * (this.gauge[y][x] ** 2);
        const dphi = this.c ** 2 * lap - dV + this.coupling * dI + source + phaseDrive;
        const syntropy = (this.syntropyTarget - phi) * 0.01;
        next[y][x] = phi + this.dt * dphi + syntropy;
      }
    }
    this.ameterasu = next;
  }

  snapshot(): HRMFieldSnapshot {
    return {
      matter: deepCopy2D(this.matter),
      gauge: deepCopy2D(this.gauge),
      ameterasu: deepCopy2D(this.ameterasu),
    };
  }
}

class CycleEngine {
  private t = 0;
  constructor(private cycleRate: number) {}

  step(dt: number): number {
    this.t += dt * this.cycleRate;
    const twoPi = Math.PI * 2;
    return ((this.t % twoPi) + twoPi) % twoPi / twoPi;
  }
}

class StateEngine {
  private W: number[][];

  constructor() {
    this.W = Array.from({ length: 24 }, (_, i) =>
      Array.from({ length: 24 }, (_, j) => {
        if (i === j) return 0;
        const ring = (Math.abs(i - j) === 1 || Math.abs(i - j) === 23) ? 0.12 : 0.02;
        const band = Math.floor(i / 6) === Math.floor(j / 6) ? 0.08 : 0;
        return ring + band;
      })
    );
  }

  update(
    prev: number[],
    field: FieldEngine,
    theta: number,
    traits: Record<string, number>
  ): number[] {
    const next = [...prev];

    const matterMean = matrixMean(field.matter);
    const gaugeMean = matrixMean(field.gauge);
    const ameMean = matrixMean(field.ameterasu);
    const fieldDrive = [matterMean, gaugeMean, ameMean];

    const C = clamp(1 / (1 + variance(prev)));
    const focus = traits.focus ?? 0.5;
    const creativity = traits.creativity ?? 0.5;
    const logic = traits.logic ?? 0.5;
    const stability = traits.stability ?? 0.5;
    const intuition = traits.intuition ?? 0.5;

    for (let i = 0; i < 24; i++) {
      const lapG = this.graphLaplacian(prev, i);
      let coupling = 0;
      for (let j = 0; j < 24; j++) coupling += this.W[i][j] * (prev[j] - prev[i]);

      const fieldTerm = fieldDrive[i % 3] * (0.25 + 0.25 * focus);
      const phaseTerm = Math.sin(theta * Math.PI * 2 + i * 0.17) * 0.04 * intuition;
      const nonlinear = prev[i] * (1 - (prev[i] * prev[i])) * (0.08 + 0.1 * creativity);
      const consensus = (mean(prev) - prev[i]) * 0.06 * logic;
      const coherenceGrad = (C - Math.abs(prev[i])) * 0.04;

      const dS =
        0.15 * lapG +
        nonlinear +
        0.12 * coupling +
        consensus +
        coherenceGrad +
        fieldTerm +
        phaseTerm -
        0.08 * stability * prev[i];

      next[i] = clampSigned(prev[i] + dS);
    }

    return next;
  }

  private graphLaplacian(vec: number[], i: number): number {
    const left = vec[(i + 23) % 24];
    const right = vec[(i + 1) % 24];
    return left + right - 2 * vec[i];
  }
}

class TopologyEngine {
  route(state: HRMState): Pick<HRMState, "channel" | "domain" | "layer"> {
    const channel = clamp(Math.floor(state.coherence * 12) + 1, 1, 12);
    const domain = clamp(Math.floor((state.optimization * 0.6 + state.fractalDepth * 0.4) * 22) + 1, 1, 22);
    const layer = clamp(Math.floor((state.stability * 0.7 + state.precision * 0.3) * 14) + 1, 1, 14);

    return {
      channel,
      domain,
      layer,
    };
  }

  routeEntropy(state: HRMState): number {
    const components = [
      state.coherence,
      state.stability,
      state.optimization,
      state.fractalDepth,
      state.precision,
    ].map(x => clamp(x, 1e-6, 1));
    const total = components.reduce((a, b) => a + b, 0);
    const probs = components.map(x => x / total);
    return clamp(-probs.reduce((s, p) => s + p * Math.log(p), 0) / Math.log(probs.length));
  }
}

class OperatorEngine {
  apply(
    vec: number[],
    theta: number,
    state: HRMState
  ): { next: number[]; drift: number } {
    const next = [...vec];
    const phase = theta * Math.PI * 2;
    const driftScale = 0.025 + state.fractalDepth * 0.02;

    for (let i = 0; i < next.length; i++) {
      const harmonic = Math.sin(phase + i * 0.31) * driftScale;
      const coherenceBias = (state.coherence - 0.5) * 0.03;
      const stabilityDamp = (0.5 - state.stability) * 0.02;
      next[i] = clampSigned(next[i] + harmonic + coherenceBias - stabilityDamp);
    }

    const drift = mean(next.map((v, i) => Math.abs(v - vec[i])));
    return { next, drift };
  }
}

class OptimizationEngine {
  readonly weights = {
    w_f: 0.20,
    w_p: 0.20,
    w_s: 0.25,
    w_c: 0.25,
    w_r: 0.10,
  };

  evaluate(state: HRMState): ObjectiveTerms {
    const F_fractal = clamp(state.fractalDepth);
    const F_precision = clamp(state.precision);
    const F_stability = clamp(state.stability);
    const F_coherence = clamp(state.coherence);
    const R = clamp(state.metrics.chaosMetric * 0.7 + state.metrics.routeEntropy * 0.3);

    const J =
      this.weights.w_f * F_fractal +
      this.weights.w_p * F_precision +
      this.weights.w_s * F_stability +
      this.weights.w_c * F_coherence -
      this.weights.w_r * R;

    return { F_fractal, F_precision, F_stability, F_coherence, R, J };
  }

  step(field: FieldEngine, mi: ModularIntelligence, state: HRMState): number {
    const inputs = [
      state.coherence,
      state.stability,
      state.optimization,
      state.fractalDepth,
      state.precision,
      state.metrics.chaosMetric,
      state.metrics.energyDensity,
      state.theta,
    ];

    const targets = [
      0.82 - state.stability,
      0.80 - state.coherence,
      0.55 - state.metrics.chaosMetric,
      0.60 - Math.abs(state.metrics.meanAmeterasu - field.syntropyTarget),
    ];

    const deltas = mi.forward(inputs);
    const loss = mi.train(inputs, targets);

    field.mass = clamp(field.mass + deltas[0] * 0.002, 0.2, 3.0);
    field.coupling = clamp(field.coupling + deltas[1] * 0.002, 0.01, 1.5);
    field.syntropyTarget = clamp(field.syntropyTarget + deltas[2] * 0.001, -1, 1);

    return loss;
  }
}

export class HRMEngine {
  private config: HRMConfig;
  private field: FieldEngine;
  private cycle: CycleEngine;
  private stateEngine: StateEngine;
  private topology: TopologyEngine;
  private operators: OperatorEngine;
  private optimizationEngine: OptimizationEngine;
  private mi: ModularIntelligence;

  private state: HRMState;

  constructor(config?: Partial<HRMConfig>) {
    this.config = {
      width: 50,
      height: 50,
      dt: 0.01,
      dx: 0.5,
      syntropyTarget: 0.5,
      initialMass: 1.0,
      initialCoupling: 0.1,
      cycleRate: 1.0,
      ...config,
    };

    this.field = new FieldEngine(this.config);
    this.cycle = new CycleEngine(this.config.cycleRate);
    this.stateEngine = new StateEngine();
    this.topology = new TopologyEngine();
    this.operators = new OperatorEngine();
    this.optimizationEngine = new OptimizationEngine();
    this.mi = new ModularIntelligence();

    this.state = this.initializeState();
  }

  private initializeState(): HRMState {
    const traits: Record<string, number> = {
      clarity: 0.55,
      focus: 0.55,
      creativity: 0.55,
      stability: 0.55,
      empathy: 0.55,
      logic: 0.55,
      intuition: 0.55,
      resilience: 0.55,
      adaptability: 0.55,
      depth: 0.55,
      flow: 0.55,
      harmony: 0.55,
    };

    const stateVector = Array.from({ length: 24 }, () => Math.random() * 0.2 - 0.1);

    const base: HRMState = {
      theta: 0,
      channel: 1,
      domain: 1,
      layer: 1,

      coherence: 0.5,
      stability: 0.5,
      optimization: 0.5,
      fractalDepth: 0.5,
      precision: 0.5,

      stateVector,
      traits,
      guna: { s: 0.5, r: 0.3, t: 0.2 },

      metrics: {
        energyDensity: 0,
        chaosMetric: 0,
        meanMatter: 0,
        meanGauge: 0,
        meanAmeterasu: 0,
        routeEntropy: 0,
        operatorDrift: 0,
        objective: 0,
      },

      fields: this.field.snapshot(),
    };

    const routed = this.topology.route(base);
    return { ...base, ...routed };
  }

  public updateTraits(newTraits: Partial<Record<string, number>>) {
    this.state.traits = { ...this.state.traits, ...newTraits };
  }

  public reset() {
    this.field.reset();
    this.state = this.initializeState();
  }

  public evolve(inputPerturbation: number[] = []): HRMState {
    const theta = this.cycle.step(this.config.dt);

    this.field.stepMatter();
    this.field.stepGauge();
    this.field.stepAmeterasu(inputPerturbation, theta);

    const stateVector = this.stateEngine.update(
      this.state.stateVector,
      this.field,
      theta,
      this.state.traits
    );

    const operated = this.operators.apply(
      stateVector,
      theta,
      { ...this.state, stateVector, theta, fields: this.field.snapshot() }
    );

    const nextVector = operated.next;

    const coherence = clamp(1 / (1 + variance(nextVector) * 1.5));
    const norm = l2(nextVector);
    const stability = clamp(Math.exp(-Math.abs(norm - 1.25)));
    const matterVar = matrixVariance(this.field.matter);
    const gaugeVar = matrixVariance(this.field.gauge);
    const ameVar = matrixVariance(this.field.ameterasu);

    const fractalDepth = clamp(
      (this.state.traits.creativity * 0.4) +
      (this.state.traits.depth * 0.3) +
      (1 / (1 + matterVar * 8)) * 0.3
    );

    const precision = clamp(
      (this.state.traits.clarity * 0.4) +
      (this.state.traits.logic * 0.3) +
      coherence * 0.3
    );

    const meanMatter = matrixMean(this.field.matter);
    const meanGauge = matrixMean(this.field.gauge);
    const meanAmeterasu = matrixMean(this.field.ameterasu);

    const energyDensity = clamp(
      Math.abs(meanMatter) * 0.3 +
      Math.abs(meanGauge) * 0.2 +
      Math.abs(meanAmeterasu) * 0.5
    );

    const chaosMetric = clamp((matterVar + gaugeVar + ameVar) * 3.0);
    const optimization = clamp(
      0.35 * coherence +
      0.35 * stability +
      0.15 * precision +
      0.15 * (1 - chaosMetric)
    );

    const guna: GunaTriple = {
      s: clamp((coherence + precision) / 2),
      r: clamp((energyDensity + fractalDepth) / 2),
      t: clamp(1 - ((coherence + stability) / 2)),
    };

    let nextState: HRMState = {
      ...this.state,
      theta,
      coherence,
      stability,
      optimization,
      fractalDepth,
      precision,
      stateVector: nextVector,
      guna,
      metrics: {
        energyDensity,
        chaosMetric,
        meanMatter,
        meanGauge,
        meanAmeterasu,
        routeEntropy: 0,
        operatorDrift: operated.drift,
        objective: 0,
      },
      fields: this.field.snapshot(),
    };

    nextState = {
      ...nextState,
      ...this.topology.route(nextState),
    };

    nextState.metrics.routeEntropy = this.topology.routeEntropy(nextState);

    const objective = this.optimizationEngine.evaluate(nextState);
    nextState.metrics.objective = objective.J;
    nextState.optimization = clamp(lerp(nextState.optimization, objective.J, 0.35));

    const miLoss = this.optimizationEngine.step(this.field, this.mi, nextState);

    // Feed MI loss back into STAR-facing traits
    nextState.traits = {
      ...nextState.traits,
      stability: clamp(nextState.traits.stability + (0.8 - miLoss) * 0.01),
      focus: clamp(nextState.traits.focus + (nextState.coherence - 0.5) * 0.01),
      clarity: clamp(nextState.traits.clarity + (nextState.precision - 0.5) * 0.01),
      adaptability: clamp(nextState.traits.adaptability + (1 - nextState.metrics.chaosMetric) * 0.005),
      flow: clamp(nextState.traits.flow + (nextState.theta > 0.45 && nextState.theta < 0.65 ? 0.01 : -0.002)),
    };

    this.state = nextState;
    return this.state;
  }

  public getState(): HRMState {
    return this.state;
  }

  /**
   * Apply Atlantean field influence to HRM evolution.
   * 
   * Called to blend Atlantean's field state into HRM state vector.
   * Creates the bidirectional feedback loop.
   */
  public applyAtlanteanInfluence(perturbation: number[]): void {
    if (!perturbation || perturbation.length !== 24) return;
    
    // Blend Atlantean perturbation with current state
    const blendAmount = 0.15; // 15% influence from Atlantean
    
    for (let i = 0; i < 24; i++) {
      this.state.stateVector[i] = clamp(
        this.state.stateVector[i] + perturbation[i] * blendAmount,
        -1,
        1
      );
    }
    
    // Recompute metrics after applying field influence
    this.recomputeMetrics();
  }

  /**
   * Recompute HRM metrics after state changes.
   * Called when external systems (like Atlantean) modify state.
   */
  private recomputeMetrics(): void {
    const coherence = clamp(1 / (1 + variance(this.state.stateVector) * 1.5));
    const precision = clamp(
      (this.state.traits.clarity * 0.4) +
      (this.state.traits.logic * 0.3) +
      coherence * 0.3
    );
    const stability = clamp(Math.exp(-Math.abs(l2(this.state.stateVector) - 1.25)));
    
    this.state.coherence = coherence;
    this.state.precision = precision;
    this.state.stability = stability;
  }

  /**
   * Store important simulation snapshot.
   * Called to auto-persist significant HRM states to Atlantean cold memory.
   */
  public captureSimulation(): Record<string, any> {
    return {
      timestamp: Date.now(),
      theta: this.state.theta,
      coherence: this.state.coherence,
      stability: this.state.stability,
      optimization: this.state.optimization,
      fractalDepth: this.state.fractalDepth,
      precision: this.state.precision,
      stateVector: [...this.state.stateVector],
      traits: { ...this.state.traits },
      metrics: { ...this.state.metrics },
      topology: {
        channel: this.state.channel,
        domain: this.state.domain,
        layer: this.state.layer,
      },
    };
  }
}
