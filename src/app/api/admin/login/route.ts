import { NextResponse } from "next/server";
import { passwordOk, startAdmin } from "@/lib/admin";
import { allowIp } from "@/lib/guard";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const back = new URL("/admin", req.url);
  if (!(await allowIp("admin-login", 5, 900))) {
    back.searchParams.set("e", "wait");
    return NextResponse.redirect(back, 303);
  }
  if (!passwordOk(String(form?.get("password") || ""))) {
    back.searchParams.set("e", "wrong");
    return NextResponse.redirect(back, 303);
  }
  await startAdmin();
  return NextResponse.redirect(back, 303);
}
