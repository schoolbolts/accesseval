import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { prisma } from '../src/lib/db';

const usedSlugs = new Set<string>();

function slugify(name: string, state: string, ncesId: string): string {
  let base = (name + '-' + state)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (usedSlugs.has(base)) {
    base = base + '-' + ncesId.slice(-4);
  }
  usedSlugs.add(base);
  return base;
}

function normalizeUrl(raw: string): string | null {
  if (!raw || raw === '-2' || raw === '-1') return null;
  let url = raw.trim();
  if (!url.startsWith('http')) url = 'https://' + url;
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  return url;
}

function gradeRange(row: Record<string, string>): string | null {
  const lo = row.GSLO?.trim();
  const hi = row.GSHI?.trim();
  if (!lo || !hi || lo === '-2' || hi === '-2') return null;
  return `${lo}-${hi}`;
}

async function main() {
  const csvPath = path.join(__dirname, '../data/ccd_lea_029_2425_w_0a_051425.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const records: Record<string, string>[] = parse(raw, { columns: true, skip_empty_lines: true });

  console.log(`Parsed ${records.length} districts from NCES data`);

  // Filter to active districts with websites
  const districts = records.filter((r) => {
    const status = r.SY_STATUS_TEXT?.trim() || '';
    const website = normalizeUrl(r.WEBSITE || '');
    return status.includes('Open') && website !== null;
  });

  console.log(`${districts.length} active districts with websites`);

  // Batch insert using upsert (in batches of 500)
  const BATCH_SIZE = 500;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < districts.length; i += BATCH_SIZE) {
    const batch = districts.slice(i, i + BATCH_SIZE);

    const ops = batch.map((row) => {
      const ncesId = row.LEAID.trim();
      const name = row.LEA_NAME.trim();
      const stateCode = row.ST.trim();
      const slug = slugify(name, stateCode, ncesId);
      const website = normalizeUrl(row.WEBSITE || '');

      return prisma.district.upsert({
        where: { ncesId },
        create: {
          ncesId,
          name,
          slug,
          website,
          city: row.LCITY?.trim() || null,
          state: row.STATENAME?.trim() || null,
          stateCode,
          phone: row.PHONE?.trim() && row.PHONE.trim() !== '-2' ? row.PHONE.trim() : null,
          leaType: row.LEA_TYPE_TEXT?.trim() || null,
          gradeRange: gradeRange(row),
        },
        update: {
          name,
          website,
          city: row.LCITY?.trim() || null,
          state: row.STATENAME?.trim() || null,
          phone: row.PHONE?.trim() && row.PHONE.trim() !== '-2' ? row.PHONE.trim() : null,
          leaType: row.LEA_TYPE_TEXT?.trim() || null,
          gradeRange: gradeRange(row),
        },
      });
    });

    const results = await prisma.$transaction(ops);
    inserted += results.length;

    const pct = Math.round(((i + batch.length) / districts.length) * 100);
    process.stdout.write(`\r  ${pct}% — ${inserted} districts processed`);
  }

  console.log(`\nDone! ${inserted} districts imported.`);

  // Stats
  const total = await prisma.district.count();
  const withWebsite = await prisma.district.count({ where: { website: { not: null } } });
  const states = await prisma.district.groupBy({ by: ['stateCode'], _count: true, orderBy: { _count: { stateCode: 'desc' } }, take: 10 });
  console.log(`\nTotal in DB: ${total}`);
  console.log(`With website: ${withWebsite}`);
  console.log('Top states:', states.map((s) => `${s.stateCode}: ${s._count}`).join(', '));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
