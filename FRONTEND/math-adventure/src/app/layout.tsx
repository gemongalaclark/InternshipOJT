import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Adventure - Fun Math Learning Game for Kids",
  description: "An exciting educational math game for elementary students. Practice addition, subtraction, multiplication, and division while having fun!",
  keywords: "math game, educational game, kids learning, elementary math, addition, subtraction, multiplication, division",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="bg-animated"></div>
        <div className="floating-shapes">
          <div className="shape" style={{ fontSize: '4rem' }}>➕</div>
          <div className="shape" style={{ fontSize: '4rem' }}>➖</div>
          <div className="shape" style={{ fontSize: '4rem' }}>✖️</div>
          <div className="shape" style={{ fontSize: '4rem' }}>➗</div>
        </div>
        {children}
      </body>
    </html>
  );
}
