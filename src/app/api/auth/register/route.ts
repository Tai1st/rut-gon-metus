import { authViaBackend } from "@/lib/auth-route";

type Body = { username?: string; password?: string; fullName?: string };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  return authViaBackend("/link-auth/register", {
    username: body.username ?? "",
    password: body.password ?? "",
    ...(body.fullName?.trim() && { fullName: body.fullName.trim() }),
  }, req);
}
