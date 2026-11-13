export type ScanOutcome = "success" | "failure";
export type ScanAttempt = {
  id: string;
  scope: string;
  identity: string;
  premium: boolean;
};
let sequence = 0;
export const newScanAttemptId = () =>
  `${Date.now().toString(36)}-${++sequence}-${Math.random()
    .toString(36)
    .slice(2)}`;
