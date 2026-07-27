import { ImageResponse } from "next/og";

export const alt = "지역상품권 지도 서비스 미리보기";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background:
          "linear-gradient(135deg, #f7f4eb 0%, #e5eee7 48%, #bfd2bb 100%)",
        color: "#173e32",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "66px",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "stretch",
          background: "rgba(255, 253, 249, 0.94)",
          border: "1px solid rgba(23, 62, 50, 0.12)",
          borderRadius: "40px",
          boxShadow: "0 28px 80px rgba(23, 62, 50, 0.16)",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "70px",
            width: "62%",
          }}
        >
          <div
            style={{
              color: "#d66a42",
              display: "flex",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.18em",
            }}
          >
            LOCAL VOUCHER MAP
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "72px",
              fontWeight: 800,
              letterSpacing: "-0.06em",
              marginTop: "18px",
            }}
          >
            지역상품권 지도
          </div>
          <div
            style={{
              color: "#68716a",
              display: "flex",
              flexDirection: "column",
              fontSize: "27px",
              lineHeight: 1.5,
              marginTop: "24px",
            }}
          >
            <span style={{ display: "flex" }}>
              지역사랑상품권 가맹점과 사용처를
            </span>
            <span style={{ display: "flex" }}>지도에서 찾아보세요</span>
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            background: "#173e32",
            display: "flex",
            justifyContent: "center",
            position: "relative",
            width: "38%",
          }}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                background: index === 1 ? "#d66a42" : "#fffdf9",
                border: "7px solid rgba(255, 255, 255, 0.28)",
                borderRadius: "50%",
                display: "flex",
                height: index === 1 ? "74px" : "50px",
                left: `${66 + ((index * 81) % 235)}px`,
                position: "absolute",
                top: `${76 + ((index * 109) % 310)}px`,
                width: index === 1 ? "74px" : "50px",
              }}
            />
          ))}
          <div
            style={{
              border: "2px solid rgba(255, 255, 255, 0.34)",
              borderRadius: "50%",
              display: "flex",
              height: "235px",
              width: "235px",
            }}
          />
        </div>
      </div>
    </div>,
    size,
  );
}
