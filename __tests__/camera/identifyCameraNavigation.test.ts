import { useIdentificationEntryStore } from "../../src/features/camera/identificationEntry.store";
import {
  CLEAR_EXTERNAL_CAMERA_ROUTE_PARAMS,
  clearExternalCameraRouteParams,
  hasExternalCameraRouteParams,
  resolveCameraReturnTarget,
  resolveCameraReturnTargetFromRoute,
  resetCameraStackAfterExternalReturn,
  syncExternalCameraSessionOnFocus,
  resolveCropHostReturnTarget,
} from "../../src/features/camera/identifyCameraNavigation";

describe("resolveCameraReturnTargetFromRoute", () => {
  beforeEach(() => {
    useIdentificationEntryStore.getState().setExternalCameraReturnTarget(null);
  });

  it("returns null when route has no external return flags", () => {
    expect(resolveCameraReturnTargetFromRoute(undefined)).toBeNull();
    expect(resolveCameraReturnTargetFromRoute({})).toBeNull();
  });

  it("reads external targets from route params only", () => {
    expect(
      resolveCameraReturnTargetFromRoute({ returnImageToAskAI: true })
    ).toBe("askAi");
    expect(
      resolveCameraReturnTargetFromRoute({ returnImageToFeed: true })
    ).toBe("feed");
    expect(
      resolveCameraReturnTargetFromRoute({ returnImageToQuiz: true })
    ).toBe("quiz");
  });

  it("does not fall back to the identification entry store", () => {
    useIdentificationEntryStore.getState().setExternalCameraReturnTarget("askAi");
    expect(resolveCameraReturnTargetFromRoute({})).toBeNull();
  });
});

describe("resolveCameraReturnTarget", () => {
  beforeEach(() => {
    useIdentificationEntryStore.getState().setExternalCameraReturnTarget(null);
  });

  it("falls back to store when route params are empty", () => {
    useIdentificationEntryStore.getState().setExternalCameraReturnTarget("feed");
    expect(resolveCameraReturnTarget({})).toBe("feed");
  });

  it("prefers route params over store", () => {
    useIdentificationEntryStore.getState().setExternalCameraReturnTarget("feed");
    expect(
      resolveCameraReturnTarget({ returnImageToAskAI: true })
    ).toBe("askAi");
  });
});

describe("external camera route param cleanup", () => {
  it("detects truthy external flags", () => {
    expect(hasExternalCameraRouteParams({ returnImageToAskAI: true })).toBe(true);
    expect(hasExternalCameraRouteParams(CLEAR_EXTERNAL_CAMERA_ROUTE_PARAMS)).toBe(false);
  });

  it("clears stale flags with false (not undefined)", () => {
    const setParams = jest.fn();
    clearExternalCameraRouteParams({ setParams });
    expect(setParams).toHaveBeenCalledWith({
      returnImageToAskAI: false,
      returnImageToFeed: false,
      returnImageToQuiz: false,
      feedDraft: undefined,
    });
  });

  it("resets the camera stack to a clean CameraMain", () => {
    const reset = jest.fn();
    useIdentificationEntryStore.getState().setExternalCameraReturnTarget("askAi");
    resetCameraStackAfterExternalReturn({ reset });
    expect(useIdentificationEntryStore.getState().externalCameraReturnTarget).toBeNull();
    expect(reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: "CameraMain", params: { ...CLEAR_EXTERNAL_CAMERA_ROUTE_PARAMS } }],
    });
  });
});

describe("syncExternalCameraSessionOnFocus", () => {
  beforeEach(() => {
    useIdentificationEntryStore.getState().setExternalCameraReturnTarget(null);
  });

  it("restores route params from store during an active Ask AI session", () => {
    const setParams = jest.fn();
    useIdentificationEntryStore.getState().setExternalCameraReturnTarget("askAi");
    syncExternalCameraSessionOnFocus({ setParams }, { returnImageToFeed: false });
    expect(setParams).toHaveBeenCalledWith({ returnImageToAskAI: true });
  });

  it("clears stale store on an explicit identify entry", () => {
    const setParams = jest.fn();
    useIdentificationEntryStore.getState().setExternalCameraReturnTarget("askAi");
    syncExternalCameraSessionOnFocus(
      { setParams },
      { ...CLEAR_EXTERNAL_CAMERA_ROUTE_PARAMS }
    );
    expect(setParams).not.toHaveBeenCalled();
    expect(useIdentificationEntryStore.getState().externalCameraReturnTarget).toBeNull();
  });
});

describe("resolveCropHostReturnTarget", () => {
  it("keeps identify flow on analysis even if stale flags exist on crop route", () => {
    expect(
      resolveCropHostReturnTarget({
        returnTarget: "analysis",
        returnImageToAskAI: true,
      })
    ).toBe("analysis");
  });

  it("returns Ask AI when returnTarget and route flags agree", () => {
    expect(
      resolveCropHostReturnTarget({
        returnTarget: "askAi",
        returnImageToAskAI: true,
      })
    ).toBe("askAi");
  });

  it("returns Feed from returnTarget when route flags are missing", () => {
    expect(
      resolveCropHostReturnTarget({
        returnTarget: "feed",
      })
    ).toBe("feed");
  });
});
