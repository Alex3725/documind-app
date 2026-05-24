export type OnboardingFolderOption = {
  id: string;
  label: string;
  icon: string;
  description: string;
  fullPath: string;
  color: string;
  autoTags: string[];
};

export const ONBOARDING_FOLDER_OPTIONS: OnboardingFolderOption[] = [
  {
    id: "personal",
    label: "Personale",
    icon: "👤",
    description: "Documenti di identità, anagrafe, famiglia",
    fullPath: "Personale",
    color: "#1b6f5c",
    autoTags: ["personale", "privato"],
  },
  {
    id: "work",
    label: "Lavoro",
    icon: "💼",
    description: "Contratti, buste paga, documenti aziendali",
    fullPath: "Lavoro",
    color: "#245c99",
    autoTags: ["lavoro", "professionale"],
  },
  {
    id: "finance",
    label: "Finanza",
    icon: "💰",
    description: "Fatture, ricevute, estratti conto",
    fullPath: "Finanza",
    color: "#d97706",
    autoTags: ["finanza", "contabilità"],
  },
  {
    id: "health",
    label: "Salute",
    icon: "🏥",
    description: "Referti, prescrizioni, documenti medici",
    fullPath: "Salute",
    color: "#0891b2",
    autoTags: ["salute", "medico"],
  },
  {
    id: "legal",
    label: "Legale",
    icon: "⚖️",
    description: "Atti, contratti, documenti notarili",
    fullPath: "Legale",
    color: "#7c3aed",
    autoTags: ["legale", "contratti"],
  },
  {
    id: "tech",
    label: "Tech",
    icon: "💻",
    description: "Manuali, codice, documentazione tecnica",
    fullPath: "Tech",
    color: "#16a34a",
    autoTags: ["tech", "documentazione"],
  },
];

export const DEFAULT_ONBOARDING_SELECTION = ["personal", "work"];

export function buildOnboardingFolderPayload(folderId: string) {
  const folder = ONBOARDING_FOLDER_OPTIONS.find((option) => option.id === folderId);
  if (!folder) {
    return null;
  }

  return {
    name: folder.label,
    fullPath: folder.fullPath,
    description: folder.description,
    icon: folder.icon,
    color: folder.color,
    autoTags: folder.autoTags,
    autoUpdateType: true,
  };
}
