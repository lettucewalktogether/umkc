/**
 * Statistics for the assessment dashboard.
 *
 * Everything here is implemented in the browser so that student responses are
 * never sent to a server. The procedures are the conventional ones for a
 * single-group pre/post design with ordinal (Likert-type) items, so that a
 * write-up can name the test, the effect size, and the correction it used.
 *
 * References for the reported procedures:
 *  - Student's paired t test and Cohen's d_z: Cohen, J. (1988), Statistical
 *    Power Analysis for the Behavioral Sciences, 2nd ed.
 *  - Wilcoxon signed-rank test: Wilcoxon, F. (1945), Biometrics Bulletin 1(6).
 *  - Matched-pairs rank-biserial correlation: Kerby, D. S. (2014),
 *    Comprehensive Psychology 3(1).
 *  - Cronbach's alpha: Cronbach, L. J. (1951), Psychometrika 16(3).
 *  - Holm step-down correction: Holm, S. (1979), Scandinavian Journal of
 *    Statistics 6(2).
 *  - Benjamini-Hochberg FDR: Benjamini & Hochberg (1995), JRSS-B 57(1).
 *  - Cohen's kappa: Cohen, J. (1960), Educational and Psychological
 *    Measurement 20(1).
 *  - McNemar's test: McNemar, Q. (1947), Psychometrika 12(2).
 */

export function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

export function mean(xs: number[]): number {
  return xs.length === 0 ? NaN : sum(xs) / xs.length;
}

/** Sample variance, denominator n - 1. */
export function variance(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1);
}

export function sd(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Distribution functions
// ---------------------------------------------------------------------------

/** Complementary error function; Numerical Recipes erfcc, |error| < 1.2e-7. */
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 2 / (2 + z);
  const ty = 4 * t - 2;

  const cof = [
    -1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
    -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
    4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
    1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8, 6.529054439e-9,
    5.059343495e-9, -9.91364156e-10, -2.27365122e-10, 9.6467911e-11,
    2.394038e-12, -6.886027e-12, 8.94487e-13, 3.13092e-13, -1.12708e-13,
    3.81e-16, 7.106e-15,
  ];

  let d = 0;
  let dd = 0;
  for (let j = cof.length - 1; j > 0; j--) {
    const tmp = d;
    d = ty * d - dd + cof[j];
    dd = tmp;
  }
  const ans = t * Math.exp(-z * z + 0.5 * (cof[0] + ty * d) - dd);
  return x >= 0 ? ans : 2 - ans;
}

/** Standard normal cumulative distribution function. */
export function normalCdf(z: number): number {
  return 0.5 * erfc(-z / Math.SQRT2);
}

function lnGamma(x: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/** Continued fraction for the incomplete beta function (Lentz's method). */
function betacf(a: number, b: number, x: number): number {
  const FPMIN = 1e-300;
  const EPS = 3e-16;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta function I_x(a, b). */
export function incompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    lnGamma(a + b) -
      lnGamma(a) -
      lnGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  );
  return x < (a + 1) / (a + b + 2)
    ? (bt * betacf(a, b, x)) / a
    : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Two-tailed p-value for Student's t with df degrees of freedom. */
export function tTestPValue(t: number, df: number): number {
  if (!isFinite(t) || df <= 0) return NaN;
  return incompleteBeta(df / 2, 0.5, df / (df + t * t));
}

/** Critical two-tailed t value for the given df and alpha, by bisection. */
export function tCritical(df: number, alpha = 0.05): number {
  if (df <= 0) return NaN;
  let lo = 0;
  let hi = 1000;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (tTestPValue(mid, df) > alpha) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// Paired tests
// ---------------------------------------------------------------------------

export type PairedT = {
  n: number;
  meanPre: number;
  meanPost: number;
  sdPre: number;
  sdPost: number;
  meanDiff: number;
  sdDiff: number;
  se: number;
  t: number;
  df: number;
  p: number;
  ciLow: number;
  ciHigh: number;
  /** Cohen's d_z: mean difference divided by the SD of the differences. */
  dz: number;
};

/** Paired-samples t test on post - pre. Arrays must be equal length. */
export function pairedT(pre: number[], post: number[]): PairedT | null {
  const n = Math.min(pre.length, post.length);
  if (n < 2) return null;

  const diffs = Array.from({ length: n }, (_, i) => post[i] - pre[i]);
  const meanDiff = mean(diffs);
  const sdDiff = sd(diffs);
  const se = sdDiff / Math.sqrt(n);
  const df = n - 1;
  // A zero-variance difference (every student moved by the same amount) has no
  // standard error, so t is undefined rather than infinite.
  const t = se === 0 ? NaN : meanDiff / se;
  const p = se === 0 ? NaN : tTestPValue(t, df);
  const crit = tCritical(df);

  return {
    n,
    meanPre: mean(pre.slice(0, n)),
    meanPost: mean(post.slice(0, n)),
    sdPre: sd(pre.slice(0, n)),
    sdPost: sd(post.slice(0, n)),
    meanDiff,
    sdDiff,
    se,
    t,
    df,
    p,
    ciLow: meanDiff - crit * se,
    ciHigh: meanDiff + crit * se,
    dz: sdDiff === 0 ? NaN : meanDiff / sdDiff,
  };
}

/** Average ranks, with ties receiving the mean of the ranks they span. */
function averageRanks(xs: number[]): { ranks: number[]; tieGroups: number[] } {
  const idx = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
  const ranks = new Array<number>(xs.length);
  const tieGroups: number[] = [];

  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1].x === idx[i].x) j++;
    const avg = (i + j + 2) / 2; // ranks are 1-based
    for (let k = i; k <= j; k++) ranks[idx[k].i] = avg;
    if (j > i) tieGroups.push(j - i + 1);
    i = j + 1;
  }
  return { ranks, tieGroups };
}

