export type MeasurementItem = {
  code: string; // optional ID like ITEM001
  name: string; // Korean display name
  unit: string; // e.g., 'ppm', 'mg/S㎥'
  defaultLimit: number; // default emission limit
};

export type MeasurementCategoryKey =
  | "dust_thc"
  | "heavy_metal"
  | "gases"
  | "btex"
  | "chlorinated"
  | "others";

export const CATEGORY_LABELS: Record<MeasurementCategoryKey, string> = {
  dust_thc: "먼지·THC",
  heavy_metal: "중금속",
  gases: "산화물·가스",
  btex: "BTEX",
  chlorinated: "염소계",
  others: "기타 유기화합물",
};

export const MEASUREMENT_ITEMS: Record<MeasurementCategoryKey, MeasurementItem[]> = {
  // 2개
  dust_thc: [
    { code: "ITEM001", name: "먼지", unit: "mg/S㎥", defaultLimit: 30 },
    { code: "ITEM002", name: "THC", unit: "ppm", defaultLimit: 50 },
  ],

  // 8개
  heavy_metal: [
    { code: "ITEM003", name: "카드뮴(Cd)", unit: "mg/S㎥", defaultLimit: 1.0 },
    { code: "ITEM004", name: "구리(Cu)", unit: "mg/S㎥", defaultLimit: 10.0 },
    { code: "ITEM005", name: "납(Pb)", unit: "mg/S㎥", defaultLimit: 5.0 },
    { code: "ITEM006", name: "니켈(Ni)", unit: "mg/S㎥", defaultLimit: 2.0 },
    { code: "ITEM007", name: "아연(Zn)", unit: "mg/S㎥", defaultLimit: 50.0 },
    { code: "ITEM008", name: "수은(Hg)", unit: "mg/S㎥", defaultLimit: 0.08 },
    { code: "ITEM009", name: "크롬(Cr)", unit: "mg/S㎥", defaultLimit: 1.5 },
    { code: "ITEM010", name: "비소(As)", unit: "mg/S㎥", defaultLimit: 1.0 },
  ],

  // 9개
  gases: [
    { code: "ITEM011", name: "황산화물(SOx)", unit: "ppm", defaultLimit: 100 },
    { code: "ITEM012", name: "질소산화물(NOx)", unit: "ppm", defaultLimit: 200 },
    { code: "ITEM013", name: "일산화탄소(CO)", unit: "ppm", defaultLimit: 50 },
    { code: "ITEM014", name: "불소화합물(HF)", unit: "mg/S㎥", defaultLimit: 10.0 },
    { code: "ITEM015", name: "염소(Cl₂)", unit: "ppm", defaultLimit: 5.0 },
    { code: "ITEM016", name: "염화수소(HCl)", unit: "ppm", defaultLimit: 30 },
    { code: "ITEM017", name: "시안화수소(HCN)", unit: "ppm", defaultLimit: 5.0 },
    { code: "ITEM018", name: "황화수소(H₂S)", unit: "ppm", defaultLimit: 10 },
    { code: "ITEM019", name: "암모니아(NH₃)", unit: "ppm", defaultLimit: 100 },
  ],

  // 4개
  btex: [
    { code: "ITEM020", name: "벤젠", unit: "ppm", defaultLimit: 5.0 },
    { code: "ITEM021", name: "톨루엔", unit: "ppm", defaultLimit: 30 },
    { code: "ITEM022", name: "에틸벤젠", unit: "ppm", defaultLimit: 50 },
    { code: "ITEM023", name: "자일렌", unit: "ppm", defaultLimit: 50 },
  ],

  // 8개
  chlorinated: [
    { code: "ITEM024", name: "디클로로메탄", unit: "ppm", defaultLimit: 50 },
    { code: "ITEM025", name: "클로로포름", unit: "ppm", defaultLimit: 20 },
    { code: "ITEM026", name: "사염화탄소", unit: "ppm", defaultLimit: 10 },
    { code: "ITEM027", name: "1,2-디클로로에탄", unit: "ppm", defaultLimit: 30 },
    { code: "ITEM028", name: "트리클로로에틸렌", unit: "ppm", defaultLimit: 100 },
    { code: "ITEM029", name: "테트라클로로에틸렌", unit: "ppm", defaultLimit: 50 },
    { code: "ITEM030", name: "1,1,1-트리클로로에탄", unit: "ppm", defaultLimit: 200 },
    { code: "ITEM031", name: "비닐클로라이드", unit: "ppm", defaultLimit: 10 },
  ],

  // 8개
  others: [
    { code: "ITEM032", name: "아크릴로니트릴", unit: "ppm", defaultLimit: 20 },
    { code: "ITEM033", name: "페놀", unit: "ppm", defaultLimit: 30 },
    { code: "ITEM034", name: "포름알데히드", unit: "ppm", defaultLimit: 10 },
    { code: "ITEM035", name: "아세트알데히드", unit: "ppm", defaultLimit: 20 },
    { code: "ITEM036", name: "스티렌", unit: "ppm", defaultLimit: 100 },
    { code: "ITEM037", name: "메틸에틸케톤(MEK)", unit: "ppm", defaultLimit: 200 },
    { code: "ITEM038", name: "메틸이소부틸케톤(MIBK)", unit: "ppm", defaultLimit: 150 },
    { code: "ITEM039", name: "아닐린", unit: "ppm", defaultLimit: 50 },
  ],
};

export const ALL_ITEMS_FLAT = Object.values(MEASUREMENT_ITEMS).flat();
