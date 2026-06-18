CREATE TABLE "role_route_mappings" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"role_fk_id" uuid NOT NULL,
	"route_fk_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "idx_role_route_mappings_unique" UNIQUE("role_fk_id","route_fk_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"endpoint" varchar NOT NULL,
	"method" varchar NOT NULL,
	"status" integer DEFAULT -1,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "idx_routes_endpoint_method_unique" UNIQUE("endpoint","method")
);
--> statement-breakpoint
CREATE TABLE "user_role_mappings" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_fk_id" uuid NOT NULL,
	"role_fk_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "idx_user_role_mappings_unique" UNIQUE("user_fk_id","role_fk_id")
);
--> statement-breakpoint
ALTER TABLE "role_route_mappings" ADD CONSTRAINT "role_route_mappings_role_fk_id_roles_id_fk" FOREIGN KEY ("role_fk_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_route_mappings" ADD CONSTRAINT "role_route_mappings_route_fk_id_routes_id_fk" FOREIGN KEY ("route_fk_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_mappings" ADD CONSTRAINT "user_role_mappings_role_fk_id_roles_id_fk" FOREIGN KEY ("role_fk_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_role_route_mappings_route_fk" ON "role_route_mappings" USING btree ("route_fk_id");--> statement-breakpoint
CREATE INDEX "idx_user_role_mappings_role_fk" ON "user_role_mappings" USING btree ("role_fk_id");