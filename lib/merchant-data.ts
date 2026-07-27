import "server-only";

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import initSqlJs, {
  type BindParams,
  type Database as SqlJsDatabase,
} from "sql.js";
import type { Merchant, MerchantDataset } from "./merchant-types";

type MerchantRow = Merchant;

type ValueRow = {
  value: string;
};

const databasePath = path.join(
  process.cwd(),
  "data",
  "merchants.sqlite",
);
const require = createRequire(path.join(process.cwd(), "package.json"));
const wasmPath = require.resolve("sql.js/dist/sql-wasm.wasm");

let databasePromise: Promise<SqlJsDatabase> | undefined;

function getDatabase() {
  if (!databasePromise) {
    databasePromise = Promise.all([
      initSqlJs({ locateFile: () => wasmPath }),
      readFile(databasePath),
    ]).then(([SQL, databaseFile]) => new SQL.Database(databaseFile));
  }

  return databasePromise;
}

function selectRows<Row>(
  database: SqlJsDatabase,
  sql: string,
  params?: BindParams,
) {
  const statement = database.prepare(sql);
  const rows: Row[] = [];

  try {
    if (params) {
      statement.bind(params);
    }

    while (statement.step()) {
      rows.push(statement.getAsObject() as Row);
    }
  } finally {
    statement.free();
  }

  return rows;
}

function getMetadataValue(database: SqlJsDatabase, key: string) {
  const [row] = selectRows<ValueRow>(
    database,
    "SELECT value FROM metadata WHERE key = ?",
    [key],
  );

  return row?.value ?? "";
}

export async function getMerchantDataset(): Promise<MerchantDataset> {
  const database = await getDatabase();
  const merchants = selectRows<MerchantRow>(
    database,
    `
      SELECT id, name, address, area, category
      FROM merchants
      ORDER BY CAST(id AS INTEGER), id
    `,
  );
  const areaRows = selectRows<{ area: string }>(
    database,
    "SELECT DISTINCT area FROM merchants",
  );
  const categoryRows = selectRows<{ category: string }>(
    database,
    "SELECT DISTINCT category FROM merchants",
  );

  return {
    merchants,
    areas: areaRows
      .map(({ area }) => area)
      .toSorted((a, b) => a.localeCompare(b, "ko")),
    categories: categoryRows
      .map(({ category }) => category)
      .toSorted((a, b) => a.localeCompare(b, "ko")),
    updatedAt: getMetadataValue(database, "updated_at"),
  };
}

export async function getMerchantUpdatedAt() {
  const database = await getDatabase();
  return getMetadataValue(database, "updated_at");
}
