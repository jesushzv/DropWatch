import { ENV } from "./_core/env";

type ThresholdEmail = {
  recipient: string | null | undefined;
  productName: string;
  store: string;
  priceCents: number;
  thresholdCents: number;
  estimatedTotalCents?: number;
  shippingCents?: number;
  taxCents?: number;
  costConfidence?: string;
  condition?: string;
  availability?: string;
  seller?: string;
  productUrl?: string;
  alertBasis?: string;
  unsubscribeUrl?: string;
};

export type NotificationResult =
  | { status: "sent"; providerMessageId: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character] ?? character);
}

function normalizedSender(value: string) {
  return value.replace(/\\u003c/gi, "<").replace(/\\u003e/gi, ">");
}

export async function sendThresholdEmail(input: ThresholdEmail): Promise<NotificationResult> {
  if (!input.recipient) return { status: "skipped", reason: "No email address is associated with this account." };
  if (!ENV.postmarkServerToken || !ENV.postmarkFromEmail) return { status: "skipped", reason: "Email delivery is not configured." };

  const price = `$${(input.priceCents / 100).toFixed(2)}`;
  const target = `$${(input.thresholdCents / 100).toFixed(2)}`;
  const product = escapeHtml(input.productName);
  const store = escapeHtml(input.store);
  const unsubscribeUrl = input.unsubscribeUrl ? escapeHtml(input.unsubscribeUrl) : undefined;
  const total = input.estimatedTotalCents !== undefined ? `$${(input.estimatedTotalCents / 100).toFixed(2)}` : undefined;
  const shipping = input.shippingCents !== undefined ? `$${(input.shippingCents / 100).toFixed(2)}` : "unknown";
  const tax = input.taxCents !== undefined ? `$${(input.taxCents / 100).toFixed(2)}` : "unknown";
  const evidence = `Item price: ${price}\nEstimated delivered total: ${total ?? "not available"}\nShipping: ${shipping}\nTax: ${tax}\nCondition: ${input.condition ?? "unknown"}\nAvailability: ${input.availability ?? "unknown"}\nSeller: ${input.seller ?? input.store}\nAlert basis: ${input.alertBasis ?? "item_price"}`;
  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": ENV.postmarkServerToken,
      },
      body: JSON.stringify({
        From: normalizedSender(ENV.postmarkFromEmail),
        To: input.recipient,
        Subject: `Price target met: ${input.productName}`,
        TextBody: `${input.productName} is ${price} at ${input.store}, which meets your ${target} target in DropWatch.\n\n${evidence}${input.productUrl ? `\n\nView offer: ${input.productUrl}` : ""}${input.unsubscribeUrl ? `\n\nManage price-alert emails: ${input.unsubscribeUrl}` : ""}`,
        HtmlBody: `<p><strong>${product}</strong> is now <strong>${price}</strong> at ${store}.</p><p>That meets your DropWatch target of <strong>${target}</strong>.</p><dl style="font-size:14px;line-height:1.6"><dt>Estimated delivered total</dt><dd>${escapeHtml(total ?? "Not available")}</dd><dt>Shipping</dt><dd>${escapeHtml(shipping)}</dd><dt>Tax</dt><dd>${escapeHtml(tax)}</dd><dt>Condition</dt><dd>${escapeHtml(input.condition ?? "Unknown")}</dd><dt>Availability</dt><dd>${escapeHtml(input.availability ?? "Unknown")}</dd><dt>Alert basis</dt><dd>${escapeHtml(input.alertBasis ?? "item_price")}</dd></dl>${input.productUrl ? `<p><a href="${escapeHtml(input.productUrl)}">View offer</a></p>` : ""}${unsubscribeUrl ? `<p style="margin-top:24px;font-size:12px;color:#6b7280">No longer want price-alert emails? <a href="${unsubscribeUrl}">Unsubscribe</a>.</p>` : ""}`,
        // RFC 8058 one-click: mail clients POST here, so the unsubscribe stays a
        // single click without a GET that scanners can trip.
        ...(input.unsubscribeUrl
          ? {
              Headers: [
                { Name: "List-Unsubscribe", Value: `<${input.unsubscribeUrl}>` },
                { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
              ],
            }
          : {}),
        Tag: "dropwatch-threshold-alert",
        Metadata: { product: input.productName.slice(0, 250), store: input.store.slice(0, 120) },
        MessageStream: "outbound",
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as { MessageID?: string; Message?: string };
    if (!response.ok || !payload.MessageID) return { status: "failed", reason: payload.Message || `Postmark returned HTTP ${response.status}.` };
    return { status: "sent", providerMessageId: payload.MessageID };
  } catch {
    return { status: "failed", reason: "The email provider could not be reached." };
  }
}
