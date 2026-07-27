"use client";

import type { FitBoundsOptions, Map as LeafletMap } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import type { Merchant } from "@/lib/merchant-types";

const AREA_COORDINATES: Record<string, [number, number]> = {
  가음면: [36.22591, 128.73495],
  구천면: [36.33668, 128.42431],
  금성면: [36.26407, 128.68951],
  다인면: [36.46154, 128.36778],
  단밀면: [36.37017, 128.36093],
  단북면: [36.3962, 128.39918],
  단촌면: [36.42219, 128.6931],
  봉양면: [36.30451, 128.60664],
  비안면: [36.33728, 128.51219],
  사곡면: [36.30177, 128.78222],
  신평면: [36.4692, 128.51913],
  안계면: [36.39097, 128.46185],
  안사면: [36.45635, 128.45431],
  안평면: [36.3785, 128.5892],
  옥산면: [36.3664, 128.82795],
  의성읍: [36.34389, 128.70155],
  점곡면: [36.40616, 128.7631],
  춘산면: [36.23991, 128.81555],
};

const UISEONG_BOUNDS: [[number, number], [number, number]] = [
  [36.185, 128.31],
  [36.51, 128.87],
];
const INITIAL_VISIBLE_COUNT = 40;
const SEARCH_DEBOUNCE_MS = 250;
const ADDRESS_PREFIX = /^경상북도\s+의성군\s+/;
const SHEET_POSITIONS = ["compact", "half", "full"] as const;
const CURRENT_DATASET = {
  voucher: "의성사랑상품권",
} as const;
const DATASET_CATALOG = [
  {
    id: "uiseong-local-voucher",
    municipality: "경상북도 의성군",
    dataset: "상품권가맹점정보",
    url: "https://www.data.go.kr/data/15153218/fileData.do",
  },
] as const;

type SheetPosition = (typeof SHEET_POSITIONS)[number];

type MerchantMapProps = {
  merchants: Merchant[];
  categories: string[];
  updatedAt: string;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ko");
}

function shortenAddress(address: string) {
  return address.replace(ADDRESS_PREFIX, "");
}

function getBoundsOptions(): FitBoundsOptions {
  if (typeof window !== "undefined" && window.innerWidth <= 720) {
    return {
      paddingTopLeft: [24, 88],
      paddingBottomRight: [24, 290],
    };
  }

  return {
    paddingTopLeft: [440, 36],
    paddingBottomRight: [36, 36],
  };
}

function ResponsiveInitialView() {
  const map = useMap();

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const fitMap = () => map.fitBounds(UISEONG_BOUNDS, getBoundsOptions());

    fitMap();
    mobileQuery.addEventListener("change", fitMap);

    return () => mobileQuery.removeEventListener("change", fitMap);
  }, [map]);

  return null;
}

function BrandMark() {
  return (
    <svg aria-hidden="true" className="brand-mark" viewBox="0 0 38 38">
      <circle cx="19" cy="19" r="18" />
      <path d="M8.5 24.5c4-8 9.5-12 20.5-12" />
      <path d="M10 27c5.5-4.5 11.5-6.5 19-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m12.5 12.5 4 4" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="3" />
      <circle cx="10" cy="10" r="7" />
      <path d="M10 1v2M10 17v2M1 10h2M17 10h2" />
    </svg>
  );
}

function InformationIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v5" />
      <circle cx="10" cy="6.25" r=".75" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

