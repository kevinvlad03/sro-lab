import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type AccountApprovedEmailProps = {
  recipientName: string;
  appUrl: string;
};

export function AccountApprovedEmail({
  recipientName,
  appUrl,
}: AccountApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your SRO Lab account is approved.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>
            SRO <span style={brandAccent}>Lab</span>
          </Text>

          <Heading style={heading}>You&apos;re in</Heading>

          <Text style={paragraph}>
            Hey {recipientName.split(" ")[0]}, an admin just approved your
            account. You can now submit prints to the SRO Lab queue.
          </Text>

          <Section style={{ marginTop: 24 }}>
            <Button style={button} href={`${appUrl}/submit`}>
              Submit your first print
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            SRO Lab — print queue for the SRO team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

AccountApprovedEmail.PreviewProps = {
  recipientName: "Jane Doe",
  appUrl: "https://example.com",
} satisfies AccountApprovedEmailProps;

export default AccountApprovedEmail;

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
