# 지역상품권 지도

지역상품권 사용처를 지도와 검색으로 확인하는 원페이지 서비스입니다. 현재는 의성군 대표홈페이지 시스템이 제공하는 의성사랑상품권 가맹점 현황만 연결되어 있습니다. 전체 화면 지도, 플로팅 검색 패널, 업종 필터와 가맹점 목록을 한 화면에서 제공하며, 준비되지 않은 다른 지역의 데이터나 전국 통계는 노출하지 않습니다.

로컬에 별도로 준비한 `data.csv`를 SQLite로 변환하고, Next.js Server Component가 읽기 전용으로 조회합니다. 원본 데이터 파일은 Git 이력에 포함하지 않고, 생성된 `data/merchants.sqlite`만 배포용으로 추적합니다. OpenStreetMap 기반 지도에서 읍·면별 집계와 상호·주소·업종 검색을 제공하며, 지도 코드는 필요할 때만 별도 번들로 로드됩니다.

## 로컬 실행

요구 사항:

- Node.js 24 LTS (`.nvmrc`와 `package.json`에서 고정)
- npm 10 이상

```bash
npm install
npm run dev
```

승인된 원본 `data.csv`가 프로젝트 루트에 있으면 `npm run dev` 실행 전에 `data/merchants.sqlite`를 다시 생성합니다. 원본이 없으면 저장소에 포함된 SQLite를 그대로 사용합니다.
브라우저에서 `http://localhost:3000`을 엽니다.

## 품질 검사

```bash
npm run lint
npm run typecheck
npm run build
```

세 검사를 한 번에 실행하려면 `npm run check`를 사용합니다.

## Vercel 배포

### Git 연동 방식

1. 이 폴더를 GitHub, GitLab, Bitbucket 또는 Azure DevOps 저장소에 푸시합니다.
2. Vercel Dashboard에서 **Add New → Project**를 선택합니다.
3. 저장소를 가져오면 Vercel이 Next.js를 자동 감지합니다.
4. 별도 Output Directory 설정 없이 **Deploy**를 선택합니다.

`main` 브랜치에 병합하면 Production 배포가 생성되고, 다른 브랜치와 Pull Request에는 Preview 배포가 생성됩니다.
Vercel 빌드에는 저장소의 `data/merchants.sqlite`가 사용되므로 원본 CSV를 별도로 전달할 필요가 없습니다.

### SEO 환경 변수

Vercel 프로젝트의 **Settings → Environment Variables**에서 아래 값을 설정합니다.

- `NEXT_PUBLIC_SITE_URL`: 커스텀 도메인으로 Canonical URL을 고정할 때 사용하는 전체 주소
- `GOOGLE_SITE_VERIFICATION`: Google Search Console이 발급한 인증값
- `NAVER_SITE_VERIFICATION`: 네이버 서치어드바이저가 발급한 인증값

모두 선택 사항입니다. 운영 주소를 설정하지 않으면 Vercel이 제공하는 프로덕션 URL을 사용합니다. 이 경우 Vercel 프로젝트에서 시스템 환경 변수 자동 노출을 활성화해야 합니다.

### CLI 방식

전역 설치 없이 다음 명령으로 배포할 수 있습니다.

```bash
npx vercel
npx vercel --prod
```

첫 명령은 Preview, 두 번째 명령은 Production 배포를 만듭니다. 실행 중 Vercel 로그인과 프로젝트 연결이 필요합니다.

## 자주 수정하는 곳

- 원페이지 진입점: `app/page.tsx`
- 색상, 간격, 반응형 스타일: `app/globals.css`
- 지도·검색 UI: `app/components/merchant-map.tsx`
- SQLite 생성: `scripts/build-sqlite.ts`
- SQLite 읽기: `lib/merchant-data.ts`
- 제목, 설명, SNS 메타데이터: `app/layout.tsx`
- 검색엔진 크롤링 규칙: `app/robots.ts`
- 사이트맵: `app/sitemap.ts`
- SNS 공유 이미지: `app/opengraph-image.tsx`
- 파비콘: `app/icon.svg`

## 가맹점 데이터

Git에서 제외되는 루트의 `data.csv`는 UTF-8과 CP949 인코딩을 모두 지원하며 다음 컬럼 순서를 사용합니다.

```csv
가맹점번호,가맹점이름,상세주소,소재지,가맹점유형,수정일
```

CSV를 변경한 후에는 아래 명령으로 SQLite를 다시 생성하고, 변경된 `data/merchants.sqlite`를 커밋합니다.

```bash
npm run data:build
```

생성되는 `data/merchants.sqlite`는 배포 산출물로 Git에 포함합니다. 로컬에서는 `data.csv`가 있으면 `prebuild` 단계가 데이터베이스를 갱신하고, Vercel에서는 원본 CSV가 없으므로 저장소의 SQLite를 그대로 사용합니다. 애플리케이션은 이를 읽기 전용으로 조회합니다. 데이터베이스에는 가맹점, 정규화 주소, 데이터 갱신일과 향후 좌표를 저장할 `merchant_locations` 테이블이 들어 있습니다.

CSV에는 위도·경도가 없으므로 현재 지도 마커는 개별 점포가 아니라 18개 읍·면의 대표 위치에 표시됩니다. 개별 점포의 정확한 마커가 필요하면 CSV에 위도·경도 컬럼을 추가하거나 별도의 지오코딩 과정을 거쳐야 합니다.

## 구조

```text
app/
├── components/
│   ├── merchant-map-shell.tsx
│   └── merchant-map.tsx
├── globals.css
├── icon.svg
├── layout.tsx
├── manifest.ts
└── page.tsx
lib/
├── merchant-data.ts
└── merchant-types.ts
scripts/
└── build-sqlite.ts
data/
└── merchants.sqlite  # 생성 후 Git에 포함하는 배포 데이터
data.csv               # 로컬 전용, Git 제외
```

페이지와 SQLite 조회는 Server Component에서 처리하고, 지도와 검색 영역만 Client Component로 분리했습니다.
