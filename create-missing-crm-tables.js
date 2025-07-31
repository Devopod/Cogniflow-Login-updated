import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function createMissingTables() {
  try {
    console.log("Creating missing CRM tables...");

    // Create leads table
    await sql`
      CREATE TABLE IF NOT EXISTS "leads" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "company" varchar(100),
        "email" varchar(255),
        "phone" varchar(20),
        "source" varchar(100),
        "status" varchar(50) DEFAULT 'new',
        "notes" text,
        "estimated_value" real,
        "priority" varchar(50) DEFAULT 'medium',
        "assigned_to" integer,
        "last_contact_date" timestamp,
        "next_follow_up_date" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `;

    // Create activities table
    await sql`
      CREATE TABLE IF NOT EXISTS "activities" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "contact_id" integer,
        "lead_id" integer,
        "deal_id" integer,
        "type" varchar(50) NOT NULL,
        "subject" varchar(200) NOT NULL,
        "description" text,
        "status" varchar(50) DEFAULT 'completed',
        "duration" integer,
        "due_date" timestamp,
        "completed_at" timestamp,
        "outcome" varchar(100),
        "notes" text,
        "attendees" jsonb,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `;

    // Create phone_calls table
    await sql`
      CREATE TABLE IF NOT EXISTS "phone_calls" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "contact_id" integer,
        "lead_id" integer,
        "deal_id" integer,
        "phone_number" varchar(20) NOT NULL,
        "direction" varchar(20) NOT NULL,
        "duration" integer,
        "call_date" timestamp NOT NULL,
        "status" varchar(50) DEFAULT 'completed',
        "outcome" varchar(100),
        "notes" text,
        "recording_url" varchar(500),
        "follow_up_required" boolean DEFAULT false,
        "follow_up_date" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `;

    // Create deal_stages table
    await sql`
      CREATE TABLE IF NOT EXISTS "deal_stages" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "name" varchar(100) NOT NULL,
        "order" integer NOT NULL,
        "color" varchar(20) DEFAULT '#3B82F6',
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `;

    // Create crm_companies table
    await sql`
      CREATE TABLE IF NOT EXISTS "crm_companies" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "name" varchar(100) NOT NULL,
        "industry" varchar(100),
        "website" varchar(255),
        "phone" varchar(20),
        "email" varchar(255),
        "address" text,
        "city" varchar(100),
        "state" varchar(100),
        "country" varchar(100),
        "postal_code" varchar(20),
        "employees" integer,
        "revenue" real,
        "notes" text,
        "tags" jsonb,
        "custom_fields" jsonb,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `;

    // Create tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "contact_id" integer,
        "lead_id" integer,
        "deal_id" integer,
        "title" varchar(200) NOT NULL,
        "description" text,
        "status" varchar(50) DEFAULT 'pending',
        "priority" varchar(50) DEFAULT 'medium',
        "due_date" timestamp,
        "completed_at" timestamp,
        "assigned_to" integer,
        "category" varchar(100),
        "tags" jsonb,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `;

    // Add foreign key constraints (with error handling for existing constraints)
    try {
      await sql`ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY("user_id") REFERENCES "users"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY("assigned_to") REFERENCES "users"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY("user_id") REFERENCES "users"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY("contact_id") REFERENCES "contacts"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY("lead_id") REFERENCES "leads"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_user_id_fkey" FOREIGN KEY("user_id") REFERENCES "users"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_contact_id_fkey" FOREIGN KEY("contact_id") REFERENCES "contacts"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_lead_id_fkey" FOREIGN KEY("lead_id") REFERENCES "leads"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "deal_stages" ADD CONSTRAINT "deal_stages_user_id_fkey" FOREIGN KEY("user_id") REFERENCES "users"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "crm_companies" ADD CONSTRAINT "crm_companies_user_id_fkey" FOREIGN KEY("user_id") REFERENCES "users"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY("user_id") REFERENCES "users"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_fkey" FOREIGN KEY("contact_id") REFERENCES "contacts"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY("lead_id") REFERENCES "leads"("id");`;
    } catch (e) { /* constraint may already exist */ }

    try {
      await sql`ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY("assigned_to") REFERENCES "users"("id");`;
    } catch (e) { /* constraint may already exist */ }

    console.log("✅ Missing CRM tables created successfully!");

  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exit(1);
  }
}

createMissingTables();