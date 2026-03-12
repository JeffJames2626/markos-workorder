export interface JobInfo {
  clientName: string;
  clientId: string;
  address: string;
  phone: string;
  serviceType: string;
  date: string;
  completed: "Y" | "N" | "P";
}

export interface TimerData {
  clockInTime: number | null;
  clockOutTime: number | null;
  billableSecs: number;
  pausedSecs: number;
}

export type PartSelection = Record<string, number>; // "Category||ItemName" → qty

export interface NotesData {
  zones: number | null;
  description: string;
  repairs: string;
}

export interface SignoffData {
  techSig: string;
  techSigDate: string;
  clientSig: string;
  clientSigDate: string;
  clientAbsent: boolean;
}

export interface WizardData {
  job: JobInfo;
  timer: TimerData;
  parts: PartSelection;
  notes: NotesData;
  signoff: SignoffData;
  techName: string;
}

export type Client = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
};


export const SERVICE_TYPES = [
  "Sprinkler Turn On",
  "Sprinkler Adjustment",
  "Sprinkler Repair",
  "Sprinkler Blowout",
  "Backflow Test",
] as const;

export const COMPLETED_OPTIONS = [
  { value: "Y", label: "Done" },
  { value: "N", label: "Return Visit" },
  { value: "P", label: "Partial" },
] as const;
