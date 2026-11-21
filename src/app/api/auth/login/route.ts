import { authViaBackend } from "@/lib/auth-route";

type Body = { username?: string; password?: string };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  return authViaBackend("/link-auth/login", {
    username: body.username ?? "",
    password: body.password ?? "",
  }, req);
}
