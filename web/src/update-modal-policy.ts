import type { UpdateStatus } from "../../shared/hooks/use-update-status";

interface UpdateModalAutoOpenInput {
  hasUpdate: boolean;
  previousHasUpdate: boolean;
  mode: UpdateStatus["proxy"]["mode"] | null;
  showUpdateDialog: boolean;
}

interface UpdateDialogPreferenceStatus {
  settings?: {
    show_update_dialog?: boolean;
  } | null;
}

export function getShowUpdateDialogPreference(_status: UpdateDialogPreferenceStatus | null | undefined): boolean {
  return false;
}

export function shouldAutoOpenUpdateModal(_input: UpdateModalAutoOpenInput): boolean {
  return false;
}
