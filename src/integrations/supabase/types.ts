export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json | null;
          project_id: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          project_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
          project_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_action_approvals: {
        Row: {
          action_id: string;
          created_at: string;
          decision: string;
          id: string;
          note: string | null;
          user_id: string;
        };
        Insert: {
          action_id: string;
          created_at?: string;
          decision: string;
          id?: string;
          note?: string | null;
          user_id: string;
        };
        Update: {
          action_id?: string;
          created_at?: string;
          decision?: string;
          id?: string;
          note?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_action_approvals_action_id_fkey";
            columns: ["action_id"];
            isOneToOne: false;
            referencedRelation: "ai_actions";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_actions: {
        Row: {
          agent_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          needs_approval: boolean;
          payload: Json;
          prompt: string | null;
          result: Json | null;
          sources: Json;
          status: Database["public"]["Enums"]["ai_action_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          needs_approval?: boolean;
          payload?: Json;
          prompt?: string | null;
          result?: Json | null;
          sources?: Json;
          status?: Database["public"]["Enums"]["ai_action_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          needs_approval?: boolean;
          payload?: Json;
          prompt?: string | null;
          result?: Json | null;
          sources?: Json;
          status?: Database["public"]["Enums"]["ai_action_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_actions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_runs: {
        Row: {
          agent_id: string;
          analyzed: Json | null;
          confidence: Database["public"]["Enums"]["ai_confidence"] | null;
          created_at: string;
          found: Json | null;
          id: string;
          input: Json | null;
          missing: Json | null;
          output: Json | null;
          recommendation: string | null;
          user_id: string;
        };
        Insert: {
          agent_id: string;
          analyzed?: Json | null;
          confidence?: Database["public"]["Enums"]["ai_confidence"] | null;
          created_at?: string;
          found?: Json | null;
          id?: string;
          input?: Json | null;
          missing?: Json | null;
          output?: Json | null;
          recommendation?: string | null;
          user_id: string;
        };
        Update: {
          agent_id?: string;
          analyzed?: Json | null;
          confidence?: Database["public"]["Enums"]["ai_confidence"] | null;
          created_at?: string;
          found?: Json | null;
          id?: string;
          input?: Json | null;
          missing?: Json | null;
          output?: Json | null;
          recommendation?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_runs_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agents: {
        Row: {
          action_permissions: Json;
          allowed_data: Json;
          created_at: string;
          expires_at: string | null;
          id: string;
          min_confidence: Database["public"]["Enums"]["ai_confidence"];
          name: string;
          output_format: string | null;
          purpose: string;
          scope: string | null;
          status: Database["public"]["Enums"]["ai_agent_status"];
          system_prompt: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          action_permissions?: Json;
          allowed_data?: Json;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          min_confidence?: Database["public"]["Enums"]["ai_confidence"];
          name: string;
          output_format?: string | null;
          purpose: string;
          scope?: string | null;
          status?: Database["public"]["Enums"]["ai_agent_status"];
          system_prompt?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          action_permissions?: Json;
          allowed_data?: Json;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          min_confidence?: Database["public"]["Enums"]["ai_confidence"];
          name?: string;
          output_format?: string | null;
          purpose?: string;
          scope?: string | null;
          status?: Database["public"]["Enums"]["ai_agent_status"];
          system_prompt?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_confidence_logs: {
        Row: {
          confidence: Database["public"]["Enums"]["ai_confidence"];
          created_at: string;
          id: string;
          rationale: string | null;
          sources: Json;
          subject: string;
          subject_id: string | null;
          user_id: string;
        };
        Insert: {
          confidence: Database["public"]["Enums"]["ai_confidence"];
          created_at?: string;
          id?: string;
          rationale?: string | null;
          sources?: Json;
          subject: string;
          subject_id?: string | null;
          user_id: string;
        };
        Update: {
          confidence?: Database["public"]["Enums"]["ai_confidence"];
          created_at?: string;
          id?: string;
          rationale?: string | null;
          sources?: Json;
          subject?: string;
          subject_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_memories: {
        Row: {
          confidence: Database["public"]["Enums"]["ai_confidence"];
          created_at: string;
          id: string;
          key: string;
          metadata: Json;
          related_person_id: string | null;
          related_project_id: string | null;
          source_text: string | null;
          source_url: string | null;
          status: Database["public"]["Enums"]["ai_memory_status"];
          type: Database["public"]["Enums"]["ai_memory_type"];
          updated_at: string;
          user_id: string;
          value: string;
          zone: Database["public"]["Enums"]["ai_privacy_zone"];
        };
        Insert: {
          confidence?: Database["public"]["Enums"]["ai_confidence"];
          created_at?: string;
          id?: string;
          key: string;
          metadata?: Json;
          related_person_id?: string | null;
          related_project_id?: string | null;
          source_text?: string | null;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["ai_memory_status"];
          type: Database["public"]["Enums"]["ai_memory_type"];
          updated_at?: string;
          user_id: string;
          value: string;
          zone?: Database["public"]["Enums"]["ai_privacy_zone"];
        };
        Update: {
          confidence?: Database["public"]["Enums"]["ai_confidence"];
          created_at?: string;
          id?: string;
          key?: string;
          metadata?: Json;
          related_person_id?: string | null;
          related_project_id?: string | null;
          source_text?: string | null;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["ai_memory_status"];
          type?: Database["public"]["Enums"]["ai_memory_type"];
          updated_at?: string;
          user_id?: string;
          value?: string;
          zone?: Database["public"]["Enums"]["ai_privacy_zone"];
        };
        Relationships: [];
      };
      ai_memory_sources: {
        Row: {
          created_at: string;
          excerpt: string | null;
          id: string;
          memory_id: string;
          source_id: string | null;
          source_type: string;
        };
        Insert: {
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          memory_id: string;
          source_id?: string | null;
          source_type: string;
        };
        Update: {
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          memory_id?: string;
          source_id?: string | null;
          source_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_memory_sources_memory_id_fkey";
            columns: ["memory_id"];
            isOneToOne: false;
            referencedRelation: "ai_memories";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_questions: {
        Row: {
          answer: string | null;
          answered_at: string | null;
          context: Json | null;
          created_at: string;
          id: string;
          kind: string;
          question: string;
          status: Database["public"]["Enums"]["ai_question_status"];
          user_id: string;
        };
        Insert: {
          answer?: string | null;
          answered_at?: string | null;
          context?: Json | null;
          created_at?: string;
          id?: string;
          kind?: string;
          question: string;
          status?: Database["public"]["Enums"]["ai_question_status"];
          user_id: string;
        };
        Update: {
          answer?: string | null;
          answered_at?: string | null;
          context?: Json | null;
          created_at?: string;
          id?: string;
          kind?: string;
          question?: string;
          status?: Database["public"]["Enums"]["ai_question_status"];
          user_id?: string;
        };
        Relationships: [];
      };
      ai_reminders: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          priority: string;
          related_object_id: string | null;
          related_object_type: string | null;
          reminder_time: string;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          priority?: string;
          related_object_id?: string | null;
          related_object_type?: string | null;
          reminder_time: string;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          priority?: string;
          related_object_id?: string | null;
          related_object_type?: string | null;
          reminder_time?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_rules: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          rule: string;
          scope: string | null;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          rule: string;
          scope?: string | null;
          user_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          rule?: string;
          scope?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_workflow_steps: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          owner_id: string | null;
          position: number;
          template_ref: string | null;
          title: string;
          workflow_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          owner_id?: string | null;
          position?: number;
          template_ref?: string | null;
          title: string;
          workflow_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          owner_id?: string | null;
          position?: number;
          template_ref?: string | null;
          title?: string;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_workflow_steps_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "ai_workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_workflows: {
        Row: {
          created_at: string;
          description: string | null;
          expected_output: string | null;
          id: string;
          metadata: Json;
          name: string;
          reminders: Json;
          status: Database["public"]["Enums"]["ai_workflow_status"];
          trigger: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          expected_output?: string | null;
          id?: string;
          metadata?: Json;
          name: string;
          reminders?: Json;
          status?: Database["public"]["Enums"]["ai_workflow_status"];
          trigger?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          expected_output?: string | null;
          id?: string;
          metadata?: Json;
          name?: string;
          reminders?: Json;
          status?: Database["public"]["Enums"]["ai_workflow_status"];
          trigger?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      assistant_preferences: {
        Row: {
          disabled_memory_types: Json;
          memory_enabled: boolean;
          mode: Database["public"]["Enums"]["ai_assistant_mode"];
          monitoring_scope: Json;
          notification_level: number;
          proactive_level: number;
          quiet_hours_end: string | null;
          quiet_hours_start: string | null;
          strictness: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          disabled_memory_types?: Json;
          memory_enabled?: boolean;
          mode?: Database["public"]["Enums"]["ai_assistant_mode"];
          monitoring_scope?: Json;
          notification_level?: number;
          proactive_level?: number;
          quiet_hours_end?: string | null;
          quiet_hours_start?: string | null;
          strictness?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          disabled_memory_types?: Json;
          memory_enabled?: boolean;
          mode?: Database["public"]["Enums"]["ai_assistant_mode"];
          monitoring_scope?: Json;
          notification_level?: number;
          proactive_level?: number;
          quiet_hours_end?: string | null;
          quiet_hours_start?: string | null;
          strictness?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_email: string | null;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json;
          module: string | null;
          organization_id: string | null;
          severity: string;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          module?: string | null;
          organization_id?: string | null;
          severity?: string;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          module?: string | null;
          organization_id?: string | null;
          severity?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      channel_members: {
        Row: {
          channel_id: string;
          created_at: string;
          id: string;
          last_read_at: string | null;
          muted: boolean;
          role: string;
          user_id: string;
        };
        Insert: {
          channel_id: string;
          created_at?: string;
          id?: string;
          last_read_at?: string | null;
          muted?: boolean;
          role?: string;
          user_id: string;
        };
        Update: {
          channel_id?: string;
          created_at?: string;
          id?: string;
          last_read_at?: string | null;
          muted?: boolean;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
        ];
      };
      channels: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          project_id: string | null;
          slug: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          project_id?: string | null;
          slug?: string | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          project_id?: string | null;
          slug?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "channels_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      context_graph_edges: {
        Row: {
          created_at: string;
          edge_type: string;
          id: string;
          source_node: string;
          target_node: string;
          user_id: string;
          weight: number;
        };
        Insert: {
          created_at?: string;
          edge_type?: string;
          id?: string;
          source_node: string;
          target_node: string;
          user_id: string;
          weight?: number;
        };
        Update: {
          created_at?: string;
          edge_type?: string;
          id?: string;
          source_node?: string;
          target_node?: string;
          user_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "context_graph_edges_source_node_fkey";
            columns: ["source_node"];
            isOneToOne: false;
            referencedRelation: "context_graph_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "context_graph_edges_target_node_fkey";
            columns: ["target_node"];
            isOneToOne: false;
            referencedRelation: "context_graph_nodes";
            referencedColumns: ["id"];
          },
        ];
      };
      context_graph_nodes: {
        Row: {
          created_at: string;
          id: string;
          label: string;
          metadata: Json;
          node_ref: string | null;
          node_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          label: string;
          metadata?: Json;
          node_ref?: string | null;
          node_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          label?: string;
          metadata?: Json;
          node_ref?: string | null;
          node_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      data_quality_issues: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          kind: Database["public"]["Enums"]["data_quality_kind"];
          resolved: boolean;
          resolved_at: string | null;
          subject_id: string | null;
          subject_type: string;
          suggested_fix: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          kind: Database["public"]["Enums"]["data_quality_kind"];
          resolved?: boolean;
          resolved_at?: string | null;
          subject_id?: string | null;
          subject_type: string;
          suggested_fix?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["data_quality_kind"];
          resolved?: boolean;
          resolved_at?: string | null;
          subject_id?: string | null;
          subject_type?: string;
          suggested_fix?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      decision_approvals: {
        Row: {
          comment: string | null;
          created_at: string;
          decision_id: string;
          id: string;
          user_id: string;
          vote: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          decision_id: string;
          id?: string;
          user_id: string;
          vote: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          decision_id?: string;
          id?: string;
          user_id?: string;
          vote?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decision_approvals_decision_id_fkey";
            columns: ["decision_id"];
            isOneToOne: false;
            referencedRelation: "decisions";
            referencedColumns: ["id"];
          },
        ];
      };
      decisions: {
        Row: {
          context: string | null;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          due_at: string | null;
          id: string;
          impact: Database["public"]["Enums"]["decision_impact"];
          message_id: string | null;
          project_id: string | null;
          rationale: string | null;
          recommendation: string | null;
          requested_by: string | null;
          review_at: string | null;
          status: Database["public"]["Enums"]["decision_status"];
          tags: string[] | null;
          task_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          context?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          due_at?: string | null;
          id?: string;
          impact?: Database["public"]["Enums"]["decision_impact"];
          message_id?: string | null;
          project_id?: string | null;
          rationale?: string | null;
          recommendation?: string | null;
          requested_by?: string | null;
          review_at?: string | null;
          status?: Database["public"]["Enums"]["decision_status"];
          tags?: string[] | null;
          task_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          context?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          due_at?: string | null;
          id?: string;
          impact?: Database["public"]["Enums"]["decision_impact"];
          message_id?: string | null;
          project_id?: string | null;
          rationale?: string | null;
          recommendation?: string | null;
          requested_by?: string | null;
          review_at?: string | null;
          status?: Database["public"]["Enums"]["decision_status"];
          tags?: string[] | null;
          task_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decisions_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "decisions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "decisions_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      departments: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          name: string;
          organization_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          organization_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      document_translations: {
        Row: {
          content: string;
          created_at: string;
          created_by: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          language: string;
          title: string | null;
          translated_by: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          created_by?: string | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          language: string;
          title?: string | null;
          translated_by?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          created_by?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          language?: string;
          title?: string | null;
          translated_by?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_logs: {
        Row: {
          body_html: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          language: string | null;
          module: string | null;
          recipient_email: string;
          recipient_user_id: string | null;
          sent_at: string | null;
          status: string;
          subject: string | null;
          template_slug: string | null;
          triggered_by: string | null;
          variables: Json | null;
        };
        Insert: {
          body_html?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          language?: string | null;
          module?: string | null;
          recipient_email: string;
          recipient_user_id?: string | null;
          sent_at?: string | null;
          status?: string;
          subject?: string | null;
          template_slug?: string | null;
          triggered_by?: string | null;
          variables?: Json | null;
        };
        Update: {
          body_html?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          language?: string | null;
          module?: string | null;
          recipient_email?: string;
          recipient_user_id?: string | null;
          sent_at?: string | null;
          status?: string;
          subject?: string | null;
          template_slug?: string | null;
          triggered_by?: string | null;
          variables?: Json | null;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          body_html: string;
          body_text: string | null;
          category: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          language: string;
          name: string;
          slug: string;
          subject: string;
          updated_at: string;
          updated_by: string | null;
          variables: Json;
        };
        Insert: {
          body_html: string;
          body_text?: string | null;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          language?: string;
          name: string;
          slug: string;
          subject: string;
          updated_at?: string;
          updated_by?: string | null;
          variables?: Json;
        };
        Update: {
          body_html?: string;
          body_text?: string | null;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          language?: string;
          name?: string;
          slug?: string;
          subject?: string;
          updated_at?: string;
          updated_by?: string | null;
          variables?: Json;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          label: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          label?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          label?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          custom_message: string | null;
          department_id: string | null;
          email: string;
          expires_at: string;
          full_name: string | null;
          id: string;
          invited_by: string | null;
          language: string | null;
          organization_id: string | null;
          project_ids: string[] | null;
          role: Database["public"]["Enums"]["app_role"];
          status: string;
          team_id: string | null;
          timezone: string | null;
          token: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          custom_message?: string | null;
          department_id?: string | null;
          email: string;
          expires_at?: string;
          full_name?: string | null;
          id?: string;
          invited_by?: string | null;
          language?: string | null;
          organization_id?: string | null;
          project_ids?: string[] | null;
          role?: Database["public"]["Enums"]["app_role"];
          status?: string;
          team_id?: string | null;
          timezone?: string | null;
          token?: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          custom_message?: string | null;
          department_id?: string | null;
          email?: string;
          expires_at?: string;
          full_name?: string | null;
          id?: string;
          invited_by?: string | null;
          language?: string | null;
          organization_id?: string | null;
          project_ids?: string[] | null;
          role?: Database["public"]["Enums"]["app_role"];
          status?: string;
          team_id?: string | null;
          timezone?: string | null;
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      languages: {
        Row: {
          code: string;
          created_at: string;
          enabled: boolean;
          flag: string | null;
          name: string;
          native_name: string;
          rtl: boolean;
          sort_order: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          enabled?: boolean;
          flag?: string | null;
          name: string;
          native_name: string;
          rtl?: boolean;
          sort_order?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          enabled?: boolean;
          flag?: string | null;
          name?: string;
          native_name?: string;
          rtl?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      message_reactions: {
        Row: {
          created_at: string;
          emoji: string;
          id: string;
          message_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          emoji: string;
          id?: string;
          message_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          emoji?: string;
          id?: string;
          message_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      message_read_receipts: {
        Row: {
          id: string;
          message_id: string;
          read_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          read_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          read_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      message_translations: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          language: string;
          message_id: string;
          translated_by: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          language: string;
          message_id: string;
          translated_by?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          language?: string;
          message_id?: string;
          translated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_translations_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          author_id: string | null;
          body: string;
          channel_id: string;
          created_at: string;
          deleted_at: string | null;
          edited_at: string | null;
          id: string;
          message_type: string;
          metadata: Json;
          original_language: string | null;
          pinned_at: string | null;
          thread_root_id: string | null;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          body: string;
          channel_id: string;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          id?: string;
          message_type?: string;
          metadata?: Json;
          original_language?: string | null;
          pinned_at?: string | null;
          thread_root_id?: string | null;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          channel_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          id?: string;
          message_type?: string;
          metadata?: Json;
          original_language?: string | null;
          pinned_at?: string | null;
          thread_root_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_thread_root_id_fkey";
            columns: ["thread_root_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          body: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          read_at: string | null;
          resolved_at: string | null;
          title: string;
          type: string;
          url: string | null;
          user_id: string;
        };
        Insert: {
          actor_id?: string | null;
          body?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          read_at?: string | null;
          resolved_at?: string | null;
          title: string;
          type: string;
          url?: string | null;
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          body?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          read_at?: string | null;
          resolved_at?: string | null;
          title?: string;
          type?: string;
          url?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          settings: Json;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          settings?: Json;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          settings?: Json;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          key: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          key: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          key?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          auto_translate: boolean;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          date_format: string;
          deleted_at: string | null;
          department: string | null;
          department_id: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          language: string | null;
          last_seen_at: string | null;
          notes: string | null;
          number_format: string;
          office_status: string;
          online_status: string;
          organization_id: string | null;
          phone: string | null;
          position: string | null;
          preferred_language: string;
          secondary_language: string | null;
          status: string;
          time_format: string;
          timezone: string | null;
          updated_at: string;
        };
        Insert: {
          auto_translate?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          date_format?: string;
          deleted_at?: string | null;
          department?: string | null;
          department_id?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          language?: string | null;
          last_seen_at?: string | null;
          notes?: string | null;
          number_format?: string;
          office_status?: string;
          online_status?: string;
          organization_id?: string | null;
          phone?: string | null;
          position?: string | null;
          preferred_language?: string;
          secondary_language?: string | null;
          status?: string;
          time_format?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          auto_translate?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          date_format?: string;
          deleted_at?: string | null;
          department?: string | null;
          department_id?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          language?: string | null;
          last_seen_at?: string | null;
          notes?: string | null;
          number_format?: string;
          office_status?: string;
          online_status?: string;
          organization_id?: string | null;
          phone?: string | null;
          position?: string | null;
          preferred_language?: string;
          secondary_language?: string | null;
          status?: string;
          time_format?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          created_at: string;
          id: string;
          project_id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          project_id: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          project_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          archived_at: string | null;
          budget: number | null;
          category: string | null;
          color: string | null;
          created_at: string;
          created_by: string | null;
          deadline: string | null;
          description: string | null;
          health: string;
          icon: string | null;
          id: string;
          name: string;
          organization_id: string | null;
          owner_id: string | null;
          priority: Database["public"]["Enums"]["project_priority"];
          progress: number;
          slug: string;
          start_date: string | null;
          status: Database["public"]["Enums"]["project_status"];
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          budget?: number | null;
          category?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          deadline?: string | null;
          description?: string | null;
          health?: string;
          icon?: string | null;
          id?: string;
          name: string;
          organization_id?: string | null;
          owner_id?: string | null;
          priority?: Database["public"]["Enums"]["project_priority"];
          progress?: number;
          slug: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          budget?: number | null;
          category?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          deadline?: string | null;
          description?: string | null;
          health?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          organization_id?: string | null;
          owner_id?: string | null;
          priority?: Database["public"]["Enums"]["project_priority"];
          progress?: number;
          slug?: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      recent_items: {
        Row: {
          entity_id: string;
          entity_type: string;
          id: string;
          label: string | null;
          opened_at: string;
          user_id: string;
        };
        Insert: {
          entity_id: string;
          entity_type: string;
          id?: string;
          label?: string | null;
          opened_at?: string;
          user_id: string;
        };
        Update: {
          entity_id?: string;
          entity_type?: string;
          id?: string;
          label?: string | null;
          opened_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      relations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          relation_type: string;
          source_id: string;
          source_type: string;
          target_id: string;
          target_type: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          relation_type?: string;
          source_id: string;
          source_type: string;
          target_id: string;
          target_type: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          relation_type?: string;
          source_id?: string;
          source_type?: string;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          created_at: string;
          id: string;
          permission_key: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          permission_key: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          created_at?: string;
          id?: string;
          permission_key?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey";
            columns: ["permission_key"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["key"];
          },
        ];
      };
      saved_messages: {
        Row: {
          created_at: string;
          id: string;
          message_id: string;
          note: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message_id: string;
          note?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message_id?: string;
          note?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_messages_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      system_settings: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          actual_hours: number | null;
          assignee_id: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          estimated_hours: number | null;
          id: string;
          parent_task_id: string | null;
          position: number;
          priority: Database["public"]["Enums"]["task_priority"];
          project_id: string | null;
          status: Database["public"]["Enums"]["task_status"];
          tags: string[] | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          actual_hours?: number | null;
          assignee_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          id?: string;
          parent_task_id?: string | null;
          position?: number;
          priority?: Database["public"]["Enums"]["task_priority"];
          project_id?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          tags?: string[] | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          actual_hours?: number | null;
          assignee_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          id?: string;
          parent_task_id?: string | null;
          position?: number;
          priority?: Database["public"]["Enums"]["task_priority"];
          project_id?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          tags?: string[] | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey";
            columns: ["parent_task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          created_at: string;
          id: string;
          role: string;
          team_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: string;
          team_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          department_id: string | null;
          description: string | null;
          id: string;
          name: string;
          organization_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          organization_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      translation_memory: {
        Row: {
          approved: boolean;
          created_at: string;
          created_by: string | null;
          id: string;
          source_hash: string;
          source_language: string;
          source_text: string;
          target_language: string;
          target_text: string;
          use_count: number;
        };
        Insert: {
          approved?: boolean;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          source_hash: string;
          source_language: string;
          source_text: string;
          target_language: string;
          target_text: string;
          use_count?: number;
        };
        Update: {
          approved?: boolean;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          source_hash?: string;
          source_language?: string;
          source_text?: string;
          target_language?: string;
          target_text?: string;
          use_count?: number;
        };
        Relationships: [];
      };
      translations: {
        Row: {
          created_at: string;
          id: string;
          key: string;
          language: string;
          namespace: string;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key: string;
          language: string;
          namespace?: string;
          updated_at?: string;
          updated_by?: string | null;
          value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          key?: string;
          language?: string;
          namespace?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "translations_language_fkey";
            columns: ["language"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
        ];
      };
      user_permissions_overrides: {
        Row: {
          created_at: string;
          created_by: string | null;
          granted: boolean;
          id: string;
          permission_key: string;
          reason: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          granted: boolean;
          id?: string;
          permission_key: string;
          reason?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          granted?: boolean;
          id?: string;
          permission_key?: string;
          reason?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_permissions_overrides_permission_key_fkey";
            columns: ["permission_key"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["key"];
          },
        ];
      };
      user_privacy_zones: {
        Row: {
          created_at: string;
          cross_zone_allowed: boolean;
          enabled: boolean;
          id: string;
          notes: string | null;
          user_id: string;
          zone: Database["public"]["Enums"]["ai_privacy_zone"];
        };
        Insert: {
          created_at?: string;
          cross_zone_allowed?: boolean;
          enabled?: boolean;
          id?: string;
          notes?: string | null;
          user_id: string;
          zone: Database["public"]["Enums"]["ai_privacy_zone"];
        };
        Update: {
          created_at?: string;
          cross_zone_allowed?: boolean;
          enabled?: boolean;
          id?: string;
          notes?: string | null;
          user_id?: string;
          zone?: Database["public"]["Enums"]["ai_privacy_zone"];
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string;
          default_project_view: string;
          language: string;
          notifications: Json;
          theme: string;
          timezone: string;
          updated_at: string;
          user_id: string;
          working_hours: Json;
        };
        Insert: {
          created_at?: string;
          default_project_view?: string;
          language?: string;
          notifications?: Json;
          theme?: string;
          timezone?: string;
          updated_at?: string;
          user_id: string;
          working_hours?: Json;
        };
        Update: {
          created_at?: string;
          default_project_view?: string;
          language?: string;
          notifications?: Json;
          theme?: string;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
          working_hours?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_permission: {
        Args: { _permission_key: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
      is_channel_admin: {
        Args: { _channel_id: string; _user_id: string };
        Returns: boolean;
      };
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string };
        Returns: boolean;
      };
      is_super_admin: { Args: { _user_id: string }; Returns: boolean };
      default_organization_id: { Args: Record<string, never>; Returns: string };
      ensure_profile_organization: {
        Args: { _user_id?: string };
        Returns: string;
      };
      current_organization_id: {
        Args: { _user_id?: string };
        Returns: string;
      };
      get_invitation_preview: {
        Args: { _token: string };
        Returns: Json;
      };
      accept_invitation: {
        Args: { _token: string };
        Returns: string;
      };
      log_audit: {
        Args: {
          _action: string;
          _entity_id?: string;
          _entity_type?: string;
          _metadata?: Json;
          _module?: string;
          _severity?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      ai_action_status: "pending" | "approved" | "rejected" | "executed" | "failed";
      ai_agent_status: "proposed" | "active" | "expired" | "revoked";
      ai_assistant_mode:
        | "calm"
        | "executive"
        | "project_controller"
        | "strict_reviewer"
        | "fast_operator"
        | "personal_helper"
        | "silent_observer"
        | "critical_monitor";
      ai_confidence: "high" | "medium" | "low";
      ai_memory_status: "active" | "paused" | "rejected" | "archived";
      ai_memory_type:
        | "user_preference"
        | "project_fact"
        | "people_fact"
        | "company_fact"
        | "decision"
        | "pattern"
        | "correction"
        | "workflow"
        | "writing_style"
        | "communication_style"
        | "priority"
        | "deadline"
        | "risk"
        | "personal";
      ai_privacy_zone: "business" | "personal" | "family" | "health" | "finance" | "legal";
      ai_question_status: "open" | "answered" | "dismissed";
      ai_workflow_status: "draft" | "active" | "archived";
      app_role:
        | "super_admin"
        | "admin"
        | "ceo"
        | "project_manager"
        | "team_lead"
        | "employee"
        | "contractor"
        | "client"
        | "investor"
        | "guest";
      data_quality_kind:
        | "duplicate"
        | "outdated"
        | "unlinked"
        | "no_owner"
        | "no_deadline"
        | "no_agenda"
        | "no_followup"
        | "stale"
        | "conflict"
        | "missing_info";
      decision_impact: "low" | "medium" | "high" | "critical";
      decision_status: "pending" | "approved" | "rejected" | "deferred" | "review";
      project_priority: "critical" | "high" | "medium" | "low";
      project_status:
        | "idea"
        | "planning"
        | "active"
        | "in_progress"
        | "review"
        | "paused"
        | "completed"
        | "archived"
        | "canceled";
      task_priority: "critical" | "high" | "medium" | "low";
      task_status:
        | "backlog"
        | "todo"
        | "in_progress"
        | "review"
        | "testing"
        | "done"
        | "blocked"
        | "canceled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      ai_action_status: ["pending", "approved", "rejected", "executed", "failed"],
      ai_agent_status: ["proposed", "active", "expired", "revoked"],
      ai_assistant_mode: [
        "calm",
        "executive",
        "project_controller",
        "strict_reviewer",
        "fast_operator",
        "personal_helper",
        "silent_observer",
        "critical_monitor",
      ],
      ai_confidence: ["high", "medium", "low"],
      ai_memory_status: ["active", "paused", "rejected", "archived"],
      ai_memory_type: [
        "user_preference",
        "project_fact",
        "people_fact",
        "company_fact",
        "decision",
        "pattern",
        "correction",
        "workflow",
        "writing_style",
        "communication_style",
        "priority",
        "deadline",
        "risk",
        "personal",
      ],
      ai_privacy_zone: ["business", "personal", "family", "health", "finance", "legal"],
      ai_question_status: ["open", "answered", "dismissed"],
      ai_workflow_status: ["draft", "active", "archived"],
      app_role: [
        "super_admin",
        "admin",
        "ceo",
        "project_manager",
        "team_lead",
        "employee",
        "contractor",
        "client",
        "investor",
        "guest",
      ],
      data_quality_kind: [
        "duplicate",
        "outdated",
        "unlinked",
        "no_owner",
        "no_deadline",
        "no_agenda",
        "no_followup",
        "stale",
        "conflict",
        "missing_info",
      ],
      decision_impact: ["low", "medium", "high", "critical"],
      decision_status: ["pending", "approved", "rejected", "deferred", "review"],
      project_priority: ["critical", "high", "medium", "low"],
      project_status: [
        "idea",
        "planning",
        "active",
        "in_progress",
        "review",
        "paused",
        "completed",
        "archived",
        "canceled",
      ],
      task_priority: ["critical", "high", "medium", "low"],
      task_status: [
        "backlog",
        "todo",
        "in_progress",
        "review",
        "testing",
        "done",
        "blocked",
        "canceled",
      ],
    },
  },
} as const;
