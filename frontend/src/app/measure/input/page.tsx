"use client";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useCustomers } from "@/hooks/useCustomers";
import { useStacks } from "@/hooks/useStacks";
import { useMeasurementItems } from "@/hooks/useMeasurements";
import BulkUploadModal from "@/components/modals/BulkUploadModal";
import ResultModal from "@/components/modals/ResultModal";
import TempDataManagement from "@/components/TempDataManagement";
import HelpModal from "@/components/modals/HelpModal";
import AnomalyWarningModal from "@/components/modals/AnomalyWarningModal";
import { getMeasurementInputHelpSections } from "@/lib/help/measurementInputHelp";

type BulkRow = {
  stack: string;
  measuredAt: string;
  weather?: string;
  temp?: string;
  humidity?: string;
  pressure?: string;
  windDir?: string;
  wind?: string;
  gasVel?: string;
  gasTemp?: string;
  moisture?: string;
  o2Measured?: string;
  o2Standard?: string;
  flow?: string;
  pollutant: string;
  value: number;
  company?: string;
};

export default function MeasureInputPage() {
  const { user } = useAuth();
  const role = user?.role;

  // 탭 상태
  const [activeTab, setActiveTab] = useState<"field" | "temp" | "bulk">("field");

  const [ndAll, setNdAll] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set()); // 저장된 항목 추적
  
  // 현재 시간으로 초기화
  const getCurrentDateTime = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 5); // HH:mm
    return { dateStr, timeStr };
  };
  
  const { dateStr: initialDate, timeStr: initialTime } = getCurrentDateTime();
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const { list: customers } = useCustomers();
  const [customerSel, setCustomerSel] = useState("");
  const selectedCustomerId = useMemo(() => customers.find((c)=>c.name===customerSel)?.id, [customers, customerSel]);
  const { list: stacks } = useStacks(selectedCustomerId);
  const [stackSel, setStackSel] = useState("");
  const selectedStackId = useMemo(() => stacks.find((s)=>s.name===stackSel)?.id, [stacks, stackSel]);
  const [companySel, setCompanySel] = useState("보아스환경기술");
  const { items: apiItems } = useMeasurementItems();
  
  // 굴뚝별 측정 대상 항목
  const [stackItems, setStackItems] = useState<any[]>([]);
  const [loadingStackItems, setLoadingStackItems] = useState(false);

  // 굴뚝 선택 시 측정 대상 항목 로드
  useEffect(() => {
    if (selectedStackId) {
      fetchStackItems(selectedStackId);
    } else {
      setStackItems([]);
    }
  }, [selectedStackId]);

  const fetchStackItems = async (stackId: string) => {
    setLoadingStackItems(true);
    try {
      const res = await fetch(`/api/stacks/${stackId}/measurement-items`);
      const json = await res.json();
      console.log("API 응답 - 오염물질 순서:", 
        json.items?.filter((i: any) => i.category === "오염물질").map((i: any) => ({ name: i.name, order: i.order }))
      );
      console.log("API 응답 - 채취환경 순서:", 
        json.items?.filter((i: any) => i.category === "채취환경").map((i: any) => ({ name: i.name, order: i.order }))
      );
      // 활성화된 항목만 필터링 (API에서 이미 정렬되어 옴)
      const activeItems = (json.items || []).filter((item: any) => item.isActive);
      setStackItems(activeItems);
    } catch (err) {
      console.error("Failed to fetch stack items:", err);
      setStackItems([]);
    } finally {
      setLoadingStackItems(false);
    }
  };

  // Bulk upload modal state
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Anomaly warning modal state
  const [anomalyWarning, setAnomalyWarning] = useState<{
    isOpen: boolean;
    itemKey: string;
    itemName: string;
    inputValue: number;
    lowerBound: number;
    upperBound: number;
  } | null>(null);
  
  // Result modal state
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", type: "info" });

  const showResult = (title: string, message: string, type: "success" | "error" | "warning" | "info") => {
    setResultModal({ isOpen: true, title, message, type });
  };

  const closeResult = () => {
    setResultModal({ ...resultModal, isOpen: false });
  };
  // Bulk upload configuration
  const bulkUploadHeaders = [
    "배출구명","측정일자","기상","기온℃","습도％","기압mmHg","풍향","풍속m／sec","가스속도m／s","가스온도℃","수분함량％","실측산소농도％","표준산소농도％","배출가스유량S㎥／min","오염물질","농도","배출허용기준농도","배출허용기준체크","측정업체"
  ];
  const bulkUploadExample = [
    "C-ST01001","202501131125","맑음","4.0","33","769.9","북서","3.0","26.63","12","1.97","0","0","1713.8","먼지","0.7","30","","보아스환경기술"
  ];
  const handleBulkUpload = async (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      const text = await file.text();
      const { rows, error } = parseCSV(text);
      
      if (error || !rows) {
        const errorMsg = error || "CSV 파싱 실패";
        showResult("업로드 실패", errorMsg, "error");
        return { success: false, message: errorMsg };
      }
      
      const result = await uploadBulk(rows);
      
      // 결과 모달 표시
      if (result.success) {
        showResult("업로드 성공", result.message, "success");
      } else {
        showResult("업로드 실패", result.message, "error");
      }
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || "업로드 중 오류가 발생했습니다.";
      showResult("업로드 오류", errorMsg, "error");
      return { success: false, message: errorMsg };
    }
  };

  const parseCSV = (text: string): { rows: any[] | null; error?: string } => {
    const lines = text.split(/\r?\n/).filter((l)=>l.trim().length>0 && !l.startsWith("* "));
    if (lines.length === 0) {
      return { rows: null, error: "빈 파일입니다." };
    }
    let headerLineIdx = lines.findIndex((l)=> l.startsWith("배출구명,"));
    if (headerLineIdx < 0) {
      return { rows: null, error: "헤더 행을 찾을 수 없습니다." };
    }
    const header = lines[headerLineIdx].split(",");
    // Simple CSV split (assumes no quoted commas in source docs)
    const idx = (name: string) => header.findIndex((h)=>h.trim()===name);
    const ixStack = idx("배출구명");
    const ixDate = idx("측정일자");
    const ixWeather = idx("기상");
    const ixTemp = idx("기온℃");
    const ixHumidity = idx("습도％");
    const ixPressure = idx("기압mmHg");
    const ixWindDir = idx("풍향");
    const ixWind = idx("풍속m／sec");
    const ixGasVel = idx("가스속도m／s");
    const ixGasTemp = idx("가스온도℃");
    const ixMoisture = idx("수분함량％");
    const ixO2Measured = idx("실측산소농도％");
    const ixO2Standard = idx("표준산소농도％");
    const ixFlow = idx("배출가스유량S㎥／min");
    const ixPollutant = idx("오염물질");
    const ixValue = idx("농도");
    const ixCompany = idx("측정업체");
    const rows: BulkRow[] = [];
    for (let i=headerLineIdx+1; i<lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length < 16) continue;
      const stack = cols[ixStack]?.trim();
      const dt = cols[ixDate]?.trim();
      const pollutant = cols[ixPollutant]?.trim();
      const v = cols[ixValue]?.trim();
      if (!stack || !dt || !pollutant) continue;
      const valueNum = Number(v);
      if (!Number.isFinite(valueNum)) continue;
      rows.push({
        stack,
        measuredAt: dt,
        weather: cols[ixWeather]?.trim(),
        temp: cols[ixTemp]?.trim(),
        humidity: cols[ixHumidity]?.trim(),
        pressure: cols[ixPressure]?.trim(),
        windDir: cols[ixWindDir]?.trim(),
        wind: cols[ixWind]?.trim(),
        gasVel: cols[ixGasVel]?.trim(),
        gasTemp: cols[ixGasTemp]?.trim(),
        flow: cols[ixFlow]?.trim(),
        moisture: cols[ixMoisture]?.trim(),
        o2Measured: cols[ixO2Measured]?.trim(),
        o2Standard: cols[ixO2Standard]?.trim(),
        pollutant,
        value: valueNum,
        company: cols[ixCompany]?.trim(),
      });
    }
    return { rows };
  };
  const toISOFromYYYYMMDDhhmm = (s: string) => {
    if (!s || s.trim() === "") return new Date().toISOString();
    
    // 1. YYYYMMDDhhmm 형식 (예: 202501131125)
    let m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (m) {
      const [_, Y, M, D, h, m2] = m;
      const dt = new Date(Number(Y), Number(M)-1, Number(D), Number(h), Number(m2));
      return dt.toISOString();
    }
    
    // 2. YYYY-MM-DD HH:mm 형식 (예: 2025-01-13 11:25)
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (m) {
      const [_, Y, M, D, h, m2] = m;
      const dt = new Date(Number(Y), Number(M)-1, Number(D), Number(h), Number(m2));
      return dt.toISOString();
    }
    
    // 3. YYYY-MM-DD HH:mm:ss 형식 (예: 2025-01-13 11:25:30)
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (m) {
      const [_, Y, M, D, h, m2, s2] = m;
      const dt = new Date(Number(Y), Number(M)-1, Number(D), Number(h), Number(m2), Number(s2));
      return dt.toISOString();
    }
    
    // 4. YYYY/MM/DD HH:mm 형식 (예: 2025/01/13 11:25)
    m = s.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
    if (m) {
      const [_, Y, M, D, h, m2] = m;
      const dt = new Date(Number(Y), Number(M)-1, Number(D), Number(h), Number(m2));
      return dt.toISOString();
    }
    
    // 5. ISO 형식 시도 (예: 2025-01-13T11:25:30.000Z)
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      return dt.toISOString();
    }
    
    // 파싱 실패 시 현재 시간 반환
    console.warn(`날짜 파싱 실패: "${s}" - 현재 시간으로 대체됨`);
    return new Date().toISOString();
  };
  const uploadBulk = async (bulkRows: any[]): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      // map pollutant name to itemKey
      const nameToKey = new Map(apiItems.map((it:any)=>[it.name, it.key] as const));
      const toNum = (s?: string) => {
        if (s === undefined || s === null || s === "") return undefined;
        const n = Number(String(s).replace(/[^0-9.+-]/g, ""));
        return Number.isFinite(n) ? n : undefined;
      };
      const rows: { stack: string; itemKey: string; value: number | string; measuredAt: string }[] = [];
      for (const r of bulkRows) {
        const when = toISOFromYYYYMMDDhhmm(r.measuredAt);
        // pollutant
        rows.push({ stack: r.stack, itemKey: String(nameToKey.get(r.pollutant) || r.pollutant), value: r.value, measuredAt: when });
        // numeric aux
        const auxPairs: Array<[string, number|undefined]> = [
          ["temperature", toNum(r.temp)],
          ["humidity", toNum(r.humidity)],
          ["pressure", toNum(r.pressure)],
          ["wind_speed", toNum(r.wind)],
          ["gas_velocity", toNum(r.gasVel)],
          ["gas_temp", toNum(r.gasTemp)],
          ["moisture", toNum(r.moisture)],
          ["oxygen_measured", toNum(r.o2Measured)],
          ["oxygen_std", toNum(r.o2Standard)],
          ["flow_rate", toNum(r.flow)],
        ];
        for (const [k, v] of auxPairs) {
          if (v === undefined) continue;
          rows.push({ stack: r.stack, itemKey: k, value: v, measuredAt: when });
        }
        // 텍스트 타입 보조항목 (기상, 풍향)
        if (r.weather && r.weather.trim()) {
          rows.push({ stack: r.stack, itemKey: "weather", value: r.weather.trim(), measuredAt: when });
        }
        if (r.windDir && r.windDir.trim()) {
          rows.push({ stack: r.stack, itemKey: "wind_direction", value: r.windDir.trim(), measuredAt: when });
        }
      }
      const res = await fetch("/api/measurements/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      
      const json = await res.json();
      
      if (res.ok) {
        return {
          success: true,
          message: json.message || "업로드 성공",
          count: json.count,
        };
      } else {
        return {
          success: false,
          message: json.error || "업로드 실패",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "업로드 중 오류가 발생했습니다.",
      };
    }
  };

  const setValue = (key: string, v: string) => setValues((s) => ({ ...s, [key]: v }));

  const Status = ({ v, limit }: { v: string; limit: number }) => {
    const num = parseFloat(v);
    if (ndAll || v.toLowerCase() === "nd" || v === "") return <span className="text-xs text-gray-500">미입력</span>;
    if (isNaN(num)) return <span className="text-xs text-gray-500">-</span>;
    const ratio = num / limit;
    if (ratio > 1) return <span className="text-xs text-red-600">초과</span>;
    if (ratio >= 0.8) return <span className="text-xs text-orange-500">주의</span>;
    return <span className="text-xs text-green-600">정상</span>;
  };

  // 간단 검증: 날짜/시간 필수, 입력된 값은 숫자이며 0~999999 범위
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!date) e["__date"] = "날짜는 필수입니다";
    if (!time) e["__time"] = "시간은 필수입니다";
    Object.entries(values).forEach(([k, v]) => {
      if (!v) return; // 빈 값(미입력)은 허용
      // select 타입 항목은 숫자 검사 건너뛰기
      const item = stackItems.find(i => i.key === k);
      if (item?.inputType === "select" || item?.inputType === "text") return;
      
      const num = Number(v);
      if (!Number.isFinite(num)) e[k] = "숫자를 입력하세요";
      else if (num < 0 || num > 999999) e[k] = "0~999999 범위";
    });
    return e;
  }, [date, time, values, stackItems]);

  const hasErrors = Object.keys(errors).length > 0;

  const buildPayload = () => ({
    date,
    time,
    customer: customerSel,
    stack: stackSel,
    company: companySel,
    ndAll,
    values,
  });

  // 항목별 임시저장
  const handleItemTempSave = async (itemKey: string, skipValidation = false) => {
    if (role === "customer") return;
    
    if (!selectedCustomerId || !selectedStackId) {
      showResult("임시저장 실패", "고객사와 굴뚝을 선택해주세요.", "error");
      return;
    }

    const v = values[itemKey] ?? "";
    if (v === "") {
      showResult("임시저장 실패", "값을 입력해주세요.", "warning");
      return;
    }

    const item = stackItems.find(i => i.key === itemKey);
    const isAuxiliary = item?.category === "채취환경" || item?.category === "보조항목";
    
    // 채취환경 항목인 경우
    if (isAuxiliary) {
      try {
        const dt = new Date(date + "T" + (time || "00:00") + ":00");
        const auxiliaryData: any = { [itemKey]: v };
        
        // 채취환경 일괄 업데이트 API 호출
        const res = await fetch("/api/measurements-temp/auxiliary", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: selectedCustomerId,
            stackId: selectedStackId,
            measurementDate: dt.toISOString(),
            auxiliaryData,
          }),
        });

        const json = await res.json();

        if (res.ok) {
          setSavedItems(prev => new Set(prev).add(itemKey));
          showResult(
            "채취환경 저장 완료",
            (item?.name || itemKey) + " 항목이 저장되었습니다.\n동일 날짜/굴뚝의 " + json.updatedCount + "건 임시데이터에 적용되었습니다.",
            "success"
          );
        } else {
          showResult("저장 실패", json.error || "저장 중 오류가 발생했습니다.", "error");
        }
      } catch (error: any) {
        showResult("저장 오류", error.message || "저장 중 오류가 발생했습니다.", "error");
      }
      return;
    }
    
    // 오염물질 항목인 경우
    // select/text 타입이 아닌 경우만 숫자 검사
    if (item?.inputType !== "select" && item?.inputType !== "text") {
      const num = Number(v);
      if (!Number.isFinite(num)) {
        showResult("임시저장 실패", "올바른 숫자를 입력해주세요.", "error");
        return;
      }
      
      // 이상치 검증 (skipValidation이 false일 때만)
      if (!skipValidation) {
        try {
          const validationRes = await fetch('http://localhost:8000/api/validate-measurement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_id: selectedCustomerId,
              stack: stackSel,
              item_key: itemKey,
              value: num
            })
          });
          
          const validationData = await validationRes.json();
          
          if (validationData.anomaly_detected) {
            // 이상치 감지 시 모달 표시
            setAnomalyWarning({
              isOpen: true,
              itemKey,
              itemName: item?.name || itemKey,
              inputValue: num,
              lowerBound: validationData.details.lower_bound,
              upperBound: validationData.details.upper_bound
            });
            return; // 저장 중단
          }
        } catch (validationError) {
          console.warn('검증 실패, 저장 계속 진행:', validationError);
          // 검증 실패 시에도 저장은 계속 진행
        }
      }
    }

    try {
      const dt = new Date(date + "T" + (time || "00:00") + ":00");
      
      // select/text 타입은 문자열 그대로, 아니면 숫자로 변환
      const value = (item?.inputType === "select" || item?.inputType === "text") ? v : Number(v);
      
      const measurements = [{
        itemKey,
        value: value,
        unit: item?.unit || "",
      }];

      // 최신 채취환경 값 가져오기
      const auxiliaryData: any = {};
      stackItems
        .filter(i => i.category === "채취환경" || i.category === "보조항목")
        .forEach(i => {
          const auxValue = values[i.key];
          if (auxValue) {
            auxiliaryData[i.key] = auxValue;
          }
        });
      if (companySel) auxiliaryData.company = companySel;

      const res = await fetch("/api/measurements-temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          stackId: selectedStackId,
          measurementDate: dt.toISOString(),
          measurements,
          auxiliaryData: Object.keys(auxiliaryData).length > 0 ? auxiliaryData : null,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setSavedItems(prev => new Set(prev).add(itemKey));
        showResult(
          savedItems.has(itemKey) ? "재저장 완료" : "임시저장 완료",
          (item?.name || itemKey) + " 항목이 임시 저장되었습니다.\n임시 ID: " + json.tempId,
          "success"
        );
      } else {
        showResult("저장 실패", json.error || "임시저장 중 오류가 발생했습니다.", "error");
      }
    } catch (error: any) {
      showResult("저장 오류", error.message || "임시저장 중 오류가 발생했습니다.", "error");
    }
  };

  const handleTempSave = async () => {
    if (role === "customer") return;
    if (hasErrors) {
      showResult("임시저장 실패", "유효성 오류를 먼저 해결해 주세요.", "error");
      return;
    }
    
    if (!selectedCustomerId || !selectedStackId) {
      showResult("임시저장 실패", "고객사와 굴뚝을 선택해주세요.", "error");
      return;
    }

    try {
      const dt = new Date(date + "T" + (time || "00:00") + ":00");
      
      // 측정값 배열 구성 (오염물질만)
      const measurements: any[] = [];
      // 보조 데이터 (채취환경)
      const auxiliaryData: any = {};
      
      Object.entries(values).forEach(([key, v]) => {
        if (v !== "" && !ndAll) {
          const item = stackItems.find(i => i.key === key);
          
          // 채취환경 항목인지 확인
          if (item?.category === "채취환경" || item?.category === "보조항목") {
            // 채취환경은 auxiliaryData에 저장
            auxiliaryData[key] = v;
          } else {
            // 오염물질은 measurements 배열에 저장
            const num = Number(v);
            if (Number.isFinite(num)) {
              measurements.push({
                itemKey: key,
                value: num,
                unit: item?.unit || "",
              });
            }
          }
        }
      });

      if (measurements.length === 0 && Object.keys(auxiliaryData).length === 0) {
        showResult("임시저장 실패", "저장할 측정값이 없습니다.", "warning");
        return;
      }

      // 메타 데이터 추가
      if (companySel) auxiliaryData.company = companySel;
      if (ndAll) auxiliaryData.ndAll = true;

      const res = await fetch("/api/measurements-temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          stackId: selectedStackId,
          measurementDate: dt.toISOString(),
          measurements,
          auxiliaryData: Object.keys(auxiliaryData).length > 0 ? auxiliaryData : null,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        showResult(
          "임시저장 완료",
          "임시 ID: " + json.tempId + "\n\n💡 임시 저장된 데이터는:\n- 측정 이력 및 대시보드에 반영되지 않습니다\n- [임시데이터관리] 탭에서 다운로드하여 검증 후\n- [확정일괄업로드] 탭으로 확정 등록하세요",
          "success"
        );
        // 폼 초기화
        setValues({});
        setNdAll(false);
      } else {
        showResult("임시저장 실패", json.error || "임시저장 중 오류가 발생했습니다.", "error");
      }
    } catch (error: any) {
      showResult("임시저장 오류", error.message || "임시저장 중 오류가 발생했습니다.", "error");
    }
  };

  const handleSave = async () => {
    if (role === "customer") return;
    if (hasErrors) {
      showResult("저장 실패", "유효성 오류를 먼저 해결해 주세요.", "error");
      return;
    }
    
    // 정식 저장은 임시저장 API를 사용하도록 변경
    alert("정식 저장 기능은 임시저장 후 확정일괄업로드를 사용해주세요.");
    return;
    
    /* 기존 개별 저장 방식은 채취환경 항목 처리 문제로 비활성화
    try {
      const dt = new Date(`${date}T${time || "00:00"}:00`);
      const bodyBase = { customerId: selectedCustomerId as string | undefined, stack: stackSel, measuredAt: dt.toISOString() };
      const entries = Object.entries(values).filter(([_, v]) => v !== "" && !ndAll);
      if (entries.length === 0) {
        showResult("저장 실패", "저장할 값이 없습니다.", "warning");
        return;
      }
      let okCount = 0;
      let failCount = 0;
      for (const [key, v] of entries) {
        const item = stackItems.find(i => i.key === key);
        // select/text 타입은 문자열 그대로, 아니면 숫자로 변환
        let value: any;
        if (item?.inputType === "select" || item?.inputType === "text") {
          value = v;
        } else {
          const num = Number(v);
          if (!Number.isFinite(num)) continue;
          value = num;
        }
        
        // key는 이제 itemKey 자체 (예: "dust", "sox" 등)
        const res = await fetch("/api/measurements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...bodyBase, itemKey: key, value: value, measuredAt: dt.toISOString() }),
        });
        if (res.ok) okCount += 1;
        else failCount += 1;
      }
      
      // 결과 모달 표시
      if (failCount === 0) {
        showResult("저장 완료", `${okCount}건의 측정 데이터가 저장되었습니다.`, "success");
      } else if (okCount === 0) {
        showResult("저장 실패", `${failCount}건의 데이터 저장에 실패했습니다.`, "error");
      } else {
        showResult("부분 저장 완료", `${okCount}건 저장 완료, ${failCount}건 실패`, "warning");
      }
    } catch (e) {
      showResult("저장 오류", "저장 중 오류가 발생했습니다.", "error");
    }
    */
  };

  return (
    <section className="space-y-3">
      {/* Compact Header - 제목과 탭 한 줄 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-wrap items-end gap-2">
            <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">측정 입력</h1>
            <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
            
            {/* 탭 */}
            <div className="flex gap-2 mb-1.5">
            <button
              onClick={() => setActiveTab("field")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === "field"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              📝 현장임시입력
            </button>
            <button
              onClick={() => setActiveTab("temp")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === "temp"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              📊 임시데이터관리
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === "bulk"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              📤 확정일괄업로드
            </button>
          </div>
          </div>
          
          {/* 도움말 버튼 */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded mb-1.5"
          >
            ❓ 도움말
          </button>
        </div>
      </div>

      {role === "customer" && activeTab !== "temp" && (
        <div className="rounded-md border p-3 text-sm bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200">
          고객사 사용자는 측정 데이터 입력 권한이 없습니다. 조회 기능을 이용해 주세요.
        </div>
      )}

      {/* 현장임시입력 탭 */}
      {activeTab === "field" && (
        <div className="grid grid-cols-12 gap-4">
        {/* Sidebar: Filters - 반응형 */}
        <aside className="col-span-12 md:col-span-2 rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-4">
          <h2 className="text-base font-semibold">측정 정보</h2>
          <div className="space-y-4">
            {/* 측정일 */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm">측정일</label>
              <Input
                type="date"
                value={date}
                onChange={(e)=>setDate((e.target as HTMLInputElement).value)}
                className={`w-full text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-700 ${errors["__date"]?"border-red-500":""}`}
                disabled={role === "customer"}
              />
              {errors["__date"] && <div className="text-xs text-red-400 mt-1">{errors["__date"]}</div>}
            </div>
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm">고객사</label>
              <Select className="w-full text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-700" value={customerSel} onChange={(e)=>setCustomerSel((e.target as HTMLSelectElement).value)} disabled={role === "customer"}>
                <option value="" disabled>선택</option>
                {customers.map((c)=>(
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm">굴뚝</label>
              <Select className="w-full text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-700" value={stackSel} onChange={(e)=>setStackSel((e.target as HTMLSelectElement).value)} disabled={role === "customer" || !selectedCustomerId}>
                <option value="" disabled>{selectedCustomerId ? "선택" : "고객사 선택 필요"}</option>
                {stacks.map((s)=>(
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm">측정업체</label>
              <Select className="w-full text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-700" value={companySel} onChange={(e)=>setCompanySel((e.target as HTMLSelectElement).value)} disabled={role === "customer"}>
                <option value="보아스환경기술">보아스환경기술</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm flex items-center gap-2">
                <input type="checkbox" checked={ndAll} onChange={(e) => setNdAll(e.target.checked)} disabled={role === "customer"} className="accent-blue-500" /> 불검출(전체)
              </label>
              {ndAll && (
                <div className="text-xs rounded-md border border-blue-900/30 bg-blue-900/20 text-blue-200 p-2">
                  불검출(전체) 모드가 활성화되어 항목 값 입력이 비활성화됩니다.
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main: Form */}
        <main className="col-span-12 md:col-span-10">
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 space-y-6">
            {!selectedStackId ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">🏭 굴뚝을 선택하세요</p>
                <p className="text-sm">고객사와 굴뚝을 선택하면 측정 대상 항목이 표시됩니다.</p>
              </div>
            ) : loadingStackItems ? (
              <div className="text-center py-12 text-gray-500">
                로딩 중...
              </div>
            ) : stackItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">측정 이력이 없습니다.</p>
                <p className="text-sm">측정 데이터를 입력하면 자동으로 항목이 표시됩니다.</p>
              </div>
            ) : (
              <>
                {/* 채취환경 (상단 배치) */}
                {stackItems.filter(item => item.category === "채취환경" || item.category === "보조항목").length > 0 && (
                  <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-base font-semibold mb-3">🌡️ 채취환경</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {stackItems
                        .filter(item => item.category === "채취환경" || item.category === "보조항목")
                        .map((item) => {
                          const key = item.key;
                          const v = values[key] ?? "";
                          const isSelect = item.inputType === "select";
                          const options = isSelect && item.options ? JSON.parse(item.options) : [];
                          
                          return (
                            <div key={key} className="flex items-center gap-1.5">
                              <div className="w-20 text-xs font-medium leading-tight line-clamp-2">{item.name}</div>
                              {isSelect ? (
                                <select
                                  className={`w-20 px-2 py-1 text-center text-sm border rounded ${errors[key]?"border-red-500":"border-gray-300"} bg-white dark:bg-gray-700`}
                                  value={v}
                                  onChange={(e) => setValue(key, e.target.value)}
                                  disabled={role === "customer"}
                                >
                                  <option value="">선택</option>
                                  {options.map((opt: string) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <Input
                                  type="text"
                                  className={`w-20 px-2 py-1 text-center text-sm ${errors[key]?"border-red-500":""}`}
                                  placeholder="값"
                                  value={v}
                                  onChange={(e) => setValue(key, (e.target as HTMLInputElement).value)}
                                  disabled={role === "customer"}
                                />
                              )}
                              {errors[key] && <div className="text-xs text-red-600">{errors[key]}</div>}
                              <div className="text-xs text-gray-500 w-12">{item.unit}</div>
                              <button
                                className="px-2 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50"
                                disabled={role === "customer"}
                                onClick={() => handleItemTempSave(key)}
                              >
                                {savedItems.has(key) ? "재저장" : "임시저장"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 오염물질 항목 */}
                {stackItems.filter(item => item.category === "오염물질").length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold mb-3">🏭 오염물질</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {stackItems
                        .filter(item => item.category === "오염물질")
                        .map((item) => {
                          const key = item.key;
                          const v = values[key] ?? "";
                          return (
                            <div key={key} className="flex items-center gap-1.5">
                              <div className="w-20 text-xs font-medium leading-tight line-clamp-2">{item.name}</div>
                              <Input
                                type="text"
                                className={`w-20 px-2 py-1 text-center text-sm ${errors[key]?"border-red-500":""}`}
                                placeholder={ndAll ? "ND" : "값"}
                                value={ndAll ? "" : v}
                                onChange={(e) => setValue(key, (e.target as HTMLInputElement).value)}
                                disabled={ndAll || role === "customer"}
                              />
                              {errors[key] && <div className="text-xs text-red-600">{errors[key]}</div>}
                              <div className="text-xs text-gray-500 w-12">{item.unit}</div>
                              <div className="text-xs text-gray-500 w-16">기준 {item.limit}</div>
                              <div className="w-12">
                                <Status v={v} limit={item.limit} />
                              </div>
                              <button
                                className="px-2 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50"
                                disabled={role === "customer"}
                                onClick={() => handleItemTempSave(key)}
                              >
                                {savedItems.has(key) ? "재저장" : "임시저장"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            )}
            {hasErrors && (
              <div className="mt-4 text-xs rounded-md border border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-200 p-2">
                유효성 오류 {Object.keys(errors).length}개가 있습니다. 빨간 표시된 필드를 확인해 주세요.
              </div>
            )}
          </div>
        </main>
        </div>
      )}

      {/* 임시데이터관리 탭 */}
      {activeTab === "temp" && <TempDataManagement />}

      {/* 확정일괄업로드 탭 */}
      {activeTab === "bulk" && (
        <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">확정 일괄업로드</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  검증이 완료된 측정 데이터를 일괄 업로드하여 확정 등록합니다.
                </p>
              </div>
              <Button size="sm" variant="primary" onClick={() => setShowBulkUploadModal(true)}>
                📤 파일 업로드
              </Button>
            </div>

            <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/20 p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 업로드 안내</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• [임시데이터관리] 탭에서 다운로드한 Excel 파일을 그대로 사용할 수 있습니다</li>
                <li>• 업로드된 데이터는 즉시 확정되어 측정 이력 및 대시보드에 반영됩니다</li>
                <li>• 측정일자는 YYYYMMDDhhmm 형식(예: 202501131125) 또는 YYYY-MM-DD HH:mm 형식을 지원합니다</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        title="측정 데이터 일괄업로드"
        templateHeaders={bulkUploadHeaders}
        exampleRow={bulkUploadExample}
        templateFileName="측정데이터_업로드_양식.csv"
        onUpload={handleBulkUpload}
        parseInstructions="양식에 맞게 작성한 CSV 파일을 업로드하세요. 측정일자는 YYYYMMDDhhmm 형식(예: 202501131125) 또는 YYYY-MM-DD HH:mm 형식을 지원합니다."
      />

      {/* Result Modal */}
      <ResultModal
        isOpen={resultModal.isOpen}
        onClose={closeResult}
        title={resultModal.title}
        message={resultModal.message}
        type={resultModal.type}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        title="측정 입력 도움말"
        sections={getMeasurementInputHelpSections()}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Anomaly Warning Modal */}
      {anomalyWarning && (
        <AnomalyWarningModal
          isOpen={anomalyWarning.isOpen}
          onClose={() => setAnomalyWarning(null)}
          onConfirm={() => {
            // 검증 우회하고 저장
            handleItemTempSave(anomalyWarning.itemKey, true);
            setAnomalyWarning(null);
          }}
          inputValue={anomalyWarning.inputValue}
          lowerBound={anomalyWarning.lowerBound}
          upperBound={anomalyWarning.upperBound}
          itemName={anomalyWarning.itemName}
        />
      )}
    </section>
  );
}
