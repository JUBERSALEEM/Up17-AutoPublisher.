/** Reviewed application tables. Regenerate only through a reviewed schema change. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type MemberRole = "owner" | "admin" | "editor" | "viewer";
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};
export interface Database {
  public: {
    Tables: {
      profiles: Table<{ id: string; display_name: string; created_at: string; updated_at: string }>;
      workspaces: Table<{
        id: string;
        name: string;
        created_by: string;
        created_at: string;
        updated_at: string;
      }>;
      workspace_members: Table<{
        workspace_id: string;
        user_id: string;
        role: MemberRole;
        created_at: string;
      }>;
      preferences: Table<{
        workspace_id: string;
        user_id: string;
        settings: Json;
        revision: number;
        updated_at: string;
      }>;
      notifications: Table<{
        id: string;
        workspace_id: string;
        user_id: string;
        category: "processing" | "publishing" | "accounts" | "analytics" | "security";
        title: string;
        body: string;
        action_path: string | null;
        dedupe_key: string;
        read_at: string | null;
        created_at: string;
      }>;
      videos: Table<{
        id: string;
        workspace_id: string;
        title: string;
        storage_path: string;
        state: string;
        mime_type: string;
        size_bytes: number;
      }>;
      platform_connections: Table<{
        id: string;
        workspace_id: string;
        platform: "youtube" | "instagram" | "tiktok";
        provider_account_id: string | null;
        display_name: string;
        state:
          | "pending"
          | "connected"
          | "limited_permissions"
          | "needs_authorisation"
          | "error"
          | "disconnected";
        granted_scopes: string[];
        token_reference: string | null;
        last_verified_at: string | null;
        last_error_code: string | null;
        created_by: string;
        created_at: string;
        updated_at: string;
        social_accounts:
          | { handle: string | null; paused: boolean; publishing_enabled: boolean }
          | { handle: string | null; paused: boolean; publishing_enabled: boolean }[]
          | null;
      }>;
      social_accounts: Table<{
        id: string;
        workspace_id: string;
        connection_id: string;
        platform: "youtube" | "instagram" | "tiktok";
        display_name: string;
        handle: string | null;
        avatar_url: string | null;
        capabilities: Json;
        publishing_enabled: boolean;
        paused: boolean;
        timezone: string;
        created_at: string;
        updated_at: string;
      }>;
      audit_logs: Table<{
        id: number;
        workspace_id: string;
        actor_id: string | null;
        action: string;
        target_type: string;
        target_id: string;
        summary: Json;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      save_workspace_preferences: {
        Args: { target_workspace: string; expected_revision: number; proposed_settings: Json };
        Returns: number;
      };
      up17_ensure_first_workspace: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: { member_role: MemberRole };
    CompositeTypes: Record<string, never>;
  };
}
