import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import initSqlJs from "sql.js";

const CSV_HEADERS = [
  "가맹점번호",
  "가맹점이름",
  "상세주소",
  "소재지",
  "가맹점유형",
  "수정일",
] as const;

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "data.csv");
const dataDirectory = path.join(projectRoot, "data");
const databasePath = path.join(dataDirectory, "merchants.sqlite");
const temporaryDatabasePath = path.join(
  dataDirectory,
  "merchants.sqlite.building",
);
const require = createRequire(path.join(projectRoot, "package.json"));
const wasmPath = require.resolve("sql.js/dist/sql-wasm.wasm");

function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let isQuoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (isQuoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        isQuoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      isQuoted = true;
    } else if (character === ",") {
      row.push(field.trim());
      field = "";
    } else if (character === "\n") {
      row.push(field.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (field || row.length > 0) {
    row.push(field.trim());
    if (row.some(Boolean)) {
      rows.push(row);
    }
  }

  return rows;
}

function decodeCsv(buffer: Buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("euc-kr").decode(buffer);
  }
}

function assertHeaders(headers: string[]) {
  for (const [index, expectedHeader] of CSV_HEADERS.entries()) {
    if (headers[index]?.replace(/^\uFEFF/, "") !== expectedHeader) {
      throw new Error(
        `data.csv의 ${index + 1}번째 컬럼은 "${expectedHeader}"이어야 합니다.`,
      );
    }
  }
}

function normalizeAddress(address: string) {
  return address.replace(/\s+/g, " ").trim();
}

async function buildDatabase() {
  if (!existsSync(sourcePath)) {
    if (existsSync(databasePath)) {
      console.log(
        "data.csv가 없어 저장소의 data/merchants.sqlite를 사용합니다.",
      );
      return;
    }

    throw new Error(
      "data.csv 또는 data/merchants.sqlite가 필요합니다. 배포 저장소에 SQLite가 포함되어 있는지 확인하세요.",
    );
  }

  const decodedCsv = decodeCsv(readFileSync(sourcePath));
  const [headers = [], ...rows] = parseCsv(decodedCsv);
  assertHeaders(headers);

  mkdirSync(dataDirectory, { recursive: true });
  rmSync(temporaryDatabasePath, { force: true });

  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
  });
  const database = new SQL.Database();

  try {
    database.run("PRAGMA foreign_keys = ON");
    database.exec(`
      CREATE TABLE metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      ) STRICT;

      CREATE TABLE merchants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        normalized_address TEXT NOT NULL,
        area TEXT NOT NULL,
        category TEXT NOT NULL,
        modified_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE merchant_locations (
        merchant_id TEXT PRIMARY KEY
          REFERENCES merchants(id) ON DELETE CASCADE,
        latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
        longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
        source TEXT NOT NULL,
        geocoded_at TEXT
      ) STRICT;

      CREATE INDEX merchants_area_idx ON merchants(area);
      CREATE INDEX merchants_category_idx ON merchants(category);
      CREATE INDEX merchants_name_idx ON merchants(name);
      CREATE INDEX merchants_normalized_address_idx
        ON merchants(normalized_address);
    `);

    const insertMerchant = database.prepare(`
      INSERT INTO merchants (
        id,
        name,
        address,
        normalized_address,
        area,
        category,
        modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMetadata = database.prepare(`
      INSERT INTO metadata (key, value) VALUES (?, ?)
    `);

    let insertedCount = 0;
    let skippedCount = 0;
    let updatedAt = "";

    database.run("BEGIN TRANSACTION");

    try {
      for (const row of rows) {
        const [id, name, address, area, category, modifiedAt] = row;

        if (!id || !name || !address || !area || !category || !modifiedAt) {
          skippedCount += 1;
          continue;
        }

        insertMerchant.run([
          id,
          name,
          address,
          normalizeAddress(address),
          area,
          category,
          modifiedAt,
        ]);
        insertedCount += 1;

        if (modifiedAt > updatedAt) {
          updatedAt = modifiedAt;
        }
      }

      const metadata = {
        schema_version: "1",
        source_file: "data.csv",
        merchant_count: String(insertedCount),
        skipped_row_count: String(skippedCount),
        updated_at: updatedAt,
      };

      for (const [key, value] of Object.entries(metadata)) {
        insertMetadata.run([key, value]);
      }

      database.run("COMMIT");
    } catch (error) {
      database.run("ROLLBACK");
      throw error;
    } finally {
      insertMerchant.free();
      insertMetadata.free();
    }

    database.run("ANALYZE");
    writeFileSync(temporaryDatabasePath, Buffer.from(database.export()));
    database.close();

    rmSync(databasePath, { force: true });
    renameSync(temporaryDatabasePath, databasePath);

    console.log(
      `SQLite 생성 완료: ${insertedCount.toLocaleString("ko-KR")}건` +
        (skippedCount > 0 ? `, 제외 ${skippedCount}건` : ""),
    );
  } catch (error) {
    try {
      database.close();
    } catch {
      // The database may already be closed after a successful export.
    }
    rmSync(temporaryDatabasePath, { force: true });
    throw error;
  }
}

buildDatabase().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