export default function MerchantMap({
  merchants,
  categories,
  updatedAt,
}: MerchantMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const informationDialogRef = useRef<HTMLDialogElement | null>(null);
  const placeListRef = useRef<HTMLUListElement | null>(null);
  const infiniteScrollTriggerRef = useRef<HTMLLIElement | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [selectedArea, setSelectedArea] = useState("전체");
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [sheetPosition, setSheetPosition] =
    useState<SheetPosition>("half");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  const categoryAndQueryMatches = useMemo(() => {
    const normalizedQuery = normalize(debouncedQuery);

    return merchants.filter((merchant) => {
      const matchesCategory =
        category === "전체" || merchant.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalize(
          `${merchant.name} ${merchant.address} ${merchant.area}`,
        ).includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, debouncedQuery, merchants]);

  const areaCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const merchant of categoryAndQueryMatches) {
      counts.set(merchant.area, (counts.get(merchant.area) ?? 0) + 1);
    }

    return counts;
  }, [categoryAndQueryMatches]);

  const filteredMerchants = useMemo(() => {
    if (selectedArea === "전체") {
      return categoryAndQueryMatches;
    }

    return categoryAndQueryMatches.filter(
      (merchant) => merchant.area === selectedArea,
    );
  }, [categoryAndQueryMatches, selectedArea]);

  const visibleMerchants = filteredMerchants.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMerchants.length;

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    const root = placeListRef.current;
    const trigger = infiniteScrollTriggerRef.current;

    if (!root || !trigger || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisibleCount((current) =>
            Math.min(
              current + INITIAL_VISIBLE_COUNT,
              filteredMerchants.length,
            ),
          );
        }
      },
      {
        root,
        rootMargin: "160px 0px",
      },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [filteredMerchants.length, hasMore]);

  const resetListViewport = () => {
    placeListRef.current?.scrollTo({ top: 0 });
  };

  const selectArea = (area: string) => {
    setSelectedArea(area);
    setSelectedMerchant(null);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    setSheetPosition("half");
    resetListViewport();

    const coordinates = AREA_COORDINATES[area];
    if (coordinates) {
      mapRef.current?.flyTo(coordinates, 12, { duration: 0.7 });
    }
  };

  const selectMerchant = (merchant: Merchant) => {
    setSelectedArea(merchant.area);
    setSelectedMerchant(merchant.id);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    setSheetPosition("half");
    resetListViewport();

    const coordinates = AREA_COORDINATES[merchant.area];
    if (coordinates) {
      mapRef.current?.flyTo(coordinates, 12, { duration: 0.7 });
    }
  };

  const resetArea = () => {
    setSelectedArea("전체");
    setSelectedMerchant(null);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    resetListViewport();
    mapRef.current?.fitBounds(UISEONG_BOUNDS, getBoundsOptions());
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setSelectedMerchant(null);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    resetListViewport();
  };

  const updateCategory = (value: string) => {
    setCategory(value);
    setSelectedMerchant(null);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    resetListViewport();
  };

  const cycleSheetPosition = () => {
    setSheetPosition((current) => {
      const currentIndex = SHEET_POSITIONS.indexOf(current);
      return SHEET_POSITIONS[(currentIndex + 1) % SHEET_POSITIONS.length];
    });
  };

  return (
    <div className="map-app">
      <div className="map-workspace">
        <section
          className="map-canvas"
          aria-label={`${CURRENT_DATASET.voucher} 가맹점 지도`}
        >
          <MapContainer
            ref={mapRef}
            bounds={UISEONG_BOUNDS}
            boundsOptions={{ padding: [34, 34] }}
            className="leaflet-map"
            scrollWheelZoom
            zoomControl={false}
          >
            <ResponsiveInitialView />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />

            {Object.entries(AREA_COORDINATES).map(([area, coordinates]) => {
              const count = areaCounts.get(area) ?? 0;
              const isSelected = selectedArea === area;
              const radius = Math.min(14, 7 + Math.sqrt(count) * 0.2);

              return (
                <CircleMarker
                  center={coordinates}
                  eventHandlers={{ click: () => selectArea(area) }}
                  key={area}
                  pathOptions={{
                    color: isSelected ? "#fffaf2" : "#ffffff",
                    fillColor: isSelected ? "#d66a42" : "#173e32",
                    fillOpacity: count === 0 ? 0.4 : 0.96,
                    opacity: 1,
                    weight: isSelected ? 5 : 4,
                  }}
                  radius={isSelected ? radius + 2 : radius}
                >
                  <Tooltip
                    className={isSelected ? "is-selected" : ""}
                    direction="top"
                    offset={[0, -11]}
                    opacity={1}
                    permanent
                  >
                    <strong>{area}</strong>
                    <span>{count.toLocaleString("ko-KR")}</span>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>

          <div className="map-filter-card">
            <span>지역상품권 가맹점</span>
            <strong>
              {category === "전체" ? "모든 업종" : category}
              <em>/</em>
              {selectedArea === "전체" ? "전체 지역" : selectedArea}
            </strong>
          </div>

          <button
            className="map-reset-button"
            onClick={resetArea}
            title="전체 지역 보기"
            type="button"
          >
            <LocationIcon />
            <span>전체</span>
          </button>

          <div className="map-notice">
            <span className="map-notice__dot" />
            <div>
              <strong>읍·면별 가맹점 집계</strong>
              <p>마커는 개별 점포가 아닌 지역 대표 위치입니다.</p>
            </div>
          </div>
        </section>

        <aside
          aria-label="가맹점 검색 결과"
          className="search-sidebar"
          data-sheet={sheetPosition}
        >
          <button
            aria-label="검색 패널 높이 변경"
            className="sheet-handle"
            onClick={cycleSheetPosition}
            type="button"
          >
            <span />
          </button>

          <header className="panel-header">
            <div className="brand-group">
              <a
                aria-label="지역상품권 지도 홈"
                className="app-brand"
                href="/"
              >
                <BrandMark />
                <span>
                  <small>LOCAL VOUCHER MAP</small>
                  <strong>지역상품권 지도</strong>
                  <em>
                    지역사랑상품권 가맹점과 사용처를 지도에서 찾아보세요
                  </em>
                </span>
              </a>
              <button
                aria-label="서비스 상세 정보 보기"
                className="information-button"
                onClick={() => informationDialogRef.current?.showModal()}
                title="서비스 정보"
                type="button"
              >
                <InformationIcon />
              </button>
            </div>

            <div className="panel-count">
              <strong>{merchants.length.toLocaleString("ko-KR")}</strong>
              <span>등록 가맹점</span>
            </div>
          </header>

          <div className="sidebar-search">
            <label className="map-search-field">
              <span className="visually-hidden">가맹점 이름 또는 주소 검색</span>
              <SearchIcon />
              <input
                onFocus={() => setSheetPosition("full")}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="이름, 주소로 가맹점 찾기"
                ref={searchInputRef}
                type="search"
                value={query}
              />
              <kbd>⌘ K</kbd>
            </label>

            <fieldset className="category-scroll">
              <legend className="visually-hidden">업종 필터</legend>
              {["전체", ...categories].map((item) => (
                <button
                  aria-pressed={category === item}
                  className={category === item ? "is-active" : ""}
                  key={item}
                  onClick={() => updateCategory(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </fieldset>
          </div>

          {visibleMerchants.length > 0 ? (
            <ul className="place-list" ref={placeListRef}>
              {visibleMerchants.map((merchant, index) => (
                <li
                  className={
                    selectedMerchant === merchant.id ? "is-selected" : ""
                  }
                  key={merchant.id}
                >
                  <button
                    aria-pressed={selectedMerchant === merchant.id}
                    onClick={() => selectMerchant(merchant)}
                    type="button"
                  >
                    <span className="place-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="place-content">
                      <span className="place-heading">
                        <strong>{merchant.name}</strong>
                        <svg aria-hidden="true" viewBox="0 0 18 18">
                          <path d="m7 4 5 5-5 5" />
                        </svg>
                      </span>
                      <span className="place-address" title={merchant.address}>
                        {shortenAddress(merchant.address)}
                      </span>
                      <span className="place-meta">
                        <em>{merchant.category}</em>
                        <span>{merchant.area}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {hasMore ? (
                <li
                  className="infinite-scroll-sentinel"
                  ref={infiniteScrollTriggerRef}
                >
                  <span aria-hidden="true" />
                  <span className="visually-hidden">
                    다음 검색 결과를 불러오는 중입니다.
                  </span>
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="empty-results">
              <span>0</span>
              <strong>검색 결과가 없습니다.</strong>
              <p>다른 이름이나 업종으로 검색해 보세요.</p>
            </div>
          )}

          <footer className="developer-info">
            <div>
              <small>DEVELOPED BY</small>
              <strong>moft82</strong>
            </div>
            <a href="mailto:moftlab82@gmail.com">moftlab82@gmail.com</a>
          </footer>
        </aside>
      </div>

      <dialog
        aria-labelledby="service-information-title"
        className="information-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.close();
          }
        }}
        ref={informationDialogRef}
      >
        <header className="information-dialog__header">
          <div>
            <small>SERVICE INFORMATION</small>
            <h2 id="service-information-title">지역상품권 지도</h2>
            <p>
              지역상품권 사용처를 지도와 검색으로 더 쉽게 탐색하기 위한 데이터
              시각화 서비스입니다.
            </p>
          </div>
          <button
            aria-label="서비스 정보 닫기"
            className="information-dialog__close"
            onClick={() => informationDialogRef.current?.close()}
            type="button"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="information-dialog__body">
          <section className="information-purpose">
            <small>서비스 목적</small>
            <p>
              모바일 및 종이형 지역상품권을 사용할 수 있는 가맹점을 주민이
              빠르게 찾고, 지역과 업종에 따른 분포를 한눈에 살펴볼 수 있도록
              공개 데이터를 탐색 가능한 지도로 재구성했습니다.
            </p>
          </section>

          <div className="information-features">
            <section>
              <span>01</span>
              <h3>사용처 검색</h3>
              <p>가맹점명과 주소를 검색해 원하는 사용처를 확인합니다.</p>
            </section>
            <section>
              <span>02</span>
              <h3>지역·업종 탐색</h3>
              <p>읍·면과 가맹점 유형을 기준으로 결과를 좁혀봅니다.</p>
            </section>
            <section>
              <span>03</span>
              <h3>분포 시각화</h3>
              <p>지역별 가맹점 수와 소상공인 분포를 지도에서 살펴봅니다.</p>
            </section>
          </div>

          <section className="information-data">
            <div className="information-section-title">
              <small>CURRENT DATA</small>
              <h3>현재 제공 범위</h3>
            </div>
            <div className="information-table-wrap">
              <table>
                <caption className="visually-hidden">
                  현재 제공하는 지역상품권 데이터 목록
                </caption>
                <thead>
                  <tr>
                    <th scope="col">지자체명</th>
                    <th scope="col">데이터셋</th>
                    <th scope="col">최신화 일자</th>
                  </tr>
                </thead>
                <tbody>
                  {DATASET_CATALOG.map((item) => (
                    <tr key={item.id}>
                      <td>{item.municipality}</td>
                      <td>
                        <a
                          aria-label={`${item.municipality} ${item.dataset}을 공공데이터포털에서 열기`}
                          className="information-dataset-link"
                          href={item.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {item.dataset}
                          <span aria-hidden="true">↗</span>
                        </a>
                      </td>
                      <td>
                        <time dateTime={updatedAt}>{updatedAt}</time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="information-caution">
              현재 지도 마커는 개별 점포의 정밀 좌표가 아니라 읍·면별 가맹점
              집계와 지역 대표 위치를 나타냅니다.
            </p>
          </section>
        </div>

        <footer className="information-developer">
          <span className="information-developer__avatar" aria-hidden="true">
            M
          </span>
          <div className="information-developer__identity">
            <small>제작 및 운영</small>
            <strong>moft82</strong>
            <span>지역 데이터를 더 쉽게 탐색할 수 있는 서비스를 만듭니다.</span>
          </div>
          <a
            className="information-developer__contact"
            href="mailto:moftlab82@gmail.com"
          >
            <small>CONTACT</small>
            <span>moftlab82@gmail.com</span>
          </a>
        </footer>
      </dialog>
    </div>
  );
}
