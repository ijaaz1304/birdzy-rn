/** Invalidated before async logout cleanup, while the old user object may still exist. */
let version = 0;
export const getAccountSessionVersion = () => version;
export const invalidateAccountSession = () => {
  version++;
};
