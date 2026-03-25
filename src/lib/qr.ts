import QRCode from "qrcode";

export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 400,
    margin: 2,
    color: { dark: "#ffffff", light: "#0a0a0a" },
  });
}

export function generateUniqueId(cityCode: string): string {
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return `COM-${cityCode}-${randomNumber}`;
}
