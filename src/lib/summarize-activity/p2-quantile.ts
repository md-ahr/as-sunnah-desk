type MarkerTuple = [number, number, number, number, number]
type MarkerIndex = 0 | 1 | 2 | 3 | 4

function readMarker(tuple: MarkerTuple, index: MarkerIndex): number {
  return tuple[index]
}

function writeMarker(tuple: MarkerTuple, index: MarkerIndex, value: number): void {
  tuple[index] = value
}

/**
 * Jain & Chlamtac (1985) P-square algorithm.
 * Estimates a quantile in O(1) memory and O(1) time per observation
 * by maintaining five markers and adjusting them with a parabolic fit.
 */
export class P2Quantile {
  private readonly p: number
  private count = 0
  private initial: number[] = []
  private q: MarkerTuple = [0, 0, 0, 0, 0]
  private n: MarkerTuple = [0, 0, 0, 0, 0]
  private np: MarkerTuple = [0, 0, 0, 0, 0]
  private dn: MarkerTuple = [0, 0, 0, 0, 0]
  private initialised = false

  constructor(quantile: number) {
    if (quantile <= 0 || quantile >= 1) {
      throw new RangeError('quantile must be between 0 and 1')
    }
    this.p = quantile
  }

  accept(value: number): void {
    if (!Number.isFinite(value)) {
      return
    }

    if (this.count < 5) {
      this.initial.push(value)
      this.count += 1
      if (this.count === 5) {
        this.initial.sort((a, b) => a - b)
        this.q = this.initial as MarkerTuple
        this.n = [1, 2, 3, 4, 5]
        this.np = [1, 1 + 2 * this.p, 1 + 4 * this.p, 3 + 2 * this.p, 5]
        this.dn = [0, this.p / 2, this.p, (1 + this.p) / 2, 1]
        this.initialised = true
      }
      return
    }

    this.count += 1

    let k: MarkerIndex = 0
    if (value < readMarker(this.q, 0)) {
      writeMarker(this.q, 0, value)
      k = 0
    } else if (value >= readMarker(this.q, 4)) {
      writeMarker(this.q, 4, value)
      k = 3
    } else {
      k = 0
      for (; k < 4; k += 1) {
        if (value < readMarker(this.q, (k + 1) as MarkerIndex)) {
          break
        }
      }
    }

    for (let i = k + 1; i < 5; i += 1) {
      writeMarker(this.n, i as MarkerIndex, readMarker(this.n, i as MarkerIndex) + 1)
    }

    for (let i = 1; i <= 3; i += 1) {
      const index = i as MarkerIndex
      writeMarker(this.np, index, readMarker(this.np, index) + readMarker(this.dn, index))
    }

    for (let i = 1; i <= 3; i += 1) {
      const index = i as MarkerIndex
      const previous = (i - 1) as MarkerIndex
      const next = (i + 1) as MarkerIndex
      const d = readMarker(this.np, index) - readMarker(this.n, index)
      const canIncrease =
        d >= 1 && readMarker(this.n, next) - readMarker(this.n, index) > 1
      const canDecrease =
        d <= -1 && readMarker(this.n, previous) - readMarker(this.n, index) < -1
      if (!canIncrease && !canDecrease) {
        continue
      }

      const di = d >= 1 ? 1 : -1
      const qp = this.parabolic(index, di)
      if (readMarker(this.q, previous) < qp && qp < readMarker(this.q, next)) {
        writeMarker(this.q, index, qp)
      } else {
        writeMarker(this.q, index, this.linear(index, di))
      }
      writeMarker(this.n, index, readMarker(this.n, index) + di)
    }
  }

  get estimate(): number | null {
    if (this.count === 0) {
      return null
    }

    if (!this.initialised) {
      const sorted = [...this.initial].sort((a, b) => a - b)
      const index = Math.floor(this.p * (sorted.length - 1))
      return sorted[index] ?? null
    }

    return readMarker(this.q, 2)
  }

  private parabolic(i: MarkerIndex, d: number): number {
    const previous = (i - 1) as MarkerIndex
    const next = (i + 1) as MarkerIndex
    const a = readMarker(this.q, previous)
    const b = readMarker(this.q, i)
    const c = readMarker(this.q, next)
    const ni = readMarker(this.n, i)
    const nip = readMarker(this.n, next)
    const nim = readMarker(this.n, previous)
    return (
      b +
      (d / (nip - nim)) *
        (((ni - nim + d) * (c - b)) / (nip - ni) + ((nip - ni - d) * (b - a)) / (ni - nim))
    )
  }

  private linear(i: MarkerIndex, d: number): number {
    const neighbour = (i + d) as MarkerIndex
    return (
      readMarker(this.q, i) +
      (d * (readMarker(this.q, neighbour) - readMarker(this.q, i))) /
        (readMarker(this.n, neighbour) - readMarker(this.n, i))
    )
  }
}
