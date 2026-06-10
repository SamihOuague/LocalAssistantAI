export interface CanonicalPair {
  userLow: string;
  userHigh: string;
}

export function canonicalPair(idA: string, idB: string): CanonicalPair {
  return idA < idB
    ? { userLow: idA, userHigh: idB }
    : { userLow: idB, userHigh: idA };
}
