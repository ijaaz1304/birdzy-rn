import AsyncStorage from "@react-native-async-storage/async-storage";

export const FREE_SCAN_LIMIT = 30;
export const FREE_FAILURE_GRACE = 5;
export const SCAN_ALLOWANCE_STORAGE_PREFIX = "@scan-allowance:v2:";
const LAST_IDENTITY_KEY = `${SCAN_ALLOWANCE_STORAGE_PREFIX}last-identity`;
const LEGACY_OWNER_KEY = `${SCAN_ALLOWANCE_STORAGE_PREFIX}legacy-owner`;

type Identity = {
  accountId?: string | null;
  guestId?: string | null;
  isGuest: boolean;
};
type Ledger = {
  used: number;
  failures: number;
  completed: string[];
  transferredTo?: string;
};
export type ScanOutcome = "success" | "failure";
export type ScanAttempt = {
  id: string;
  scope: string;
  identity: string;
  premium: boolean;
};
export type ScanAllowance = {
  used: number;
  failures: number;
  remaining: number;
  scope: string;
};
export type ScanStart =
  | { status: "ready"; attempt: ScanAttempt }
  | { status: "blocked" | "busy" };
let sequence = 0;
export const newScanAttemptId = () =>
  `${Date.now().toString(36)}-${++sequence}-${Math.random()
    .toString(36)
    .slice(2)}`;
const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
const empty = (): Ledger => ({ used: 0, failures: 0, completed: [] });
export const isScanAllowanceStorageKey = (key: string) =>
  key.startsWith(SCAN_ALLOWANCE_STORAGE_PREFIX);

