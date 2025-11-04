export type Role = "admin" | "operator" | "customer";

export type Customer = {
  id: string;
  name: string;
};

export type MeasurementItem = {
  key: string; // ex) "dust" | "sox" ...
  name: string;
  unit: string;
  limit: number;
  category?: string;
  order?: number;
};

export type MeasurementRecord = {
  id: string;
  customerId: string;
  stack: string;
  itemKey: string;
  value: number;
  measuredAt: string; // ISO
};
