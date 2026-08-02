import type { AlertThresholds } from "./types";

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  ageingWarningHours: 24,
  overdueHours: 48,
  highValueOrderAmount: 500,
  backlogOpenOrders: 5,
  backlogIncreaseOrders: 2,
  lowInventoryUnits: 6,
  excessInventoryUnits: 80,
  lowVelocityUnits30d: 2,
  highValueCustomerAmount: 1_500,
  refundWindowDays: 7,
  refundCountThreshold: 2,
};
