export type LocalBridgeAction = "firmware.plan" | "backup.plan" | "sounds.transfer-plan" | "profile.read" | "profile.write";

export type LocalBridgeRequest = {
  schema: "op1-studio-local-bridge";
  version: 1;
  action: LocalBridgeAction;
  machineWrite: false;
  requiresConfirmation: true;
  payload: Record<string, string | number | boolean>;
};

export function prepareLocalBridgeAction(action: LocalBridgeAction, payload: Record<string, string | number | boolean> = {}): LocalBridgeRequest {
  return {
    schema: "op1-studio-local-bridge",
    version: 1,
    action,
    machineWrite: false,
    requiresConfirmation: true,
    payload,
  };
}

export function describeLocalBridgeAction(request: LocalBridgeRequest): string {
  const labels: Record<LocalBridgeAction, string> = {
    "firmware.plan": "Plan firmware local préparé",
    "backup.plan": "Plan de sauvegarde local préparé",
    "sounds.transfer-plan": "Plan de transfert sonore local préparé",
    "profile.read": "Lecture du profil local préparée",
    "profile.write": "Écriture du profil local préparée",
  };
  return `${labels[request.action]}. Aucune écriture machine n’est exécutée.`;
}
