export const SITE_NAME = "지역상품권 지도";
export const SITE_TITLE = "지역상품권 지도 | 가맹점·사용처 찾기";
export const SITE_DESCRIPTION =
  "지역사랑상품권 가맹점과 사용처를 이름, 주소, 업종, 지역으로 검색하고 지도에서 찾아보는 서비스.";
export const DATASET_NAME = "경상북도 의성군 상품권가맹점정보";
export const DATASET_URL =
  "https://www.data.go.kr/data/15153218/fileData.do";

function withProtocol(value: string) {
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  return configuredUrl
    ? withProtocol(configuredUrl).replace(/\/$/, "")
    : "http://localhost:3000";
}
