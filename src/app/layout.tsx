import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { getProfile } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SRO Lab",
  description: "Print queue for the SRO team's 3D printer.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();
  const { items, unread } = profile
    ? await getNotifications(profile.id)
    : { items: [], unread: 0 };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar profile={profile} notifications={items} unread={unread} />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
