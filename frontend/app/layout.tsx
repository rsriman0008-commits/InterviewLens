import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewLens - AI Technical Interview Simulator",
  description: "Practice real-time technical interviews with AI interviewer powered by Gemini and voice by ElevenLabs",
  keywords: ["interview", "practice", "AI", "technical", "coding", "simulator"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
