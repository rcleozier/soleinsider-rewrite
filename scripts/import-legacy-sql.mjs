import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import mysql from "mysql2/promise";

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const fileArgs = args.filter((arg) => !arg.startsWith("--"));
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (fileArgs.length === 0) {
  console.error(
    "Usage: node scripts/import-legacy-sql.mjs [--reset] /path/to/table.sql [...more.sql]",
  );
  process.exit(1);
}

const exportsToImport = await Promise.all(
  fileArgs.map(async (fileArg) => {
    const filePath = resolve(fileArg);
    const sql = await readFile(filePath, "utf8");
    const tableNames = [
      ...sql.matchAll(/CREATE TABLE IF NOT EXISTS `([^`]+)`/gi),
    ].map((match) => match[1]);

    return { filePath, sql, tableNames };
  }),
);

const tableOwners = new Map();

for (const exportFile of exportsToImport) {
  for (const tableName of exportFile.tableNames) {
    if (tableOwners.has(tableName)) {
      console.error(
        `Multiple SQL files target \`${tableName}\`: ${basename(
          tableOwners.get(tableName),
        )} and ${basename(exportFile.filePath)}. Import one export per table.`,
      );
      process.exit(1);
    }

    tableOwners.set(tableName, exportFile.filePath);
  }
}

const connection = await mysql.createConnection({
  uri: databaseUrl,
  multipleStatements: true,
});

try {
  const tableNames = exportsToImport.flatMap((exportFile) => exportFile.tableNames);

  if (reset && tableNames.length > 0) {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const tableName of [...new Set(tableNames)]) {
      try {
        await connection.query(`TRUNCATE TABLE \`${tableName.replaceAll("`", "``")}\``);
      } catch (error) {
        if (error?.code !== "ER_NO_SUCH_TABLE") {
          throw error;
        }
      }
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  for (const exportFile of exportsToImport) {
    await connection.query(exportFile.sql);
    console.log(
      `Imported ${basename(exportFile.filePath)}${
        exportFile.tableNames.length ? ` into ${exportFile.tableNames.join(", ")}` : ""
      }.`,
    );
  }
} finally {
  await connection.end();
}
