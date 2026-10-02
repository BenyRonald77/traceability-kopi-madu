export const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export const TAHAP_LABEL: Record<string, string> = {
  PANEN: "Panen",
  PENGOLAHAN: "Pengolahan",
  PENGEMASAN: "Pengemasan",
  PENGIRIMAN: "Pengiriman",
};
export const tahapLabel = (t: string) => TAHAP_LABEL[t] ?? t;
