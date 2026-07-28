const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '../.env');
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match) {
    dbUrl = match[1];
  }
}

dbUrl = dbUrl || 'file:./dev.db';

const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

const updatedSchema = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${targetProvider}"`
);

if (updatedSchema !== schema) {
  fs.writeFileSync(schemaPath, updatedSchema);
  console.log(`[Prisma Prep] Provider updated to "${targetProvider}" based on DATABASE_URL (${dbUrl.slice(0, 15)}...)`);
} else {
  console.log(`[Prisma Prep] Provider already set to "${targetProvider}"`);
}
