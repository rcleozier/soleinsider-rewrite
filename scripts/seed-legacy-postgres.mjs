import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

loadEnvFile();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Add it to .env before seeding.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});
const backupDir = resolve("db-backup");
const reset = process.argv.includes("--reset");
const dryRun = process.argv.includes("--dry-run");
const productsFileArg = getArgValue("--products") ?? "products.sql";

const imports = [
  {
    table: "articles",
    file: "articles.sql",
    model: prisma.article,
    map: (row) => ({
      id: int(row.id),
      title: row.title,
      content: row.content,
      cover: row.cover,
      slug: row.slug,
      keywords: row.keywords,
      createdAt: dateOrNull(row.created_at),
      updatedAt: dateOrNull(row.updated_at),
    }),
  },
  {
    table: "products",
    file: productsFileArg,
    model: prisma.product,
    map: (row) => ({
      id: int(row.id),
      name: row.name,
      sku: row.sku,
      image: row.image,
      link: row.link,
      colorway: row.colorway,
      description: row.description,
      content: row.content,
      slug: row.slug,
      price: decimalString(row.price),
      comingSoon: int(row.coming_soon),
      views: int(row.views),
      resale: row.resale,
      type: row.type,
      stockxUrl: row.stockx_url,
      stockxThumbnailUrl: row.stockx_thumbnail_url,
      stockxTickerSymbol: row.stockx_ticker_symbol,
      stockxName: row.stockx_name,
      stockxMake: row.stockx_make,
      stockxModel: row.stockx_model,
      stockxPrice: int(row.stockx_price),
      stockxHighestBid: int(row.stockx_highest_bid),
      stockxTotalDollars: int(row.stockx_total_dollars),
      stockxLowestAsk: int(row.stockx_lowest_ask),
      stockxLastSale: int(row.stockx_last_sale),
      stockxDeadstockSold: int(row.stockx_deadstock_sold),
      stockxSalesLast72: int(row.stockx_sales_last_72),
      createdAt: requiredDate(row.created_at),
      updatedAt: requiredDate(row.updated_at),
    }),
  },
  {
    table: "releases",
    file: "releases.sql",
    model: prisma.release,
    map: (row) => ({
      id: int(row.id),
      productId: int(row.product_id),
      releaseDate: requiredDate(row.release_date),
      createdAt: requiredDate(row.created_at),
      updatedAt: requiredDate(row.updated_at),
    }),
  },
  {
    table: "product_images",
    file: "product_images.sql",
    model: prisma.productImage,
    map: (row) => ({
      id: int(row.id),
      productId: int(row.product_id),
      optimized: Boolean(int(row.optimized)),
      image: row.image,
    }),
  },
  {
    table: "comments",
    file: "comments.sql",
    model: prisma.comment,
    map: (row) => ({
      id: int(row.id),
      memberId: intOrNull(row.member_id),
      productId: intOrNull(row.product_id),
      comment: row.comment,
      votesUp: int(row.votes_up),
      votesDown: int(row.votes_down),
      createdAt: dateOrNull(row.created_at),
      updatedAt: dateOrNull(row.updated_at),
    }),
  },
  {
    table: "release_interest",
    file: "release_interest.sql",
    model: prisma.releaseInterest,
    map: (row) => ({
      id: int(row.id),
      memberId: intOrNull(row.member_id),
      productId: intOrNull(row.product_id),
      status: intOrNull(row.status),
      createdAt: dateOrNull(row.created_at),
    }),
  },
];

try {
  if (reset && !dryRun) {
    await truncateImportedTables();
  }

  for (const config of imports) {
    const rows = await readRows(config.file, config.table);
    const mappedRows = rows.map(config.map);

    if (!dryRun) {
      await createManyInChunks(config.model, mappedRows);
      await resetSequence(config.table);
    }

    console.log(
      `${dryRun ? "Parsed" : "Seeded"} ${mappedRows.length.toLocaleString()} ${config.table} rows.`,
    );
  }
} finally {
  await prisma.$disconnect();
}

