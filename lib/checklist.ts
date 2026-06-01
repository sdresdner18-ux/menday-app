const CHECKLIST_BY_TYPE: Record<string, string[]> = {
  Magnet: [
    "Artwork received",
    "Artwork approved",
    "Production done",
    "Cutting done",
    "Packaged",
  ],
  Stand: [
    "Artwork received",
    "Client approved design",
    "File saved",
    "Cut",
    "Assembled",
    "Packaged",
    "Invoice sent",
  ],
  Mug: ["Artwork received", "Printed", "Packaged"],
  Keychain: [
    "Details confirmed",
    "Artwork received",
    "Production done",
    "Packaged",
  ],
  Other: [
    "Details confirmed",
    "Artwork received",
    "Production done",
    "Packaged",
  ],
};

export function getChecklistLabels(projectType: string): string[] {
  return CHECKLIST_BY_TYPE[projectType] ?? CHECKLIST_BY_TYPE.Other;
}
