/**
 * pnpm data <command>
 *
 * The nightly job's tools, by hand (D-034), against the data store this
 * checkout's `.env.local` points at (its DATA_BACKEND and DATA_NAMESPACE):
 *
 *   pnpm data backups                  list the stored backups, newest first
 *   pnpm data backup                   back up every record now
 *   pnpm data sweep [--dry-run]        delete uploads no record uses (24 h grace)
 *   pnpm data restore <date> [--yes]   put that day's records back
 *
 * Restore without --yes only reports what it would do. Restoring into the
 * production namespace also needs --production, so it is never an accident.
 * Records missing from the backup are left alone; restored records keep their
 * own dates and authors. Restores bypass the admin panel, so the live site
 * shows them within an hour (the public reads' cache lifetime).
 */
import { existsSync } from 'node:fs';

// Load the environment before anything reads it (src/lib/env.ts parses on import).
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const { createDataServices } = await import('@/lib/data/runtime');

const [command, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((arg) => arg.startsWith('--')));
const [argument] = rest.filter((arg) => !arg.startsWith('--'));
const data = createDataServices({ invalidate: () => {} });
const { maintenance, namespace } = data;

function usage(): never {
  console.log(
    'Usage: pnpm data backups | backup | sweep [--dry-run] | restore <yyyy-mm-dd> [--yes] [--production]',
  );
  process.exit(1);
}

console.log(`Data store namespace: "${namespace}"`);

switch (command) {
  case 'backups': {
    const dates = await maintenance.listBackups();
    console.log(dates.length > 0 ? dates.map((date) => `  ${date}`).join('\n') : '  (none yet)');
    break;
  }

  case 'backup': {
    const { date, records, removed } = await maintenance.backup();
    console.log(`Backed up ${records} records as ${date}.`);
    if (removed.length > 0) console.log(`Removed old backups: ${removed.join(', ')}`);
    break;
  }

  case 'sweep': {
    const report = await maintenance.sweep({ dryRun: flags.has('--dry-run') });
    const verb = report.dryRun ? 'Would delete' : 'Deleted';
    console.log(`${verb} ${report.deleted.length} of ${report.files} files.`);
    for (const key of report.deleted) console.log(`  ${key}`);
    if (report.recent.length > 0) {
      console.log(`Kept ${report.recent.length} unused uploads younger than the grace period.`);
    }
    break;
  }

  case 'restore': {
    if (!argument || !/^\d{4}-\d{2}-\d{2}$/.test(argument)) usage();
    const backup = await maintenance.readBackup(argument);
    if (!backup) {
      console.error(`No backup for ${argument}. See: pnpm data backups`);
      process.exit(1);
    }
    console.log(
      `Backup ${argument}: taken ${backup.createdAt} from namespace "${backup.namespace}".`,
    );
    for (const [collection, records] of Object.entries(backup.collections)) {
      console.log(`  ${collection}: ${records?.length ?? 0} records`);
    }
    if (backup.namespace !== namespace) {
      console.log(
        `Note: it was taken from "${backup.namespace}"; its files stay where they are and are not copied.`,
      );
    }
    if (!flags.has('--yes')) {
      console.log('Nothing changed. Run again with --yes to restore these records.');
      break;
    }
    if (namespace === 'prod' && !flags.has('--production')) {
      console.error('This is the production namespace: add --production as well to restore here.');
      process.exit(1);
    }
    const results = await maintenance.restore(backup);
    for (const [collection, { restored, invalid }] of Object.entries(results)) {
      console.log(
        `  ${collection}: ${restored} restored${invalid > 0 ? `, ${invalid} skipped (invalid)` : ''}`,
      );
    }
    console.log('Done.');
    break;
  }

  default:
    usage();
}
