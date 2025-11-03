/**
 * CSV 파싱 유틸리티
 * 따옴표로 감싸진 필드 내부의 쉼표를 올바르게 처리합니다.
 */

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      // 연속된 두 개의 따옴표는 이스케이프된 따옴표
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // 다음 따옴표 건너뛰기
      } else {
        // 따옴표 시작/종료
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 따옴표 밖의 쉼표는 구분자
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // 마지막 필드 추가
  result.push(current.trim());
  
  return result;
}

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => parseCSVLine(line));
}
