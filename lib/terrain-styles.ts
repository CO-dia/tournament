/** Matches calendrier column tints: terrain 1 accent (rouge), 2 ciel (bleu), 3 sauge (vert). */
export function terrainPillClasses(court: number): string {
  switch (court) {
    case 1:
      return "bg-stk-accent/40 text-stk-navy";
    case 2:
      return "bg-stk-sky/55 text-stk-navy";
    case 3:
      return "bg-stk-sage/45 text-stk-navy";
    default:
      return "bg-stk-navy/15 text-stk-navy";
  }
}
