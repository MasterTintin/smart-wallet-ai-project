import "./globals.css";

export const metadata = {
  title: "Smart Wallet AI",
  description: "AI Financial Dashboard"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
