import { cookies } from "next/headers";

const ADMIN_TOKEN = "boyalone_admin_session";

export async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_TOKEN);
  return token?.value === "authenticated";
}

export function validatePassword(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD;
}
