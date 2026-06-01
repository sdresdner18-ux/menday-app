import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an order parser for a custom manufacturing business that makes Magnets, Stands, Mugs, Keychains, and Other items.

Today's date is ${today}.

Parse this order message and extract structured data. Return ONLY valid JSON with no extra text, no markdown, no code fences.

Message: "${message}"

Return JSON with exactly these fields:
{
  "customerName": "string - the customer's name",
  "customerPhone": "string - US phone number if mentioned (10 digits, e.g. 555-123-4567), or null",
  "projectType": "one of: Magnet, Stand, Mug, Keychain, Other",
  "quantity": number or null,
  "unitPrice": number or null - price per unit in USD if mentioned,
  "color": "string describing color/finish/material or null",
  "deadline": "ISO date string YYYY-MM-DD or null - convert relative dates like 'next Wednesday' to absolute dates",
  "filesExpected": boolean - true if they mention files/logo/design coming later,
  "notes": "any other relevant details or null",
  "priority": "Low, Medium, High, or Urgent - based on urgency/deadline tightness"
}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to parse order" }, { status: 500 });
  }
}
