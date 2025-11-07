/**
 * 측정항목 키 매핑
 * Item 테이블의 key 값과 Measurement 테이블의 개별 필드를 매핑
 */

// 채취환경 항목: Item.key -> Measurement 필드명
export const AUXILIARY_FIELD_MAP: Record<string, string> = {
  'weather': 'weather',
  'temperature': 'temperatureC',
  'humidity': 'humidityPct',
  'pressure': 'pressureMmHg',
  'wind_direction': 'windDirection',
  'wind_speed': 'windSpeedMs',
  'gas_velocity': 'gasVelocityMs',
  'gas_temp': 'gasTempC',
  'moisture': 'moisturePct',
  'oxygen_measured': 'oxygenMeasuredPct',
  'oxygen_std': 'oxygenStdPct',
  'flow': 'flowSm3Min',
};

// Measurement 필드명 -> Item.key (역방향)
export const FIELD_TO_ITEM_KEY: Record<string, string> = {
  'weather': 'weather',
  'temperatureC': 'temperature',
  'humidityPct': 'humidity',
  'pressureMmHg': 'pressure',
  'windDirection': 'wind_direction',
  'windSpeedMs': 'wind_speed',
  'gasVelocityMs': 'gas_velocity',
  'gasTempC': 'gas_temp',
  'moisturePct': 'moisture',
  'oxygenMeasuredPct': 'oxygen_measured',
  'oxygenStdPct': 'oxygen_std',
  'flowSm3Min': 'flow',
};

// 채취환경 항목인지 확인
export function isAuxiliaryItem(itemKey: string): boolean {
  return itemKey in AUXILIARY_FIELD_MAP;
}

// Item.key -> Measurement 필드명
export function getFieldName(itemKey: string): string | null {
  return AUXILIARY_FIELD_MAP[itemKey] || null;
}

// Measurement 필드명 -> Item.key
export function getItemKey(fieldName: string): string | null {
  return FIELD_TO_ITEM_KEY[fieldName] || null;
}
