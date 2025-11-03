import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 환경측정기업 회원가입 필수/선택 항목 조회
export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { key: "org_registration_required_fields" },
    });

    if (!settings) {
      // 기본값 반환
      return NextResponse.json({
        required: ["name", "businessNumber"],
        optional: [
          "corporateNumber",
          "businessType",
          "address",
          "phone",
          "email",
          "representative",
          "website",
          "fax",
          "establishedDate",
        ],
      });
    }

    const config = JSON.parse(settings.value);
    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Get registration fields error:", error);
    return NextResponse.json(
      { error: "설정 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
