# 지역상품권 지도

지역사랑상품권 가맹점과 사용처를 이름, 주소, 업종, 지역으로 검색하고 지도에서 확인하는 원페이지 서비스입니다.

- 운영 사이트: [localvouchermap.kr](https://localvouchermap.kr)
- GitHub: [moft82Lab/local-voucher-map](https://github.com/moft82Lab/local-voucher-map)
- 데이터 원본: [경상북도 의성군_상품권가맹점정보](https://www.data.go.kr/data/15153218/fileData.do)

현재는 의성사랑상품권 가맹점 데이터만 제공합니다. 전국 단위로 확장할 수 있는 데이터셋 목록 구조와 검색 UI를 갖추고 있지만, 연결되지 않은 지역이나 통계는 미리 노출하지 않습니다.

## 현재 제공 데이터

| 항목 | 내용 |
| --- | --- |
| 지역 | 경상북도 의성군 |
| 데이터셋 | 상품권가맹점정보 |
| 가맹점 | 1,999곳 |
| 행정구역 | 18개 읍·면 |
| 데이터 기준일 | 2025-11-20 |
| 포함 정보 | 가맹점번호, 가맹점명, 소재지, 상세주소, 가맹점 유형 |

원본에는 위도와 경도가 없습니다. 따라서 지도는 개별 가맹점의 정확한 위치가 아니라 읍·면 대표 위치와 지역별 가맹점 수를 표시합니다.

## 주요 기능

- 전체 화면 지도와 반응형 검색 패널
- 가맹점명·주소·지역 통합 검색
- 250ms 검색 디바운싱
- 업종 및 읍·면 필터
- 40건 단위 무한 스크롤
- 지역별 가맹점 집계와 지도 이동
- 데이터셋 출처·기준일·서비스 목적 안내
- 데스크톱과 모바일 레이아웃 지원

## 기술 구성

- Next.js 16 App Router
- React 19, TypeScript
- Leaflet, React Leaflet, OpenStreetMap
- SQLite, sql.js
- Biome
- Vercel

Next.js Server Component가 SQLite를 읽고 페이지를 정적으로 생성합니다. 지도와 검색 영역만 Client Component로 분리하고, Leaflet 번들은 필요할 때 동적으로 불러옵니다.

## 로컬 실행

요구 사항:

- Node.js 24 LTS
- npm 10 이상

```bash
npm ci
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

프로젝트 루트에 `data.csv`가 있으면 실행 전에 `data/merchants.sqlite`를 다시 생성합니다. CSV가 없으면 저장소에 포함된 SQLite를 그대로 사용합니다.

## 데이터 갱신

원본 `data.csv`는 UTF-8과 CP949를 지원하며 다음 컬럼 순서를 사용합니다.

```csv
가맹점번호,가맹점이름,상세주소,소재지,가맹점유형,수정일
```

갱신 절차:

```bash
npm run data:build
npm run check
```

생성된 `data/merchants.sqlite`를 커밋하면 다음 Vercel 배포에 새 데이터가 반영됩니다.

- `data.csv`: 로컬 전용, Git 제외
- `경상북도.txt`: 로컬 전용, Git 제외
- `data/merchants.sqlite`: 읽기 전용 배포 데이터, Git 추적

SQLite에는 가맹점, 정규화 주소, 데이터 갱신일과 향후 좌표를 저장할 `merchant_locations` 테이블이 들어 있습니다.

## 품질 검사

```bash
npm run lint
npm run typecheck
npm run build
```

세 검사를 한 번에 실행하려면 다음 명령을 사용합니다.

```bash
npm run check
```

## 배포

GitHub의 `main` 브랜치가 Vercel 프로덕션에 연결되어 있습니다. 저장소의 SQLite가 빌드 입력으로 포함되므로 Vercel에 원본 CSV나 외부 데이터베이스를 별도로 전달하지 않습니다.

- 운영 도메인: `https://localvouchermap.kr`
- Vercel 프로젝트 주소: `https://local-voucher-map.vercel.app`
- Node.js: `24.x`
- Build Command: `npm run build`
- Output Directory: Next.js 기본값

운영 도메인은 코드의 기본 canonical URL로 설정되어 있습니다. 다른 환경에서 주소를 덮어써야 할 때만 다음 변수를 사용합니다.

```env
NEXT_PUBLIC_SITE_URL=https://localvouchermap.kr
```

검색엔진 소유권 인증값은 발급받은 경우 Vercel 환경 변수에 추가합니다.

```env
GOOGLE_SITE_VERIFICATION=
NAVER_SITE_VERIFICATION=
```

## SEO

- 운영 도메인 canonical
- Open Graph 및 Twitter 공유 메타데이터
- 1200×630 동적 공유 이미지
- `WebApplication` 및 `Dataset` JSON-LD
- `robots.txt`
- 데이터 기준일을 반영한 `sitemap.xml`
- 검색엔진이 읽을 수 있는 서버 렌더링 제목과 서비스 설명

## 프로젝트 구조

```text
app/
├── components/
│   ├── merchant-map-shell.tsx
│   └── merchant-map.tsx
├── globals.css
├── icon.svg
├── layout.tsx
├── manifest.ts
├── opengraph-image.tsx
├── page.tsx
├── robots.ts
└── sitemap.ts
data/
└── merchants.sqlite
lib/
├── merchant-data.ts
├── merchant-types.ts
└── site-config.ts
scripts/
└── build-sqlite.ts
```

## 향후 과제

- 지오코딩을 통한 개별 가맹점 좌표 구축
- 여러 지자체 데이터셋을 수용하는 저장 구조 확장
- 데이터 수집·검증·배포 자동화
- 데이터 규모 증가 시 외부 운영 데이터베이스 또는 객체 스토리지 도입

## 출처와 개발자

- 데이터 제공: 의성군, 공공데이터포털
- 지도 시각화 및 개발: `moft82`
- 문의: [moftlab82@gmail.com](mailto:moftlab82@gmail.com)
