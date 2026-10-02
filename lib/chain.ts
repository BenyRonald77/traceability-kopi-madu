import crypto from "crypto";

export const STAGE_ORDER = ["PANEN", "PENGOLAHAN", "PENGEMASAN", "PENGIRIMAN"] as const;
export type StageName = (typeof STAGE_ORDER)[number];

/** JSON kanonis: key diurutkan rekursif agar hash stabil. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + stableStringify((value as Record<string, unknown>)[k])).join(",") +
    "}"
  );
}

export interface StagePayload {
  kodeLot: string;
  tahap: string;
  tanggal: string;
  lokasi: string;
  pelaku: string;
  catatan: string;
  dataPendukung: unknown;
}

/** Hash genesis untuk tahap pertama: SHA-256("GENESIS:" + kodeLot). */
export function genesisHash(kodeLot: string): string {
  return crypto.createHash("sha256").update("GENESIS:" + kodeLot).digest("hex");
}

/**
 * Hash satu tahap = SHA-256(prevHash + "|" + JSON-kanonis(payload tahap)).
 */
export function stageHash(prevHash: string, payload: StagePayload): string {
  return crypto
    .createHash("sha256")
    .update(prevHash + "|" + stableStringify(payload))
    .digest("hex");
}

export interface StoredStage {
  id: number;
  tahap: string;
  tanggal: string;
  lokasi: string;
  pelaku: string;
  catatan: string;
  dataPendukung: string;
  prevHash: string;
  hash: string;
}

export interface VerifyResult {
  valid: boolean;
  brokenAt: { urutan: number; tahap: string; reason: string } | null;
}

/**
 * Hitung ulang seluruh rantai dari genesis. Mengembalikan VALID/INVALID
 * beserta tahap pertama yang rusak (jika ada).
 */
export function verifyChain(kodeLot: string, stages: StoredStage[]): VerifyResult {
  let prev = genesisHash(kodeLot);
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (s.prevHash !== prev) {
      return {
        valid: false,
        brokenAt: { urutan: i + 1, tahap: s.tahap, reason: "prevHash tidak cocok dengan hash tahap sebelumnya" },
      };
    }
    const payload: StagePayload = {
      kodeLot,
      tahap: s.tahap,
      tanggal: s.tanggal,
      lokasi: s.lokasi,
      pelaku: s.pelaku,
      catatan: s.catatan,
      dataPendukung: parseJsonSafe(s.dataPendukung),
    };
    const recomputed = stageHash(s.prevHash, payload);
    if (recomputed !== s.hash) {
      return {
        valid: false,
        brokenAt: { urutan: i + 1, tahap: s.tahap, reason: "hash tidak cocok — data tahap telah diubah" },
      };
    }
    prev = s.hash;
  }
  return { valid: true, brokenAt: null };
}

function parseJsonSafe(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
