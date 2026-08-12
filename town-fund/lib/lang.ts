import { cookies } from "next/headers";
import { Lang } from "./i18n";

export function getLang(): Lang {
  const value = cookies().get("lang")?.value;
  return value === "es" ? "es" : "en";
}
