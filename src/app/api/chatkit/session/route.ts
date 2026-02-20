import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  const workflowId = process.env.CHATKIT_WORKFLOW_ID;

  if (!apiKey || !workflowId) {
    return NextResponse.json(
      { error: "Chat is not configured" },
      { status: 503 },
    );
  }

  let userId = "anonymous";
  try {
    const body = await req.json();
    if (body?.userId) userId = String(body.userId);
  } catch {
    // empty body is fine
  }

  const res = await fetch("https://api.openai.com/v1/chatkit/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "chatkit_beta=v1",
    },
    body: JSON.stringify({
      user: userId,
      workflow: { id: workflowId },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[chatkit/session] OpenAI error:", res.status, errBody);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: res.status },
    );
  }

  const session = await res.json();
  return NextResponse.json({
    client_secret: session.client_secret,
  });
}
