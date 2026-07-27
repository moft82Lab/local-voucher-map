import { getMerchantDataset } from "@/lib/merchant-data";
import {
  DATASET_NAME,
  DATASET_URL,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site-config";
import MerchantMapShell from "./components/merchant-map-shell";

export default async function Home() {
  const merchantDataset = await getMerchantDataset();
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#application`,
        name: SITE_NAME,
        url: siteUrl,
        description: SITE_DESCRIPTION,
        applicationCategory: "NavigationApplication",
        operatingSystem: "Any",
        inLanguage: "ko-KR",
        isAccessibleForFree: true,
        creator: {
          "@type": "Person",
          name: "moft82",
          email: "mailto:moftlab82@gmail.com",
        },
        mainEntity: {
          "@id": `${siteUrl}/#dataset`,
        },
      },
      {
        "@type": "Dataset",
        "@id": `${siteUrl}/#dataset`,
        name: DATASET_NAME,
        description:
          "의성사랑상품권을 사용할 수 있는 가맹점의 이름, 주소, 소재지와 가맹점 유형 정보.",
        url: DATASET_URL,
        sameAs: DATASET_URL,
        dateModified: merchantDataset.updatedAt,
        inLanguage: "ko-KR",
        spatialCoverage: {
          "@type": "Place",
          name: "경상북도 의성군",
        },
        includedInDataCatalog: {
          "@type": "DataCatalog",
          name: "공공데이터포털",
          url: "https://www.data.go.kr",
        },
        variableMeasured: [
          "가맹점번호",
          "가맹점명",
          "소재지",
          "상세주소",
          "가맹점 유형",
          "최신화 일자",
        ],
      },
    ],
  };

  return (
    <main className="map-page">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is serialized from trusted server data and escapes HTML opening characters.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <section className="visually-hidden">
        <h1>{SITE_NAME}</h1>
        <p>{SITE_DESCRIPTION}</p>
        <p>
          현재 경상북도 의성군의 의성사랑상품권 가맹점{" "}
          {merchantDataset.merchants.length.toLocaleString("ko-KR")}곳을
          제공합니다. 가맹점명과 주소를 검색하고 업종 및 읍·면별로 확인할 수
          있습니다.
        </p>
      </section>
      <MerchantMapShell
        categories={merchantDataset.categories}
        merchants={merchantDataset.merchants}
        updatedAt={merchantDataset.updatedAt}
      />
    </main>
  );
}
