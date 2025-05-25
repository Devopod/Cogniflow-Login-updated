// Simple script to run the migration
import { exec } from 'child_process';

exec('npx tsx server/migrations/create-missing-tables.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Output: ${stdout}`);
});