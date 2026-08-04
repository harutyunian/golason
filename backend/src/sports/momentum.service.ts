import { Injectable } from '@nestjs/common';

export interface MomentumPoint {
  minute: number;
  value: number; // Value between -100 (Away dominant) and 100 (Home dominant)
}

@Injectable()
export class MomentumService {
  /**
   * Calculates minute-by-minute rolling momentum pressure values based on match events and stats.
   * Uses an Exponential Moving Average (EMA) to smooth out events into an organic curve.
   */
  calculateMomentum(
    elapsedTime: number,
    events: any[],
    homePossession: number = 50,
  ): MomentumPoint[] {
    const totalMinutes = Math.max(90, elapsedTime);
    const rawWeights = new Array<number>(totalMinutes + 1).fill(0);

    // 1. Establish base momentum based on average ball possession
    // Map possession (e.g. 55% Home -> 55 - 50 = +5 base weight)
    const basePossessionWeight = (homePossession - 50) * 0.4;
    for (let m = 1; m <= totalMinutes; m++) {
      rawWeights[m] = basePossessionWeight;
    }

    // 2. Adjust base pressure if there are Red Cards (long-term structural advantage)
    let homeRedCards = 0;
    let awayRedCards = 0;
    const sortedEvents = [...(events || [])].sort((a, b) => (a.time?.elapsed || 0) - (b.time?.elapsed || 0));

    sortedEvents.forEach((event) => {
      const minute = event.time?.elapsed;
      if (!minute || minute > totalMinutes) return;

      if (event.type === 'Card' && event.detail === 'Red Card') {
        const isHome = event.team?.id === event.match?.homeTeamId || event.team?.logo === 'home'; // handle various schema mappings
        // If home team gets red card, shift future base weight toward Away team
        if (isHome || event.side === 'home') {
          homeRedCards++;
        } else {
          awayRedCards++;
        }

        // Apply future shifting penalty
        const penalty = (awayRedCards - homeRedCards) * 15;
        for (let m = minute; m <= totalMinutes; m++) {
          rawWeights[m] += penalty;
        }
      }
    });

    // 3. Inject short-term tactical spike weights for match events
    sortedEvents.forEach((event) => {
      const minute = event.time?.elapsed;
      if (!minute || minute > totalMinutes) return;

      const isHome = event.side === 'home' || event.team?.logo === 'home'; // typical normalizer structure
      const direction = isHome ? 1 : -1;

      switch (event.type) {
        case 'Goal':
          // Large spike for scoring
          rawWeights[minute] += direction * 40;
          break;
        case 'Card':
          if (event.detail === 'Yellow Card') {
            // Minor setback
            rawWeights[minute] -= direction * 4;
          }
          break;
        case 'subst':
          // Tactical refresh
          rawWeights[minute] += direction * 2;
          break;
        case 'Var':
          if (event.detail?.includes('Goal cancelled')) {
            // Negative psychological setback
            rawWeights[minute] -= direction * 15;
          }
          break;
      }
    });

    // 4. Apply Exponential Moving Average (EMA) to smooth into an organic visual curve
    const smoothedPoints: MomentumPoint[] = [];
    const alpha = 0.25; // smoothing coefficient
    let currentEMA = basePossessionWeight;

    for (let minute = 1; minute <= totalMinutes; minute++) {
      const rawVal = rawWeights[minute];
      // EMA formula: EMA_t = alpha * Price_t + (1 - alpha) * EMA_t-1
      currentEMA = alpha * rawVal + (1 - alpha) * currentEMA;

      // Clamp values strictly between -100 and 100
      const clampedValue = Math.max(-100, Math.min(100, Math.round(currentEMA * 100) / 100));

      smoothedPoints.push({
        minute,
        value: clampedValue,
      });
    }

    return smoothedPoints;
  }
}
