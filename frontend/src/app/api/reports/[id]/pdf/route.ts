import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

// PDF 생성
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { id } = params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        customer: true,
        stack: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "보고서를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (user.role === "CUSTOMER") {
      if (report.customerId !== user.customerId || report.status !== "SHARED") {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
    }

    // HTML 생성
    const html = generateReportHTML(report);

    // Puppeteer로 PDF 생성
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '8mm',
        right: '6mm',
        bottom: '8mm',
        left: '6mm',
      },
    });
    
    await browser.close();

    // PDF 반환
    const filename = `Report_${report.customer.name}_${new Date(report.measuredAt).toISOString().split('T')[0]}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: any) {
    console.error("PDF 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "PDF 생성 실패" },
      { status: 500 }
    );
  }
}

function generateReportHTML(report: any): string {
  const measurements = JSON.parse(report.measurements || "[]").filter(
    (m: any) => m.value !== null && m.value !== undefined && m.value !== "" && m.value !== 0
  );
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 7pt; line-height: 1.2; }
    .container { padding: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 0; }
    th, td { border: 1px solid #000; padding: 2px 3px; text-align: center; font-size: 7pt; }
    th { background-color: #e8e8e8; font-weight: bold; }
    .section-title { background-color: #d0d0d0; font-weight: bold; text-align: center; padding: 3px; }
    .label { background-color: #f0f0f0; font-weight: bold; font-size: 6.5pt; }
    .vertical-label { 
      writing-mode: vertical-rl; 
      text-orientation: upright; 
      background-color: #f0f0f0; 
      font-weight: bold; 
      font-size: 7pt; 
      padding: 2px 0;
      width: 4px;
      letter-spacing: 0;
      line-height: 1;
    }
    .text-left { text-align: left; padding-left: 4px; }
    .text-right { text-align: right; padding-right: 4px; }
    .small { font-size: 6pt; }
  </style>
</head>
<body>
  <div class="container">
    <!-- 제목 -->
    <table>
      <tr>
        <td colspan="14" style="border: 1px solid #000; padding: 6px; text-align: center;">
          <div style="font-size: 14pt; font-weight: bold;">대기측정기록부</div>
          <div style="font-size: 6pt; color: #666; margin-top: 2px;">(이 서식은 「대기환경보전법 시행규칙」별표 8「대기오염물질의 배출허가증 또는 공동에서 측정한 결과에 작성한다.)</div>
        </td>
      </tr>
    </table>
    
    <!-- 의뢰인 정보 + 일반현황 -->
    <table>
      <tr style="height: 20px;">
        <td class="vertical-label" rowspan="4" style="width: 4px;">①의뢰인</td>
        <td class="label" style="width: 12%;">상호(사업장명)</td>
        <td style="width: 30%;">${report.companyName || ''}</td>
        <td class="vertical-label" rowspan="3" style="width: 4px; height: 80px;">②일반현황</td>
        <td class="label" style="width: 12%; height: 27px;">업종</td>
        <td style="width: 30%; height: 27px;">${report.industry || ''}</td>
      </tr>
      <tr style="height: 20px;">
        <td class="label">사업장소재지(주소)</td>
        <td>${report.address || ''}</td>
        <td class="label" style="height: 27px;">시설종류</td>
        <td style="height: 27px;">${report.facilityType || ''}</td>
      </tr>
      <tr style="height: 20px;">
        <td class="label">대표자(의뢰인)</td>
        <td>${report.representative || ''}</td>
        <td class="label" style="height: 26px;">사업장종별</td>
        <td style="height: 26px;">${report.siteCategory || ''}</td>
      </tr>
      <tr style="height: 20px;">
        <td class="label">환경기술인</td>
        <td>${report.environmentalTech || ''}</td>
        <td colspan="3"></td>
      </tr>
    </table>
    
    <!-- 의뢰내용 -->
    <table>
      <tr>
        <td class="vertical-label" rowspan="3" style="width: 4px;">③의뢰내용</td>
        <td class="label">측정용도</td>
        <td colspan="5">${report.purpose || ''}</td>
      </tr>
      <tr>
        <td class="label">굴뚝명칭</td>
        <td>${report.stackName || ''}</td>
        <td class="label">높이(m)</td>
        <td>${report.stackHeight || ''}</td>
        <td class="label">안지름(m)</td>
        <td>${report.stackDiameter || ''}</td>
      </tr>
      <tr>
        <td class="label">굴뚝종별</td>
        <td>${report.stackType || ''}</td>
        <td class="label">의뢰항목</td>
        <td colspan="3">${report.requestedItems || ''}</td>
      </tr>
    </table>
    
    <!-- 시료채취 -->
    <table>
      <tr>
        <td class="vertical-label" rowspan="5" style="width: 4px;">④시료채취</td>
        <td class="label">날씨</td>
        <td>${report.weather || ''}</td>
        <td class="label">기온(℃)</td>
        <td>${report.temp || ''}</td>
        <td class="label">습도(%)</td>
        <td>${report.humidity || ''}</td>
        <td class="label">기압(mmHg)</td>
        <td>${report.pressure || ''}</td>
      </tr>
      <tr>
        <td class="label">풍향</td>
        <td>${report.windDir || ''}</td>
        <td class="label">풍속(m/sec)</td>
        <td>${report.wind || ''}</td>
        <td class="label">가스속도(m/s)</td>
        <td>${report.gasVel || ''}</td>
        <td class="label">가스온도(℃)</td>
        <td>${report.gasTemp || ''}</td>
      </tr>
      <tr>
        <td class="label">수분함량(%)</td>
        <td>${report.moisture || ''}</td>
        <td class="label">실측산소농도(%)</td>
        <td>${report.o2Measured || ''}</td>
        <td class="label">표준산소농도(%)</td>
        <td>${report.o2Standard || ''}</td>
        <td class="label">배출가스유량(S㎥/min)</td>
        <td>${report.flow || ''}</td>
      </tr>
      <tr>
        <td class="label">배출가스 기타</td>
        <td colspan="7">${report.gasNote || ''}</td>
      </tr>
      <tr>
        <td class="label">채취일</td>
        <td>${new Date(report.samplingDate).toLocaleDateString()}</td>
        <td class="label">채취시간</td>
        <td>${report.samplingStart || ''} ~ ${report.samplingEnd || ''}</td>
        <td class="label">시료채취자</td>
        <td colspan="3">${report.sampler || ''}</td>
      </tr>
    </table>
    
    <!-- 측정분석결과 -->
    <table>
      <tr>
        <td class="vertical-label" rowspan="${measurements.length + 3}" style="width: 4px;">⑤측정분석결과</td>
        <th>측정항목</th>
        <th>허용기준</th>
        <th>분석값</th>
        <th>단위</th>
        <th>측정분석방법</th>
        <th>측정시간(시작)</th>
        <th>측정시간(종료)</th>
      </tr>
      ${measurements.map((m: any) => `
      <tr>
        <td>${m.item || ''}</td>
        <td>${m.limit || ''}</td>
        <td>${m.value || ''}</td>
        <td>${m.unit || ''}</td>
        <td>${m.method || ''}</td>
        <td>${m.startTime || ''}</td>
        <td>${m.endTime || ''}</td>
      </tr>
      `).join('')}
      <tr>
        <td class="label">분석기간</td>
        <td colspan="6">${report.analysisStart || ''} ~ ${report.analysisEnd || ''}</td>
      </tr>
      <tr>
        <td class="label">분석기술인</td>
        <td colspan="3">${report.analyst || ''}</td>
        <td class="label">책임기술인</td>
        <td colspan="2">${report.chiefTech || ''}</td>
      </tr>
    </table>
    
    <!-- 종합의견 -->
    <table>
      <tr>
        <td class="section-title">종합의견</td>
      </tr>
      <tr>
        <td class="text-left" style="min-height: 80px; padding: 10px;">${report.opinion || ''}</td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
}
