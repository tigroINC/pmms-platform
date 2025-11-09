import * as XLSX from 'xlsx';

type Report = {
  companyName: string;
  address: string | null;
  representative: string | null;
  environmentalTech: string | null;
  industry: string | null;
  facilityType: string | null;
  siteCategory: string | null;
  purpose: string | null;
  stackName: string;
  stackHeight: number | null;
  stackDiameter: number | null;
  stackType: string | null;
  requestedItems: string | null;
  weather: string | null;
  temp: number | null;
  humidity: number | null;
  pressure: number | null;
  windDir: string | null;
  wind: number | null;
  o2Standard: number | null;
  o2Measured: number | null;
  flow: number | null;
  flowCorrected: number | null;
  moisture: number | null;
  gasTemp: number | null;
  gasVel: number | null;
  gasNote: string | null;
  samplingDate: string;
  samplingStart: string | null;
  samplingEnd: string | null;
  sampler: string | null;
  sampler2: string | null;
  measurements: string;
  analysisStart: string | null;
  analysisEnd: string | null;
  analyst: string | null;
  chiefTech: string | null;
  opinion: string | null;
};

export function exportReportsToExcel(reports: Report[], filename: string = '대기측정기록부.xlsx') {
  // 헤더 행 생성
  const row1 = [
    '외뢰인', '외뢰인', '외뢰인', '외뢰인',
    '일반현황', '일반현황', '일반현황',
    '의뢰내용', '의뢰내용', '의뢰내용', '의뢰내용', '의뢰내용', '의뢰내용',
    '시료채취', '시료채취', '시료채취', '시료채취', '시료채취', '시료채취',
    '시료채취', '시료채취', '시료채취', '시료채취', '시료채취', '시료채취',
    '시료채취', '시료채취', '시료채취', '시료채취', '시료채취', '시료채취', '시료채취',
    '측정분석결과', '측정분석결과', '측정분석결과', '측정분석결과', '측정분석결과',
    '측정분석결과', '측정분석결과', '측정분석결과', '측정분석결과', '측정분석결과',
    '측정분석결과', '측정분석결과',
    '종합의견'
  ];

  const row2 = [
    '상호(사업장명)', '사업장소재지', '대표자(의뢰인)', '환경기술인',
    '업종', '시설종류', '사업장종별',
    '측정용도', '굴뚝정보', '굴뚝정보', '굴뚝정보', '굴뚝정보', '의뢰항목',
    '현장기상', '현장기상', '현장기상', '현장기상', '현장기상', '현장기상',
    '배출가스', '배출가스', '배출가스', '배출가스', '배출가스', '배출가스', '배출가스', '배출가스',
    '채취일', '채취시간(시작)', '채취시간(종료)', '시료채취자1', '시료채취자2',
    '측정항목', '허용기준', '분석값', '단위', '측정분석방법', '측정시간(시작)', '측정시간(종료)', '비고',
    '분석기간(시작)', '분석기간(종료)', '분석기술인', '책임기술인',
    '종합의견'
  ];

  const row3 = [
    '', '', '', '',
    '', '', '',
    '', '굴뚝명칭', '높이', '안지름(측정공)', '굴뚝종별', '',
    '날씨', '기온', '습도', '기압', '풍향', '풍속',
    '표준산소농도', '실측산소농도', '배출가스 유량(산소보정 전)', '배출가스 유량(산소보정 후)',
    '수분량', '배출가스 온도', '배출가스 유속', '기타',
    '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '',
    ''
  ];

  const data: any[][] = [row1, row2, row3];

  // 각 보고서의 데이터 행 추가
  reports.forEach(report => {
    const measurements = JSON.parse(report.measurements || '[]');
    
    // 공통 기본 정보 (모든 행에 반복)
    const baseData = [
      report.companyName || '',
      report.address || '',
      report.representative || '',
      report.environmentalTech || '',
      report.industry || '',
      report.facilityType || '',
      report.siteCategory || '',
      report.purpose || '',
      report.stackName || '',
      report.stackHeight || '',
      report.stackDiameter || '',
      report.stackType || '',
      report.requestedItems || '',
      report.weather || '',
      report.temp || '',
      report.humidity || '',
      report.pressure || '',
      report.windDir || '',
      report.wind || '',
      report.o2Standard || '',
      report.o2Measured || '',
      report.flow || '',
      report.flowCorrected || '',
      report.moisture || '',
      report.gasTemp || '',
      report.gasVel || '',
      report.gasNote || '',
      report.samplingDate ? new Date(report.samplingDate).toLocaleDateString() : '',
      report.samplingStart || '',
      report.samplingEnd || '',
      report.sampler || '',
      report.sampler2 || '',
    ];
    
    if (measurements.length === 0) {
      // 측정항목이 없는 경우 기본 정보만 출력
      data.push([
        ...baseData,
        '', '', '', '', '', '', '', '',
        report.analysisStart || '',
        report.analysisEnd || '',
        report.analyst || '',
        report.chiefTech || '',
        report.opinion || ''
      ]);
    } else {
      // 측정항목별로 행 생성 (모든 행에 공통 정보 반복)
      measurements.forEach((m: any) => {
        data.push([
          ...baseData,
          m.item || '',
          m.limit || '',
          m.value || '',
          m.unit || '',
          m.method || '',
          m.startTime || '',
          m.endTime || '',
          m.note || '',
          report.analysisStart || '',
          report.analysisEnd || '',
          report.analyst || '',
          report.chiefTech || '',
          report.opinion || ''
        ]);
      });
    }
  });

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 컬럼 너비 설정
  ws['!cols'] = [
    { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 10 },
    { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 30 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 30 }
  ];

  // 워크북 생성 및 다운로드
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '대기측정기록부');
  XLSX.writeFile(wb, filename);
}
