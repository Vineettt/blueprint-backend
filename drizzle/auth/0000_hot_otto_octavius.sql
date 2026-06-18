CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_fk_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_fk_id" uuid,
	"email" varchar NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"remark" varchar,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_fk_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_fk_id" uuid NOT NULL,
	"session_fk_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "token_blacklist" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expiry_timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_blacklist_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_fk_id" uuid NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"device_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"login_time" timestamp with time zone DEFAULT now() NOT NULL,
	"logout_time" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"last_activity" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"account_locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"status" integer DEFAULT -1
);
--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_fk_id_users_id_fk" FOREIGN KEY ("user_fk_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_fk_id_users_id_fk" FOREIGN KEY ("user_fk_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_fk_id_users_id_fk" FOREIGN KEY ("user_fk_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_fk_id_users_id_fk" FOREIGN KEY ("user_fk_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_fk_id_user_sessions_id_fk" FOREIGN KEY ("session_fk_id") REFERENCES "public"."user_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_fk_id_users_id_fk" FOREIGN KEY ("user_fk_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_email_verification_user" ON "email_verification_tokens" USING btree ("user_fk_id");--> statement-breakpoint
CREATE INDEX "idx_email_verification_expiry" ON "email_verification_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_login_attempts_user" ON "login_attempts" USING btree ("user_fk_id");--> statement-breakpoint
CREATE INDEX "idx_login_attempts_ip" ON "login_attempts" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_login_attempts_email_attempted_at" ON "login_attempts" USING btree ("attempted_at","email");--> statement-breakpoint
CREATE INDEX "idx_password_reset_user" ON "password_reset_tokens" USING btree ("user_fk_id");--> statement-breakpoint
CREATE INDEX "idx_password_reset_expiry" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_session_fk" ON "refresh_tokens" USING btree ("session_fk_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_active_expiry" ON "refresh_tokens" USING btree ("user_fk_id","is_active","expires_at");--> statement-breakpoint
CREATE INDEX "idx_token_blacklist_expiry" ON "token_blacklist" USING btree ("expiry_timestamp");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_user_active_last_activity" ON "user_sessions" USING btree ("user_fk_id","is_active","last_activity");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_device_info" ON "user_sessions" USING gin ("device_info");--> statement-breakpoint
CREATE INDEX "idx_users_first_name" ON "users" USING btree ("first_name");--> statement-breakpoint
CREATE INDEX "idx_users_last_name" ON "users" USING btree ("last_name");--> statement-breakpoint
CREATE INDEX "idx_users_account_locked_until" ON "users" USING btree ("account_locked_until");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email_unique_active" ON "users" USING btree ("email") WHERE deleted_at IS NULL;