/**
 * Local booster pack images for each expansion.
 * Downloaded from asia.pokemon-card.com/hk — stored in public/expansions/.
 * M1L, M1S, MBG, MBD, MJ have no dedicated special page; add images manually if available.
 */
export const EXPANSION_PACK_IMAGE: Record<string, string> = {
  M1L: "/expansions/m1l.png",
  M1S: "/expansions/m1s.png",
  M2:  "/expansions/m2.png",
  M2a: "/expansions/m2a.png",
  MC:  "/expansions/mc.png",
  M3:  "/expansions/m3.png",
  M4:  "/expansions/m4.png",
  M5:  "/expansions/m5.png",
}

/**
 * Regulation mark range per expansion (derived from card data).
 * Overrides the single value stored in the DB for sets that span multiple marks.
 */
export const EXPANSION_REGULATION: Record<string, string> = {
  M1L: "I",
  M1S: "I",
  M2:  "I",
  M2a: "I",
  MBG: "I",
  MBD: "I",
  MC:  "I",
  MJ:  "I",
  M3:  "I–J",
  M4:  "I–J",
  M5:  "J",
}
