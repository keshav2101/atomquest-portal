const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// Change provider to sqlite
schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');
schema = schema.replace('url      = env("DATABASE_URL")', 'url      = "file:./dev.db"');

// Extract enum names
const enumRegex = /enum\s+(\w+)\s+\{[^}]+\}/g;
let match;
const enumNames = [];
while ((match = enumRegex.exec(schema)) !== null) {
  enumNames.push(match[1]);
}

// Remove enum definitions
schema = schema.replace(/enum\s+\w+\s+\{[^}]+\}/g, '');

// Replace enum usages with String
enumNames.forEach(enumName => {
  const regex = new RegExp(`(\\w+)\\s+${enumName}(\\s|\\?)`, 'g');
  schema = schema.replace(regex, `$1 String$2`);
  
  // Replace array enums if any
  const regexArray = new RegExp(`(\\w+)\\s+${enumName}\\[\\]`, 'g');
  schema = schema.replace(regexArray, `$1 String`);
});

// Remove unsupported @db.VarChar and @db.Text attributes for SQLite
schema = schema.replace(/@db\.VarChar\(\d+\)/g, '');
schema = schema.replace(/@db\.Text/g, '');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema converted to SQLite!');