async function readRows(file, table) {
  const sql = await readFile(join(backupDir, file), "utf8");
  const statements = getInsertStatements(sql, table);
  const rows = [];

  for (const statement of statements) {
    const { columns, valuesSql } = parseInsertStatement(statement);

    for (const values of parseValues(valuesSql)) {
      rows.push(Object.fromEntries(columns.map((column, index) => [column, values[index]])));
    }
  }

  return rows;
}

function getInsertStatements(sql, table) {
  const needle = `INSERT INTO \`${table}\``;
  const statements = [];
  let index = 0;

  while ((index = sql.indexOf(needle, index)) !== -1) {
    let cursor = index;
    let inString = false;

    while (cursor < sql.length) {
      const char = sql[cursor];
      const next = sql[cursor + 1];

      if (char === "'" && inString && next === "'") {
        cursor += 2;
        continue;
      }

      if (char === "'" && sql[cursor - 1] !== "\\") {
        inString = !inString;
      }

      if (char === ";" && !inString) {
        statements.push(sql.slice(index, cursor + 1));
        index = cursor + 1;
        break;
      }

      cursor++;
    }
  }

  return statements;
}

function parseInsertStatement(statement) {
  const columnsMatch = statement.match(/INSERT INTO `[^`]+` \(([^)]+)\) VALUES/i);

  if (!columnsMatch) {
    throw new Error("Unable to parse INSERT columns.");
  }

  const valuesIndex = statement.indexOf(" VALUES");

  return {
    columns: columnsMatch[1].split(",").map((column) => column.trim().replaceAll("`", "")),
    valuesSql: statement.slice(valuesIndex + " VALUES".length, -1).trim(),
  };
}

function parseValues(valuesSql) {
  const rows = [];
  let row = "";
  let depth = 0;
  let inString = false;

  for (let index = 0; index < valuesSql.length; index++) {
    const char = valuesSql[index];
    const next = valuesSql[index + 1];

    if (char === "'" && inString && next === "'") {
      row += "''";
      index++;
      continue;
    }

    if (char === "'" && valuesSql[index - 1] !== "\\") {
      inString = !inString;
    }

    if (char === "(" && !inString) {
      if (depth === 0) {
        row = "";
      } else {
        row += char;
      }
      depth++;
      continue;
    }

    if (char === ")" && !inString) {
      depth--;
      if (depth === 0) {
        rows.push(parseRow(row));
      } else {
        row += char;
      }
      continue;
    }

    if (depth > 0) {
      row += char;
    }
  }

  return rows;
}

function parseRow(row) {
  const values = [];
  let value = "";
  let inString = false;

  for (let index = 0; index < row.length; index++) {
    const char = row[index];
    const next = row[index + 1];

    if (char === "'" && inString && next === "'") {
      value += "''";
      index++;
      continue;
    }

    if (char === "'" && row[index - 1] !== "\\") {
      inString = !inString;
    }

    if (char === "," && !inString) {
      values.push(parseToken(value));
      value = "";
      continue;
    }

    value += char;
  }

  values.push(parseToken(value));
  return values;
}

function parseToken(value) {
  const trimmed = value.trim();

  if (/^null$/i.test(trimmed)) return null;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed
      .slice(1, -1)
      .replaceAll("''", "'")
      .replaceAll("\\r", "\r")
      .replaceAll("\\n", "\n")
      .replaceAll("\\t", "\t")
      .replaceAll("\\\\", "\\")
      .replaceAll("\\'", "'");
  }

  return trimmed;
}

async function createManyInChunks(model, rows, size = 1000) {
  for (let index = 0; index < rows.length; index += size) {
    await model.createMany({
      data: rows.slice(index, index + size),
      skipDuplicates: true,
    });
  }
}

async function truncateImportedTables() {
  const tables = imports.map((config) => `"${config.table}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}

async function resetSequence(table) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true)`,
  );
}

function int(value) {
  return Number.parseInt(value ?? "0", 10) || 0;
}

function intOrNull(value) {
  return value == null ? null : int(value);
}

function decimalString(value) {
  return String(value ?? "0.00");
}

function dateOrNull(value) {
  if (!value || String(value).startsWith("0000-00-00")) return null;

  return new Date(`${value}Z`);
}

function requiredDate(value) {
  return dateOrNull(value) ?? new Date("1970-01-01T00:00:00Z");
}

function getArgValue(name) {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}
