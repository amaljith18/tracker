CREATE TABLE "links" (
	"id" text PRIMARY KEY,
	"label" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"sequence" bigserial PRIMARY KEY,
	"link_id" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"accuracy" double precision,
	"at" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "locations_link_id_idx" ON "locations" ("link_id");--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_link_id_links_id_fkey" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE CASCADE;