/**
 * Counts of subsets of {1..n} whose ranks sum to each value, used for the
 * exact null distribution of W+.
 */
function signedRankCounts(n: number): Float64Array {
  const maxW = (n * (n + 1)) / 2;
  const counts = new Float64Array(maxW + 1);
  counts[0] = 1;
  for (let r = 1; r <= n; r++) {
    for (let w = maxW; w >= r; w--) counts[w] += counts[w - r];
  }
  return counts;
}

export type Wilcoxon = {
  /** Pairs remaining after dropping zero differences. */
  n: number;
  nZeros: number;
  wPlus: number;
  wMinus: number;
  /** The smaller of the two rank sums, the conventional reported W. */
  W: number;
  z: number;
  p: number;
  /** Matched-pairs rank-biserial correlation (Kerby, 2014). */
  rankBiserial: number;
  method: "exact" | "normal approximation (continuity-corrected)";
};

/**
 * Wilcoxon signed-rank test on post - pre. Zero differences are dropped
 * (Wilcoxon's original handling). The exact distribution is used for small
 * samples without ties; otherwise a normal approximation with a continuity
 * correction and a tie correction to the variance.
 */
export function wilcoxonSignedRank(
  pre: number[],
  post: number[],
): Wilcoxon | null {
  const len = Math.min(pre.length, post.length);
  const allDiffs = Array.from({ length: len }, (_, i) => post[i] - pre[i]);
  const diffs = allDiffs.filter((d) => d !== 0);
  const nZeros = allDiffs.length - diffs.length;
  const n = diffs.length;
  if (n < 1) return null;

  const { ranks, tieGroups } = averageRanks(diffs.map(Math.abs));
  let wPlus = 0;
  let wMinus = 0;
  diffs.forEach((d, i) => {
    if (d > 0) wPlus += ranks[i];
    else wMinus += ranks[i];
  });

  const total = (n * (n + 1)) / 2;
  const W = Math.min(wPlus, wMinus);
  const meanW = total / 2;
  const tieAdjust = sum(tieGroups.map((t) => t ** 3 - t)) / 48;
  const varW = (n * (n + 1) * (2 * n + 1)) / 24 - tieAdjust;

  // Continuity-corrected z, reported for both methods.
  const z =
    varW <= 0
      ? NaN
      : (wPlus - meanW - Math.sign(wPlus - meanW) * 0.5) / Math.sqrt(varW);

  let p: number;
  let method: Wilcoxon["method"];
  if (n <= 25 && tieGroups.length === 0) {
    const counts = signedRankCounts(n);
    const totalWays = 2 ** n;
    let tail = 0;
    for (let w = 0; w <= W; w++) tail += counts[w];
    p = Math.min(1, (2 * tail) / totalWays);
    method = "exact";
  } else {
    p = isNaN(z) ? NaN : 2 * (1 - normalCdf(Math.abs(z)));
    method = "normal approximation (continuity-corrected)";
  }

  return {
    n,
    nZeros,
    wPlus,
    wMinus,
    W,
    z,
    p,
    rankBiserial: (wPlus - wMinus) / total,
    method,
  };
}

// ---------------------------------------------------------------------------
// Reliability
// ---------------------------------------------------------------------------

/**
 * Cronbach's alpha for a set of items. `itemScores[i]` holds every
 * respondent's score on item i; all items must have the same respondents in
 * the same order.
 */
export function cronbachAlpha(itemScores: number[][]): number {
  const k = itemScores.length;
  if (k < 2) return NaN;
  const n = itemScores[0].length;
  if (n < 2 || itemScores.some((it) => it.length !== n)) return NaN;

  const totals = Array.from({ length: n }, (_, r) =>
    sum(itemScores.map((it) => it[r])),
  );
  const totalVar = variance(totals);
  if (totalVar === 0) return NaN;
  const itemVarSum = sum(itemScores.map(variance));
  return (k / (k - 1)) * (1 - itemVarSum / totalVar);
}

