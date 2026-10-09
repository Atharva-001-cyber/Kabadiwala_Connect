// Platform references, not regulatory IDs. Never use referenceCode for joins.
const aliases: Record<string, string> = {
  LUCKNOW:'LKO', LKO:'LKO', 'लखनऊ':'LKO', KANPUR:'KNP', 'कानपुर':'KNP',
  VARANASI:'VNS', 'वाराणसी':'VNS', AGRA:'AGR', 'आगरा':'AGR', NOIDA:'NDA', 'नोएडा':'NDA',
  DELHI:'DEL', 'दिल्ली':'DEL', MUMBAI:'BOM', 'मुंबई':'BOM', 'मुम्बई':'BOM',
  PUNE:'PUN', 'पुणे':'PUN', NAGPUR:'NGP', 'नागपुर':'NGP', 'नागपूर':'NGP',
  BENGALURU:'BLR', BANGALORE:'BLR', 'बेंगलुरु':'BLR', 'बंगलुरु':'BLR'
};
export function districtCode(district?: string): string {
  const name = (district || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toUpperCase();
  return aliases[name] || (/^[A-Z]{3,}$/.test(name.replace(/ /g,'')) ? name.replace(/ /g,'').slice(0,3) : 'UNK');
}
export function createLotId(district?: string, createdAt = new Date()): string {
  if (!Number.isFinite(createdAt.getTime())) throw new Error('Invalid lot creation date');
  // Snapshot metadata inside the UUID-based TEXT key avoids a required live schema migration.
  return `EW-${districtCode(district)}-${createdAt.getFullYear()}-${crypto.randomUUID()}`;
}
export function lotReference(id: string): string {
  const match = /^EW-([A-Z]{3})-(\d{4})-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/.exec(id);
  if (!match) return id; // Preserve legacy records and references verbatim.
  // Lossless full UUID encoding: unlike a short prefix, no identity bits are discarded.
  return `EW-${match[1]}-${match[2]}-${BigInt('0x'+match[3].replace(/-/g,'')).toString(36).toUpperCase()}`;
}
