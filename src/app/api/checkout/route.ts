import { NextResponse } from "next/server";
import { z } from "zod";
import { allowIp } from "@/lib/guard";
import { createCheckout } from "@/lib/billing";

const Body = z.object({
  product: z.enum(["kit", "monthly", "yearly"]),
  profile: z.object({
    placeId: z.string().min(1).max(300),
    name: z.string().min(1).max(200),
    address: z.string().max(400).default(""),
    city: z.string().max(200).default(""),
    phone: z.string().max(40).optional(),
    website: z.string().max(400).optional(),
    industry: z.enum(["home-services", "beauty", "food-trucks", "pet", "wellness", "restaurants"]),
    managesProfile: z.enum(["yes", "no", "unsure", "none"]).default("unsure"),
    services: z.string().max(490).default(""),
    different: z.string().max(490).default(""),
    areas: z.string().max(490).default(""),
    email: z.string().email().max(200),
  }),
});

export async function POST(req: Request) {
  if (!(await allowIp("checkout", 10, 600))) return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Some details are missing. Please go back and check them." }, { status: 400 });
  try {
    const url = await createCheckout(parsed.data.product, parsed.data.profile);
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Checkout isn't working right now. Please try again in a minute." }, { status: 502 });
  }
}
