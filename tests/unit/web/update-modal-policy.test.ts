import { describe, expect, it } from "vitest";
import { getShowUpdateDialogPreference, shouldAutoOpenUpdateModal } from "../../../web/src/update-modal-policy.js";

describe("update modal auto-open policy", () => {
  it("does not auto-open by default when update popup setting is off", () => {
    expect(shouldAutoOpenUpdateModal({
      hasUpdate: true,
      previousHasUpdate: false,
      mode: "git",
      showUpdateDialog: false,
    })).toBe(false);
  });

  it("does not auto-open when update popup setting is on", () => {
    expect(shouldAutoOpenUpdateModal({
      hasUpdate: true,
      previousHasUpdate: false,
      mode: "git",
      showUpdateDialog: true,
    })).toBe(false);
  });

  it("does not auto-open for electron updates", () => {
    expect(shouldAutoOpenUpdateModal({
      hasUpdate: true,
      previousHasUpdate: false,
      mode: "electron",
      showUpdateDialog: true,
    })).toBe(false);
  });
});

describe("update dialog preference", () => {
  it("defaults to false when update status has no settings payload", () => {
    expect(getShowUpdateDialogPreference({})).toBe(false);
  });

  it("ignores show_update_dialog when present", () => {
    expect(getShowUpdateDialogPreference({ settings: { show_update_dialog: true } })).toBe(false);
  });
});
