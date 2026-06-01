import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  LOGO_ALLOWED_TYPES,
  LOGO_MAX_BYTES,
  SHOP_SETTINGS_ID,
  serializeShopSettings,
} from "@/lib/shopSettings";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const settings = await prisma.shopSettings.findUnique({
      where: { id: SHOP_SETTINGS_ID },
    });

    if (!settings) {
      const created = await prisma.shopSettings.create({
        data: { id: SHOP_SETTINGS_ID },
      });
      return NextResponse.json(serializeShopSettings(created));
    }

    return NextResponse.json(serializeShopSettings(settings));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load shop settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();

    const data: Record<string, string | null> = {};

    if ("businessName" in body) {
      const name = typeof body.businessName === "string" ? body.businessName.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "Business name is required" }, { status: 400 });
      }
      data.businessName = name;
    }

    const optionalFields = [
      "tagline",
      "phone",
      "email",
      "website",
      "addressLine1",
      "addressLine2",
      "city",
      "state",
      "zip",
      "invoiceFooter",
      "paymentLink",
      "paymentLabel",
    ] as const;

    for (const field of optionalFields) {
      if (field in body) {
        const value = body[field];
        data[field] =
          typeof value === "string" && value.trim() ? value.trim() : null;
      }
    }

    const updated = await prisma.shopSettings.upsert({
      where: { id: SHOP_SETTINGS_ID },
      create: {
        id: SHOP_SETTINGS_ID,
        businessName:
          typeof data.businessName === "string" ? data.businessName : "Mendy",
        ...data,
      },
      update: data,
    });

    return NextResponse.json(serializeShopSettings(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save shop settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("logo");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Logo file is required" }, { status: 400 });
    }

    if (!LOGO_ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Use a PNG, JPG, WebP, or SVG logo." },
        { status: 400 }
      );
    }

    if (file.size > LOGO_MAX_BYTES) {
      return NextResponse.json(
        { error: "Logo must be 512 KB or smaller." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const logoDataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    const updated = await prisma.shopSettings.upsert({
      where: { id: SHOP_SETTINGS_ID },
      create: {
        id: SHOP_SETTINGS_ID,
        logoDataUrl,
      },
      update: {
        logoDataUrl,
      },
    });

    return NextResponse.json(serializeShopSettings(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}

export async function DELETE() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const updated = await prisma.shopSettings.upsert({
      where: { id: SHOP_SETTINGS_ID },
      create: { id: SHOP_SETTINGS_ID, logoDataUrl: null },
      update: { logoDataUrl: null },
    });

    return NextResponse.json(serializeShopSettings(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to remove logo" }, { status: 500 });
  }
}
