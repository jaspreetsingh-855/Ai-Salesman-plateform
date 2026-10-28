export function waMeUrl(phone, text = "") {
  const raw = String(phone || "").replace(/\D/g, "");
  if (!raw) return "";
  const local = raw.startsWith("0") ? raw.slice(1) : raw;
  const digits = local.length === 10 ? `91${local}` : local;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}

export function openWhatsApp(phone, text = "") {
  const url = waMeUrl(phone, text);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
