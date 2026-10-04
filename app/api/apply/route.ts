import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";

interface RegisterTenantRequestBody {
  storeName?: string;
  email?: string;
  phone?: string;
  category?: string;
}

interface BrevoApiError {
  response?: {
    data?: unknown;
    status?: number;
  };
  body?: unknown;
  message?: string;
}

function isBrevoError(error: unknown): error is BrevoApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("response" in error || "body" in error || "message" in error)
  );
}

// Extract exact payload type directly from BrevoClient method parameters
type SendSmtpEmailPayload = Parameters<
  BrevoClient["transactionalEmails"]["sendTransacEmail"]
>[0];

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: RegisterTenantRequestBody = await request.json();
    const { storeName, email, phone, category } = body;

    // 1. Input Validation
    if (!storeName || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // 2. Strict Environment Variable Validation
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL;
    const receiverEmail = process.env.NOTIFICATION_RECEIVER_EMAIL;

    if (!apiKey || !senderEmail || !receiverEmail) {
      console.error("[Brevo Error] Missing environment configuration:", {
        hasApiKey: Boolean(apiKey),
        hasSenderEmail: Boolean(senderEmail),
        hasReceiverEmail: Boolean(receiverEmail),
      });

      return NextResponse.json(
        { error: "Server configuration error. Environment variables missing." },
        { status: 500 }
      );
    }

    const brevo = new BrevoClient({ apiKey });

    // 3. Infer Payload Type Safely
    const emailPayload: SendSmtpEmailPayload = {
      subject: `New Tenant Registration: ${storeName}`,
      sender: {
        name: "Picomart Merchant Platform",
        email: senderEmail,
      },
      to: [
        {
          email: receiverEmail,
          name: "Picomart Admin",
        },
      ],
      htmlContent: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>New Tenant Registration Request</h2>
          <p>A new merchant wants to register their store on Picomart:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Store Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${storeName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>WhatsApp:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${phone}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Category:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${category ?? "N/A"}</td></tr>
          </table>
        </div>
      `,
    };

    await brevo.transactionalEmails.sendTransacEmail(emailPayload);

    return NextResponse.json(
      { message: "Registration email sent successfully!" },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (isBrevoError(error)) {
      console.error(
        "[Brevo API Error]",
        error.response?.data ?? error.body ?? error.message ?? error
      );
    } else {
      console.error("[Unhandled API Error]", error);
    }

    return NextResponse.json(
      {
        error: "Failed to send notification email.",
        details:
          process.env.NODE_ENV === "production" && isBrevoError(error)
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}