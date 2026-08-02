import type { AlertThresholds } from "./types";

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  overdueHours: 48,
  lowInventoryUnits: 6,
  excessInventoryUnits: 80,
  lowVelocityUnits30d: 2,
  highValueCustomerAmount: 1_500,
  refundWindowDays: 7,
  refundCountThreshold: 2,
};
