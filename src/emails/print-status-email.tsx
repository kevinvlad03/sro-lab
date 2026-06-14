import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type PrintEmailStatus =
  | "printing"
  | "done"
  | "failed"
  | "cancelled"
  | "rejected";

export type PrintStatusEmailProps = {
  recipientName: string;
  jobTitle: string;
  status: PrintEmailStatus;
  rejectionReason?: string;
  photoUrl?: string;
  appUrl: string;
};

const COPY: Record<
  PrintEmailStatus,
  { preview: string; heading: string; body: string }
> = {
  printing: {
    preview: "Your print is on the bed.",
    heading: "Your print is on the bed",
    body: "We just started printing. We'll let you know when it's ready to pick up.",
  },
  done: {
    preview: "Your print is ready to pick up.",
    heading: "Your print is ready",
    body: "Come grab it from the SRO printer when you have a minute.",
  },
  failed: {
    preview: "Your print didn't finish.",
    heading: "Your print failed",
    body: "Something went wrong during printing. Ping the admin if you want to retry.",
  },
  cancelled: {
    preview: "Your print was cancelled.",
    heading: "Your print was cancelled",
    body: "An admin removed this from the queue. You can resubmit any time.",
  },
  rejected: {
    preview: "Your print wasn't accepted.",
    heading: "Your print wasn't accepted",
    body: "The admin rejected this print before it ran.",
  },
};

export function PrintStatusEmail({
  recipientName,
  jobTitle,
  status,
  rejectionReason,
  photoUrl,
  appUrl,
}: PrintStatusEmailProps) {
  const copy = COPY[status];

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>
            SRO <span style={brandAccent}>Lab</span>
          </Text>

          <Heading style={heading}>{copy.heading}</Heading>

          <Text style={paragraph}>Hey {recipientName.split(" ")[0]},</Text>

          <Text style={paragraph}>
            Your print <strong>&ldquo;{jobTitle}&rdquo;</strong> {bodyVerb(status)}.{" "}
            {copy.body}
          </Text>

          {status === "rejected" && rejectionReason && (
            <Section style={callout}>
              <Text style={calloutLabel}>Reason</Text>
              <Text style={calloutText}>{rejectionReason}</Text>
            </Section>
          )}

          {status === "done" && photoUrl && (
            <Section style={{ marginTop: 20 }}>
              <Img
                src={photoUrl}
                alt={jobTitle}
                width="416"
                style={photo}
              />
            </Section>
          )}

          <Section style={{ marginTop: 24 }}>
            <Button style={button} href={appUrl}>
              View in SRO Lab
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You&apos;re getting this because you submitted a print to the SRO
            Lab queue.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

PrintStatusEmail.PreviewProps = {
  recipientName: "Jane Doe",
  jobTitle: "Phone stand",
  status: "done",
  appUrl: "https://example.com",
  photoUrl: "https://placehold.co/600x400/00AE42/ffffff?text=Sample+print",
} satisfies PrintStatusEmailProps;

export default PrintStatusEmail;

function bodyVerb(status: PrintEmailStatus): string {
  switch (status) {
    case "printing":
      return "is now printing";
    case "done":
      return "is done";
    case "failed":
      return "failed";
    case "cancelled":
      return "was cancelled";
    case "rejected":
      return "was rejected";
  }
}

const main = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: "40px 16px",
};

const container = {
  backgroundColor: "#ffffff",
  maxWidth: "480px",
  margin: "0 auto",
  borderRadius: "16px",
  padding: "32px",
  border: "1px solid #e5e5e5",
};

const brand = {
  fontSize: "16px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  margin: "0 0 28px",
  color: "#0a0a0a",
};

const brandAccent = {
  color: "#00AE42",
};

const heading = {
  fontSize: "22px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: "28px",
  margin: "0 0 16px",
  color: "#0a0a0a",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#404040",
  margin: "0 0 12px",
};

const callout = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "12px",
  padding: "12px 14px",
  marginTop: "16px",
};

const calloutLabel = {
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  color: "#92400e",
  fontWeight: 600,
  margin: "0 0 4px",
};

const calloutText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#92400e",
  margin: 0,
};

const photo = {
  width: "100%",
  height: "auto",
  borderRadius: "12px",
  border: "1px solid #e5e5e5",
};

const button = {
  backgroundColor: "#00AE42",
  color: "#ffffff",
  padding: "11px 22px",
  borderRadius: "999px",
  fontWeight: 500,
  fontSize: "14px",
  textDecoration: "none",
  display: "inline-block",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "28px 0 16px",
};

const footer = {
  fontSize: "11px",
  lineHeight: "16px",
  color: "#737373",
  margin: 0,
};
