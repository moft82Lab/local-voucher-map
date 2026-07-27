import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "지역상품권 지도",
    short_name: "지역상품권 지도",
    description:
      "지역사랑상품권 가맹점과 사용처를 지도에서 찾아보세요.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e6",
    theme_color: "#263d2e",
    lang: "ko",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
