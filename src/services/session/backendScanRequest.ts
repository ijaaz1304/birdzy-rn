import { useAuthStore } from "../../features/auth/auth.store";
import {
  aiUsagePayload,
  isAiLifetimeLimitError,
  clearBackendAiUsage,
  nextAiUsageRequest,
  updateBackendAiUsage,
} from "./backendAiUsage";

let observingSession = false;
let sessionGeneration = 0;
const identityOf = (state: ReturnType<typeof useAuthStore.getState>) =>
  state.user?.id ?? "";

export function captureBackendScanRequest() {
  // Register lazily to avoid evaluating the auth store while its API modules initialize.
  if (!observingSession && typeof useAuthStore.subscribe === "function") {
    observingSession = true;
    useAuthStore.subscribe((state, previous) => {
      if (
        identityOf(state) !== identityOf(previous) ||
        (!state.token && previous.token)
      ) {
        sessionGeneration++;
        clearBackendAiUsage();
      }
    });
  }
  const identity = identityOf(useAuthStore.getState());
  const generation = sessionGeneration;
  const request = nextAiUsageRequest();
  return (response: unknown) => {
    const current = useAuthStore.getState();
    // JWT refresh within this session is allowed; logout/account changes invalidate old requests.
    if (
      identityOf(current) !== identity ||
      sessionGeneration !== generation ||
      !current.token
    )
      return;
    updateBackendAiUsage(identity, response, request);
  };
}

/** Backend owns accounting, including unsuccessful requests. Never retry quota errors here. */
export async function withBackendScanUsage<T>(
  operation: () => Promise<T>
): Promise<T> {
  const receive = captureBackendScanRequest();
  try {
    const response = await operation();
    receive(response);
    if (isAiLifetimeLimitError(response)) {
      throw Object.assign(new Error("Free scan allowance reached"), {
        data: response,
        aiErrorCode: "E004",
      });
    }
    return response;
  } catch (error) {
    receive(aiUsagePayload(error));
    throw error;
  }
}
