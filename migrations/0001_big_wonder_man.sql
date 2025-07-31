CREATE TABLE "account_group_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_group_id" integer NOT NULL,
	"parent_account_group_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "account_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"type" varchar(50) NOT NULL,
	"parent_id" integer,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activities" (
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
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" integer,
	"old_values" jsonb,
	"new_values" jsonb,
	"details" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"legal_name" varchar(255) NOT NULL,
	"business_type" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"industry_type" varchar(100) NOT NULL,
	"country" varchar(100) NOT NULL,
	"tax_id_number" varchar(100),
	"tax_registration_status" varchar(50),
	"tax_codes" jsonb,
	"principal_business_address" jsonb,
	"additional_business_addresses" jsonb,
	"address_proof_type" varchar(100),
	"address_proof_document" varchar(500),
	"bank_name" varchar(255),
	"account_number" varchar(100),
	"routing_code" varchar(100),
	"bank_address" text,
	"bank_document" varchar(500),
	"signatory_name" varchar(255),
	"signatory_designation" varchar(100),
	"signatory_tax_id" varchar(100),
	"signatory_identification_number" varchar(100),
	"signatory_photo" varchar(500),
	"signatory_contact" jsonb,
	"business_registration_number" varchar(100),
	"registration_certificate" varchar(500),
	"partnership_agreement" varchar(500),
	"proof_of_appointment" varchar(500),
	"tax_registration_certificate" varchar(500),
	"logo" varchar(500),
	"business_size" varchar(50),
	"preferred_language" varchar(50) DEFAULT 'English',
	"currency" varchar(3) DEFAULT 'USD',
	"time_zone" varchar(100),
	"small_business_registration" varchar(255),
	"industry_licenses" jsonb,
	"e_invoicing_requirements" jsonb,
	"local_tax_registrations" jsonb,
	"setup_complete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_companies" (
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
--> statement-breakpoint
CREATE TABLE "currency_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) NOT NULL,
	"rate" real NOT NULL,
	"rate_date" date NOT NULL,
	"source" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deal_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"order" integer NOT NULL,
	"color" varchar(20) DEFAULT '#3B82F6',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"template_type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"variables" jsonb,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"fiscal_year_id" integer,
	"fiscal_period_id" integer,
	"date_from" date,
	"date_to" date,
	"parameters" jsonb,
	"generated_by" integer,
	"generated_at" timestamp DEFAULT now(),
	"status" varchar(50) DEFAULT 'draft',
	"report_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fiscal_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"fiscal_year_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"period_number" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_closed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fiscal_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_closed" boolean DEFAULT false,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"user_id" integer,
	"activity_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"template_data" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"access_count" integer DEFAULT 0,
	"last_accessed" timestamp,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "invoice_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"entry_number" varchar(50) NOT NULL,
	"entry_date" date NOT NULL,
	"reference" varchar(100),
	"description" text,
	"source" varchar(50),
	"status" varchar(50) DEFAULT 'posted',
	"is_recurring" boolean DEFAULT false,
	"recurring_schedule" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "journal_entries_entry_number_unique" UNIQUE("entry_number")
);
--> statement-breakpoint
CREATE TABLE "journal_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"description" text,
	"debit_amount" real DEFAULT 0,
	"credit_amount" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
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
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type_id" integer NOT NULL,
	"fiscal_year_id" integer,
	"allocated" real NOT NULL,
	"used" real DEFAULT 0,
	"pending" real DEFAULT 0,
	"carry_over" real DEFAULT 0,
	"expiry_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"duration" real NOT NULL,
	"half_day" boolean DEFAULT false,
	"reason" text,
	"status" varchar(50) DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color_code" varchar(20),
	"default_days" integer,
	"is_paid" boolean DEFAULT true,
	"requires_approval" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"description" text NOT NULL,
	"quantity" real NOT NULL,
	"unit_price" real NOT NULL,
	"tax_rate" real,
	"tax_amount" real,
	"discount_rate" real,
	"discount_amount" real,
	"subtotal" real NOT NULL,
	"total_amount" real NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_id" integer,
	"order_number" varchar(50) NOT NULL,
	"order_date" date DEFAULT now() NOT NULL,
	"delivery_date" date,
	"subtotal" real NOT NULL,
	"tax_amount" real,
	"discount_amount" real,
	"total_amount" real NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"notes" text,
	"category" varchar(50),
	"payment_status" varchar(50) DEFAULT 'unpaid',
	"shipping_address" text,
	"billing_address" text,
	"currency" varchar(3) DEFAULT 'USD',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payment_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"link_token" varchar(255) NOT NULL,
	"expires_at" timestamp,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"custom_message" text,
	"redirect_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"last_accessed" timestamp,
	CONSTRAINT "payment_links_link_token_unique" UNIQUE("link_token")
);
--> statement-breakpoint
CREATE TABLE "payment_gateway_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"gateway_name" varchar(100) NOT NULL,
	"api_key_public" varchar(255),
	"api_key_secret" varchar(255),
	"webhook_secret" varchar(255),
	"is_enabled" boolean DEFAULT false,
	"supported_currencies" jsonb,
	"transaction_fees" jsonb,
	"additional_config" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_gateway_settings_gateway_name_unique" UNIQUE("gateway_name")
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"payment_id" integer,
	"event_type" varchar(100) NOT NULL,
	"event_timestamp" timestamp DEFAULT now(),
	"details" jsonb,
	"user_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"reminder_date" date NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"channel" varchar(50) NOT NULL,
	"template_used" varchar(100),
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"days_offset" integer,
	"offset_type" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"module" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "phone_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_id" integer,
	"lead_id" integer,
	"deal_id" integer,
	"phone_number" varchar(20) NOT NULL,
	"direction" varchar(20) NOT NULL,
	"status" varchar(50) NOT NULL,
	"duration" integer,
	"recording_url" varchar(500),
	"notes" text,
	"outcome" varchar(100),
	"follow_up_required" boolean DEFAULT false,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_id" integer NOT NULL,
	"product_id" integer,
	"description" text NOT NULL,
	"quantity" real NOT NULL,
	"unit_price" real NOT NULL,
	"tax_rate" real,
	"tax_amount" real,
	"discount_rate" real,
	"discount_amount" real,
	"subtotal" real NOT NULL,
	"total_amount" real NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_id" integer,
	"quotation_number" varchar(50) NOT NULL,
	"issue_date" date DEFAULT now() NOT NULL,
	"expiry_date" date,
	"subtotal" real NOT NULL,
	"tax_amount" real,
	"discount_amount" real,
	"total_amount" real NOT NULL,
	"status" varchar(50) DEFAULT 'draft',
	"notes" text,
	"terms" text,
	"category" varchar(50),
	"currency" varchar(3) DEFAULT 'USD',
	"converted_to_order" boolean DEFAULT false,
	"converted_order_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quotations_quotation_number_unique" UNIQUE("quotation_number")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "role_permissions_role_id_permission_id_unique" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "speech_recognition_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"audio_samples" jsonb,
	"voiceprint_data" jsonb,
	"language" varchar(50) DEFAULT 'en-US',
	"is_active" boolean DEFAULT true,
	"accuracy" real,
	"last_training_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"assigned_to" integer,
	"contact_id" integer,
	"lead_id" integer,
	"deal_id" integer,
	"title" varchar(200) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"priority" varchar(50) DEFAULT 'medium',
	"status" varchar(50) DEFAULT 'pending',
	"due_date" timestamp,
	"completed_at" timestamp,
	"reminder_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"rate" real NOT NULL,
	"type" varchar(50) NOT NULL,
	"region" varchar(100),
	"description" text,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"effective_from" date,
	"effective_to" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"granted" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_permissions_user_id_permission_id_unique" UNIQUE("user_id","permission_id")
);
--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "probability" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "account_group_id" integer;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "payment_portal_token" varchar(255);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "saved_payment_methods" jsonb;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "lead_id" integer;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "stage_id" integer;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "owner_id" integer;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "lost_reason" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "products" jsonb;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_status" varchar(50) DEFAULT 'Unpaid';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "last_payment_date" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "last_payment_amount" real;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "last_payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_due_reminder_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_overdue_reminder_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_thank_you_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "allow_partial_payment" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "allow_online_payment" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "enabled_payment_methods" jsonb;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_instructions" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_terms" varchar(100) DEFAULT 'Net 30';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "is_recurring" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_frequency" varchar(50);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_start_date" date;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_end_date" date;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_count" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_remaining" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "next_invoice_date" date;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "parent_recurring_invoice_id" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "client_portal_url" varchar(500);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "pdf_generated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "pdf_url" varchar(500);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "email_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "email_sent_date" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "tax_inclusive" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "tax_type" varchar(50);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "exchange_rate" real DEFAULT 1;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "base_currency" varchar(3) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_link" varchar(1000);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "auto_reminder_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "late_fee_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "late_fee_amount" real;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "late_fee_percentage" real;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_invoice_id" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_schedule" jsonb;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_portal_token" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "invoice_id" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_gateway" varchar(50);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "transaction_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_fee" real;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_response" jsonb;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refund_status" varchar(20);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refund_amount" real;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refund_transaction_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refund_date" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refund_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "is_recurring" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "recurring_profile_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "payroll" ADD COLUMN "payroll_items" jsonb;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "role_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_id" integer;--> statement-breakpoint
ALTER TABLE "account_group_relations" ADD CONSTRAINT "account_group_relations_account_group_id_account_groups_id_fk" FOREIGN KEY ("account_group_id") REFERENCES "public"."account_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_group_relations" ADD CONSTRAINT "account_group_relations_parent_account_group_id_account_groups_id_fk" FOREIGN KEY ("parent_account_group_id") REFERENCES "public"."account_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_groups" ADD CONSTRAINT "account_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_companies" ADD CONSTRAINT "crm_companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_stages" ADD CONSTRAINT "deal_stages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_fiscal_year_id_fiscal_years_id_fk" FOREIGN KEY ("fiscal_year_id") REFERENCES "public"."fiscal_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_fiscal_period_id_fiscal_periods_id_fk" FOREIGN KEY ("fiscal_period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_fiscal_year_id_fiscal_years_id_fk" FOREIGN KEY ("fiscal_year_id") REFERENCES "public"."fiscal_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_years" ADD CONSTRAINT "fiscal_years_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_activities" ADD CONSTRAINT "invoice_activities_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_activities" ADD CONSTRAINT "invoice_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_tokens" ADD CONSTRAINT "invoice_tokens_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_tokens" ADD CONSTRAINT "invoice_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_fiscal_year_id_fiscal_years_id_fk" FOREIGN KEY ("fiscal_year_id") REFERENCES "public"."fiscal_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_converted_order_id_orders_id_fk" FOREIGN KEY ("converted_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speech_recognition_profiles" ADD CONSTRAINT "speech_recognition_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "currency_rates_pair_idx" ON "currency_rates" USING btree ("from_currency","to_currency");--> statement-breakpoint
CREATE INDEX "currency_rates_date_idx" ON "currency_rates" USING btree ("rate_date");--> statement-breakpoint
CREATE INDEX "invoice_activities_invoice_id_idx" ON "invoice_activities" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_activities_type_idx" ON "invoice_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "invoice_activities_created_at_idx" ON "invoice_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_links_token_idx" ON "payment_links" USING btree ("link_token");--> statement-breakpoint
CREATE INDEX "payment_links_invoice_id_idx" ON "payment_links" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payment_history_event_timestamp_idx" ON "payment_history" USING btree ("event_timestamp");--> statement-breakpoint
CREATE INDEX "payment_history_invoice_id_idx" ON "payment_history" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payment_history_payment_id_idx" ON "payment_history" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_reminders_invoice_id_idx" ON "payment_reminders" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payment_reminders_reminder_date_idx" ON "payment_reminders" USING btree ("reminder_date");--> statement-breakpoint
CREATE INDEX "payment_reminders_status_idx" ON "payment_reminders" USING btree ("status");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_account_group_id_account_groups_id_fk" FOREIGN KEY ("account_group_id") REFERENCES "public"."account_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_deal_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."deal_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "invoices" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "invoice_due_date_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "invoice_contact_id_idx" ON "invoices" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "invoice_recurring_idx" ON "invoices" USING btree ("is_recurring");--> statement-breakpoint
CREATE INDEX "invoice_next_date_idx" ON "invoices" USING btree ("next_invoice_date");--> statement-breakpoint
CREATE INDEX "payment_gateway_idx" ON "payments" USING btree ("payment_gateway");--> statement-breakpoint
CREATE INDEX "payments_invoice_id_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "payment_method";--> statement-breakpoint
ALTER TABLE "user_roles" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "user_roles" DROP COLUMN "permissions";--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_role_id_unique" UNIQUE("user_id","role_id");