/** Client fallback only. Cross-device enforcement requires an authoritative backend ledger. */
export function createScanAllowance(options: {
  getIdentity: () => Identity;
  readLegacyUsage: () => Promise<number>;
  /** Successful identifications cost one scan by default. */
  chargeSuccessfulScans?: boolean;
}) {
  let queue: Promise<unknown> = Promise.resolve();
  const active = new Map<string, ScanAttempt>();
  const listeners = new Set<() => void>();
  const scopeNow = () => {
    const identity = options.getIdentity();
    if (!identity.isGuest && identity.accountId)
      return `account:${identity.accountId}`;
    return `guest:${identity.guestId || identity.accountId || "device"}`;
  };
  const key = (scope: string) =>
    `${SCAN_ALLOWANCE_STORAGE_PREFIX}${encodeURIComponent(scope)}`;
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const result = queue.then(work, work);
    queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  };
  const notify = () =>
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        /* Observers cannot roll back a committed scan. */
      }
    });
  const write = async (scope: string, ledger: Ledger) =>
    AsyncStorage.setItem(key(scope), JSON.stringify(ledger));
  const read = async (scope: string): Promise<Ledger> => {
    const raw = await AsyncStorage.getItem(key(scope));
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Partial<Ledger>;
      if (
        !Array.isArray(parsed.completed) ||
        typeof parsed.used !== "number" ||
        !Number.isFinite(parsed.used) ||
        typeof parsed.failures !== "number" ||
        !Number.isFinite(parsed.failures)
      )
        throw new Error("Cannot read scan allowance. Please try again.");
      return {
        used: Math.min(FREE_SCAN_LIMIT, count(parsed.used)),
        failures: count(parsed.failures),
        completed: parsed.completed.filter(
          (id): id is string => typeof id === "string"
        ),
        transferredTo:
          typeof parsed.transferredTo === "string"
            ? parsed.transferredTo
            : undefined,
      };
    }
    const ledger = empty();
    const owner = await AsyncStorage.getItem(LEGACY_OWNER_KEY);
    if (!owner || owner === scope) {
      const legacy = Math.min(
        FREE_SCAN_LIMIT,
        count(await options.readLegacyUsage())
      );
      if (legacy > 0) {
        // The legacy device counter has no account metadata: assign it once, never to every account.
        await AsyncStorage.setItem(LEGACY_OWNER_KEY, scope);
        ledger.used = legacy;
      }
    }
    await write(scope, ledger);
    return ledger;
  };
  const resolve = async (): Promise<{ scope: string; identity: string }> => {
    const scope = scopeNow();
    const previous = await AsyncStorage.getItem(LAST_IDENTITY_KEY);
    if (
      scope.startsWith("account:") &&
      previous?.startsWith("guest:") &&
      previous !== scope
    ) {
      const guest = await read(previous);
      const account = await read(scope);
      if (scopeNow() !== scope) return resolve();
      if (!guest.transferredTo) {
        // Both ledgers may have used their own failure grace. The merged identity gets only five.
        const extraFailures =
          Math.max(0, guest.failures + account.failures - FREE_FAILURE_GRACE) -
          Math.max(0, guest.failures - FREE_FAILURE_GRACE) -
          Math.max(0, account.failures - FREE_FAILURE_GRACE);
        const marker = `guest-transfer:${previous}`;
        if (!account.completed.includes(marker)) {
          account.used = Math.min(
            FREE_SCAN_LIMIT,
            account.used + guest.used + extraFailures
          );
          account.failures += guest.failures;
          account.completed = [
            ...new Set([...account.completed, ...guest.completed, marker]),
          ];
          await write(scope, account);
        }
        // Destination is written first. Its durable marker makes retrying this transfer idempotent.
        guest.transferredTo = scope;
        await write(previous, guest);
      }
    }
    // A logged-out transient screen must not turn the last signed-in identity into a new guest.
    if (scopeNow() !== scope) return resolve();
    const identity = options.getIdentity();
    if (identity.accountId || identity.guestId)
      await AsyncStorage.setItem(LAST_IDENTITY_KEY, scope);
    const ledger = await read(scope);
    // A promoted guest cannot evade that account's limit by re-entering the same guest identity.
    if (scopeNow() !== scope) return resolve();
    return {
      identity: scope,
      scope:
        scope.startsWith("guest:") && ledger.transferredTo
          ? ledger.transferredTo
          : scope,
    };
  };
  const display = (scope: string, ledger: Ledger): ScanAllowance => ({
    scope,
    used: ledger.used,
    failures: ledger.failures,
    remaining: Math.max(0, FREE_SCAN_LIMIT - ledger.used),
  });
  const currentLedger = async (): Promise<{
    scope: string;
    identity: string;
    ledger: Ledger;
  }> => {
    const resolved = await resolve();
    const ledger = await read(resolved.scope);
    return scopeNow() === resolved.identity
      ? { ...resolved, ledger }
      : currentLedger();
  };
  const premiumValue = (value: boolean | (() => boolean)) =>
    typeof value === "function" ? value() : value;
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    currentScope: scopeNow,
    get: () =>
      serial(async () => {
        const { scope, ledger } = await currentLedger();
        return display(scope, ledger);
      }),
    begin: (
      id: string,
      premium: boolean | (() => boolean)
    ): Promise<ScanStart> =>
      serial(async () => {
        const { scope, identity, ledger } = await currentLedger();
        const isPremium = premiumValue(premium);
        if (!isPremium && ledger.used >= FREE_SCAN_LIMIT)
          return { status: "blocked" };
        if (active.has(scope) || ledger.completed.includes(id))
          return { status: "busy" };
        const attempt = { id, scope, identity, premium: isPremium };
        active.set(scope, attempt);
        return { status: "ready", attempt };
      }),
    complete: (
      attempt: ScanAttempt,
      outcome: ScanOutcome,
      premiumNow: boolean | (() => boolean) = false
    ): Promise<ScanAllowance> =>
      serial(async () => {
        try {
          const ledger = await read(attempt.scope);
          if (
            active.get(attempt.scope) !== attempt ||
            scopeNow() !== attempt.identity ||
            attempt.premium ||
            premiumValue(premiumNow) ||
            ledger.completed.includes(attempt.id) ||
            ledger.used >= FREE_SCAN_LIMIT
          )
            return display(attempt.scope, ledger);
          if (outcome === "success" && options.chargeSuccessfulScans === false)
            return display(attempt.scope, ledger);
          if (outcome === "failure") ledger.failures += 1;
          if (outcome === "success" || ledger.failures > FREE_FAILURE_GRACE)
            ledger.used = Math.min(FREE_SCAN_LIMIT, ledger.used + 1);
          ledger.completed.push(attempt.id);
          await write(attempt.scope, ledger);
          notify();
          return display(attempt.scope, ledger);
        } finally {
          if (active.get(attempt.scope) === attempt)
            active.delete(attempt.scope);
        }
      }),
    cancel(attempt: ScanAttempt) {
      if (active.get(attempt.scope) === attempt) active.delete(attempt.scope);
    },
  };
}
