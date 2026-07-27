"use client";

import dynamic from "next/dynamic";
import type { Merchant } from "@/lib/merchant-types";

const MerchantMap = dynamic(() => import("./merchant-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      <div className="map-loading__brand">
        <span />
        <strong>지역상품권 지도</strong>
      </div>
      <p>가맹점 데이터를 불러오고 있습니다.</p>
    </div>
  ),
});

type MerchantMapShellProps = {
  merchants: Merchant[];
  categories: string[];
  updatedAt: string;
};

export default function MerchantMapShell(props: MerchantMapShellProps) {
  return <MerchantMap {...props} />;
}
