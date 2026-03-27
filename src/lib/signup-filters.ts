import type { Prisma } from "@prisma/client";

export interface SignupFilterInput {
  search?: string;
  sessionCityCode?: string;
  checkedIn?: string | boolean | null;
  bodyArtPreference?: string;
  utmSource?: string;
}

export function buildSignupWhereClause(
  filters: SignupFilterInput
): Prisma.SignupWhereInput {
  const where: Prisma.SignupWhereInput = {};
  const search = filters.search?.trim();
  const sessionCityCode = filters.sessionCityCode?.trim();
  const bodyArtPreference = filters.bodyArtPreference?.trim();
  const utmSource = filters.utmSource?.trim();

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { uniqueId: { contains: search, mode: "insensitive" } },
    ];
  }

  if (sessionCityCode) {
    where.session = {
      cityCode: {
        equals: sessionCityCode,
        mode: "insensitive",
      },
    };
  }

  if (typeof filters.checkedIn === "boolean") {
    where.checkedIn = filters.checkedIn;
  }

  if (filters.checkedIn === "true") {
    where.checkedIn = true;
  }

  if (filters.checkedIn === "false") {
    where.checkedIn = false;
  }

  if (bodyArtPreference) {
    where.bodyArtPreference = {
      equals: bodyArtPreference,
      mode: "insensitive",
    };
  }

  if (utmSource) {
    where.utmSource = {
      equals: utmSource,
      mode: "insensitive",
    };
  }

  return where;
}
