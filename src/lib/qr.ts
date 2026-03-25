import QRCode from "qrcode";

export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 400,
    margin: 2,
    color: { dark: "#ffffff", light: "#0a0a0a" },
  });
}

export function generateUniqueId(cityCode: string, count: number): string {
  const padded = String(count).padStart(5, "0");
  return `COM-${cityCode}-${padded}`;
}
