import { integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  shareToken: text("share_token"),
}, (t) => [uniqueIndex("projects_owner_id_idx").on(t.id, t.ownerId)]);

export const nodes = pgTable("nodes", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  name: text("name").notNull(),
  type: text("type").notNull(),
  order: integer("order").notNull().default(0),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("nodes_project_id_idx").on(t.projectId, t.id)]);

export type ProjectRow = typeof projects.$inferSelect;
export type NodeRow = typeof nodes.$inferSelect;
