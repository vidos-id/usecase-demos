declare module "bun:sqlite" {
export class Database {
constructor(filename: string, options?: { create?: boolean; strict?: boolean });
exec(sql: string): unknown;
}
}
