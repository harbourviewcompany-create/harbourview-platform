/**
 * Display-only centroids for jurisdictions omitted by the vendored
 * Natural Earth Admin-0 geometry source.
 *
 * These coordinates are presentation geometry only. They do not infer,
 * alter, or publish regulatory status.
 */
export const supplementaryJurisdictionCentroids: Record<string, [number, number]> = {
  MC: [7.425, 43.738],
  MH: [171.184, 7.131],
  MV: [73.221, 3.203],
  NR: [166.932, -0.522],
  SM: [12.458, 43.942],
  TV: [179.199, -8.520],
  VA: [12.453, 41.902],
}
