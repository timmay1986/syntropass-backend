CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "vault_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"invitee_email" varchar(255) NOT NULL,
	"invitee_id" uuid,
	"permission" "permission" DEFAULT 'read' NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"encrypted_vault_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_vault_id" uuid;--> statement-breakpoint
ALTER TABLE "vault_invites" ADD CONSTRAINT "vault_invites_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_invites" ADD CONSTRAINT "vault_invites_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_invites" ADD CONSTRAINT "vault_invites_invitee_id_users_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;