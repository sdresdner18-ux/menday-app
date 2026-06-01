import { NextResponse } from "next/server";
import {
  ensureShopSettings,
  serializePublicShopSettings,
} from "@/lib/shopSettings";

export async function GET() {
  try {
    const settings = await ensureShopSettings();
    return NextResponse.json(serializePublicShopSettings(settings));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load shop info" }, { status: 500 });
  }
}
