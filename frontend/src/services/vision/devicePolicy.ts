/** Recognition labels are not sale/material categories. Thresholds are provisional. */
export const DEVICE_NAMES = ['PCB', 'Battery', 'CRT', 'FlatPanel', 'Keyboard', 'Smartphone', 'Tablet', 'Laptop', 'HDD', 'Mouse', 'BarPhone'] as const;
export type DeviceName = typeof DEVICE_NAMES[number];
export interface DeviceDetection { name: DeviceName; score: number; box: [number, number, number, number] }
export interface DeviceSuggestion {
  status: 'SUGGESTION' | 'UNCERTAIN' | 'UNAVAILABLE';
  objects: DeviceDetection[];
  requiresConfirmation: true;
  clarification?: 'PHONE_OR_TABLET';
}
// Confirmed field failure: this candidate confuses tablets with smartphones.
// Apply to ALL such predictions, not the filename/photo used to discover it.
const WEAK = new Set<DeviceName>(['CRT', 'Smartphone', 'Tablet', 'HDD', 'BarPhone']);
export function isPhoneOrTablet(name: DeviceName) { return name === 'Smartphone' || name === 'Tablet'; }
export function deviceDisplayLabel(name: DeviceName, language: 'hi' | 'mr' | 'en') {
  return isPhoneOrTablet(name)
    ? {en:'Phone or tablet — please confirm',hi:'फोन या टैबलेट — कृपया पुष्टि करें',mr:'फोन किंवा टॅबलेट — कृपया निश्चित करा'}[language]
    : DEVICE_LABELS[name][language];
}
export const DEVICE_LABELS: Record<DeviceName, {en: string; hi: string; mr: string}> = {
  PCB: {en:'Circuit board',hi:'सर्किट बोर्ड',mr:'सर्किट बोर्ड'},
  Battery: {en:'Battery',hi:'बैटरी',mr:'बॅटरी'},
  CRT: {en:'CRT television / monitor',hi:'CRT टीवी / मॉनिटर',mr:'CRT टीव्ही / मॉनिटर'},
  FlatPanel: {en:'Flat-panel screen',hi:'फ्लैट-पैनल स्क्रीन',mr:'फ्लॅट-पॅनल स्क्रीन'},
  Keyboard: {en:'Keyboard',hi:'कीबोर्ड',mr:'कीबोर्ड'},
  Smartphone: {en:'Smartphone',hi:'स्मार्टफोन',mr:'स्मार्टफोन'},
  Tablet: {en:'Tablet',hi:'टैबलेट',mr:'टॅबलेट'},
  Laptop: {en:'Laptop',hi:'लैपटॉप',mr:'लॅपटॉप'},
  HDD: {en:'Hard drive',hi:'हार्ड ड्राइव',mr:'हार्ड ड्राइव्ह'},
  Mouse: {en:'Computer mouse',hi:'कंप्यूटर माउस',mr:'संगणक माउस'},
  BarPhone: {en:'Keypad phone',hi:'कीपैड फोन',mr:'कीपॅड फोन'}
};
export function needsMaterialConfirmation(result: DeviceSuggestion, material: string | null): boolean {
  return result.objects.some(d => d.score >= 0.45 && d.name !== 'PCB' && d.name !== 'Battery') ||
    result.objects.some(d => d.score >= 0.65 && material !== null &&
      ((d.name === 'PCB' && material !== 'PCB') || (d.name === 'Battery' && material !== 'BATTERY')));
}
export function devicePolicy(objects: DeviceDetection[]): DeviceSuggestion {
  const candidates = objects.filter(d => Number.isFinite(d.score) && d.score >= 0.25 && d.score <= 1).sort((a,b) => b.score-a.score);
  const top = candidates[0];
  const phoneOrTablet = candidates.some(d => isPhoneOrTablet(d.name));
  const competing = candidates.some(d => d.name !== top?.name && d.score >= 0.45);
  return {
    status: top && top.score >= 0.65 && !WEAK.has(top.name) && !competing && !phoneOrTablet ? 'SUGGESTION' : 'UNCERTAIN',
    clarification: phoneOrTablet ? 'PHONE_OR_TABLET' : undefined,
    objects: candidates.slice(0, 5), requiresConfirmation: true
  };
}
