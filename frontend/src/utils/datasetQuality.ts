export function auditDataset(rows: Record<string, any>[], table: string) {
  const ids = new Set<string>();
  let duplicateIds = 0, missingIds = 0, invalidNumbers = 0, invalidDates = 0, missingSource = 0;
  const sources: Record<string, number> = {};
  for (const row of rows) {
    if (!row.id) missingIds++;
    else if (ids.has(String(row.id))) duplicateIds++;
    else ids.add(String(row.id));
    const source = row.source || row.data_source || row.authorization_source;
    if (!source) missingSource++;
    sources[String(source || 'UNSPECIFIED')] = (sources[String(source || 'UNSPECIFIED')] || 0) + 1;
    for (const [key, value] of Object.entries(row)) {
      if (value === null || value === undefined || value === '') continue;
      if (/^(approx_weight|actual_weight|weight|amount|rate_per_kg|estimated_value_min|estimated_value_max|buying_price|selling_price)$/.test(key) && (!Number.isFinite(Number(value)) || Number(value) < 0)) invalidNumbers++;
      if (/^(timestamp|created_at|updated_at|date)$/.test(key) && !Number.isFinite(Date.parse(String(value)))) invalidDates++;
    }
  }
  return { table, inspectedAt: new Date().toISOString(), inspectedRows: rows.length, duplicateIds, missingIds, invalidNumbers, invalidDates, missingSource, declaredSources: sources,
    limitations: ['Sources are declared metadata, not independently verified.', 'Checks cover supplied rows, not cross-table integrity or model accuracy.', 'Training use requires consent/licensing checks, label review and a separate held-out evaluation.'] };
}
export function safeCsvCell(value: unknown): string {
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
/** Avoid exporting direct contact details, OTPs, credentials and location precision. IDs remain linkable, not anonymous. */
export function redactDatasetRow(row: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key,
    /phone|email|aadhaar|password|token|secret|otp|signature|latitude|longitude|gps_location|address/i.test(key) ? '[REDACTED]' :
    value && typeof value === 'object' ? (Array.isArray(value) ? value.map(v => typeof v === 'object' && v ? redactDatasetRow(v) : v) : redactDatasetRow(value)) : value
  ]));
}
