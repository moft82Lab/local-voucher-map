import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "지역상품권 지도",
    template: "%s | 지역상품권 지도",
  },
  description:
    "지역사랑상품권 가맹점과 사용처를 지도에서 찾아보는 지역상품권 지도 서비스.",
  applicationName: "지역상품권 지도",
  keywords: [
    "지역상품권",
    "지역화폐",
    "가맹점 지도",
    "의성사랑상품권",
    "의성군",
    "가맹점",
    "상품권 사용처",
  ],
  authors: [{ name: "moft82", url: "mailto:moftlab82@gmail.com" }],
  creator: "moft82",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "지역상품권 지도",
    description:
      "지역사랑상품권 가맹점과 사용처를 지도에서 찾아보세요.",
    siteName: "지역상품권 지도",
  },
  twitter: {
    card: "summary",
    title: "지역상품권 지도",
    description:
      "지역사랑상품권 가맹점과 사용처를 지도에서 찾아보세요.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f0e6",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
