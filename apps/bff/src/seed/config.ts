export const SEED_CONFIG = {
  fhirBaseUrl: process.env.FHIR_BASE_URL || 'http://localhost:5028/fhir',
  patientCount: 50,
  claimsPerPatient: { min: 3, max: 8 },
  priorAuthsPerPatient: { min: 0, max: 2 },
  providerCount: 100,
  yearStart: '2025-01-01',
  yearEnd: '2026-12-31',
};

export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function randomDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().split('T')[0];
}

