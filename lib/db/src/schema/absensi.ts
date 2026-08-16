import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { customerUsersTable } from "./users";

export const absensiStoresTable = pgTable(
  "absensi_stores",
  {
    id: serial("id").primaryKey(),
    ownerUserId: integer("owner_user_id")
      .notNull()
      .references(() => customerUsersTable.id, { onDelete: "cascade" }),
    storeName: text("store_name").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    ownerUserIdUnique: uniqueIndex("absensi_stores_owner_user_id_unique").on(
      table.ownerUserId,
    ),
  }),
);

export const absensiPersonnelTable = pgTable("absensi_personnel", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id")
    .notNull()
    .references(() => absensiStoresTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull().default("Crew"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const absensiEntriesTable = pgTable(
  "absensi_entries",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id")
      .notNull()
      .references(() => absensiStoresTable.id, { onDelete: "cascade" }),
    personnelId: integer("personnel_id")
      .notNull()
      .references(() => absensiPersonnelTable.id, { onDelete: "cascade" }),
    attendanceDate: date("attendance_date").notNull(),
    status: text("status").notNull().default("hadir"),
    shift: text("shift").notNull().default("pagi"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    personnelDateUnique: uniqueIndex(
      "absensi_entries_personnel_date_unique",
    ).on(table.personnelId, table.attendanceDate),
  }),
);

export type AbsensiStore = typeof absensiStoresTable.$inferSelect;
export type AbsensiPersonnel = typeof absensiPersonnelTable.$inferSelect;
export type AbsensiEntry = typeof absensiEntriesTable.$inferSelect;