// ---------------------------------------------------------------------------
// Multiple-comparison corrections
// ---------------------------------------------------------------------------

/** Holm step-down adjusted p-values, returned in the input order. */
export function holmAdjust(ps: number[]): number[] {
  const order = ps
    .map((p, i) => ({ p, i }))
    .filter((e) => !isNaN(e.p))
    .sort((a, b) => a.p - b.p);
  const m = order.length;
  const out = new Array<number>(ps.length).fill(NaN);

  let running = 0;
  order.forEach((entry, rank) => {
    const adjusted = Math.min(1, (m - rank) * entry.p);
    running = Math.max(running, adjusted);
    out[entry.i] = running;
  });
  return out;
}

/** Benjamini-Hochberg FDR adjusted p-values, in the input order. */
export function benjaminiHochberg(ps: number[]): number[] {
  const order = ps
    .map((p, i) => ({ p, i }))
    .filter((e) => !isNaN(e.p))
    .sort((a, b) => b.p - a.p);
  const m = order.length;
  const out = new Array<number>(ps.length).fill(NaN);

  let running = 1;
  order.forEach((entry, idxFromTop) => {
    const rank = m - idxFromTop;
    running = Math.min(running, (m / rank) * entry.p, 1);
    out[entry.i] = running;
  });
  return out;
}

// ---------------------------------------------------------------------------
// Agreement and paired categorical change
// ---------------------------------------------------------------------------

export type Kappa = {
  n: number;
  observedAgreement: number;
  expectedAgreement: number;
  kappa: number;
  /** Landis & Koch (1977) descriptive band. */
  interpretation: string;
};

/** Cohen's kappa for two coders assigning nominal codes to the same units. */
export function cohensKappa(a: string[], b: string[]): Kappa | null {
  const n = Math.min(a.length, b.length);
  if (n === 0) return null;

  let agree = 0;
  const countA = new Map<string, number>();
  const countB = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) agree++;
    countA.set(a[i], (countA.get(a[i]) ?? 0) + 1);
    countB.set(b[i], (countB.get(b[i]) ?? 0) + 1);
  }

  const po = agree / n;
  let pe = 0;
  for (const [code, ca] of countA) {
    pe += (ca / n) * ((countB.get(code) ?? 0) / n);
  }
  const kappa = pe === 1 ? NaN : (po - pe) / (1 - pe);

  return {
    n,
    observedAgreement: po,
    expectedAgreement: pe,
    kappa,
    interpretation: interpretKappa(kappa),
  };
}

function interpretKappa(k: number): string {
  if (isNaN(k)) return "not estimable";
  if (k < 0) return "poor (worse than chance)";
  if (k <= 0.2) return "slight";
  if (k <= 0.4) return "fair";
  if (k <= 0.6) return "moderate";
  if (k <= 0.8) return "substantial";
  return "almost perfect";
}

export type McNemar = {
  /** Present at pre, absent at post. */
  b: number;
  /** Absent at pre, present at post. */
  c: number;
  n: number;
  /** Two-tailed exact binomial p-value. */
  p: number;
};

/** Exact (binomial) McNemar test on paired presence/absence of a code. */
export function mcNemarExact(pre: boolean[], post: boolean[]): McNemar | null {
  const n = Math.min(pre.length, post.length);
  if (n === 0) return null;

  let b = 0;
  let c = 0;
  for (let i = 0; i < n; i++) {
    if (pre[i] && !post[i]) b++;
    if (!pre[i] && post[i]) c++;
  }

  const total = b + c;
  if (total === 0) return { b, c, n, p: 1 };

  // Two-tailed exact test against Binomial(b + c, 0.5).
  const k = Math.min(b, c);
  let tail = 0;
  for (let i = 0; i <= k; i++) tail += binomialPmf(i, total, 0.5);
  return { b, c, n, p: Math.min(1, 2 * tail) };
}

function binomialPmf(k: number, n: number, p: number): number {
  const lnChoose = lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);
  return Math.exp(lnChoose + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** APA-style p-value: "< .001" below the threshold, otherwise 3 decimals. */
export function formatP(p: number): string {
  if (isNaN(p)) return "—";
  if (p < 0.001) return "< .001";
  return p.toFixed(3).replace(/^0\./, ".");
}

export function fmt(x: number, digits = 2): string {
  return isNaN(x) || !isFinite(x) ? "—" : x.toFixed(digits);
}

/** Cohen's (1988) descriptive bands for d. */
export function interpretD(d: number): string {
  const a = Math.abs(d);
  if (isNaN(a)) return "—";
  if (a < 0.2) return "negligible";
  if (a < 0.5) return "small";
  if (a < 0.8) return "medium";
  return "large";
}
