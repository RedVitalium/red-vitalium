export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_goals: {
        Row: {
          created_at: string
          id: string
          set_by: string | null
          target_avg_duration_minutes: number
          target_sessions_per_week: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          set_by?: string | null
          target_avg_duration_minutes?: number
          target_sessions_per_week?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          set_by?: string | null
          target_avg_duration_minutes?: number
          target_sessions_per_week?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_summaries: {
        Row: {
          created_at: string
          data_hash: string
          id: string
          score: number | null
          section: string
          section_scores: Json | null
          summary_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_hash: string
          id?: string
          score?: number | null
          section: string
          section_scores?: Json | null
          summary_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_hash?: string
          id?: string
          score?: number | null
          section?: string
          section_scores?: Json | null
          summary_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          id: string
          modality: string | null
          notes: string | null
          professional_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          id?: string
          modality?: string | null
          notes?: string | null
          professional_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          id?: string
          modality?: string | null
          notes?: string | null
          professional_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      biomarkers: {
        Row: {
          albumin: number | null
          alkaline_phosphatase: number | null
          biological_age: number | null
          c_reactive_protein: number | null
          creatinine: number | null
          glucose: number | null
          id: string
          lymphocyte_percentage: number | null
          mean_cell_volume: number | null
          recorded_at: string
          recorded_by: string | null
          red_cell_distribution_width: number | null
          user_id: string
          white_blood_cell_count: number | null
        }
        Insert: {
          albumin?: number | null
          alkaline_phosphatase?: number | null
          biological_age?: number | null
          c_reactive_protein?: number | null
          creatinine?: number | null
          glucose?: number | null
          id?: string
          lymphocyte_percentage?: number | null
          mean_cell_volume?: number | null
          recorded_at?: string
          recorded_by?: string | null
          red_cell_distribution_width?: number | null
          user_id: string
          white_blood_cell_count?: number | null
        }
        Update: {
          albumin?: number | null
          alkaline_phosphatase?: number | null
          biological_age?: number | null
          c_reactive_protein?: number | null
          creatinine?: number | null
          glucose?: number | null
          id?: string
          lymphocyte_percentage?: number | null
          mean_cell_volume?: number | null
          recorded_at?: string
          recorded_by?: string | null
          red_cell_distribution_width?: number | null
          user_id?: string
          white_blood_cell_count?: number | null
        }
        Relationships: []
      }
      body_composition: {
        Row: {
          bmi: number | null
          bmr: number | null
          body_age: number | null
          body_fat_percent: number | null
          body_type: string | null
          body_water_percent: number | null
          bone_mass: number | null
          created_at: string
          fat_free_mass: number | null
          id: string
          metabolic_age: number | null
          muscle_mass: number | null
          protein: number | null
          recorded_at: string
          recorded_by: string | null
          skeletal_muscle: number | null
          smi: number | null
          source: string | null
          subcutaneous_fat: number | null
          user_id: string
          visceral_fat: number | null
          waist_hip_ratio: number | null
          weight: number | null
        }
        Insert: {
          bmi?: number | null
          bmr?: number | null
          body_age?: number | null
          body_fat_percent?: number | null
          body_type?: string | null
          body_water_percent?: number | null
          bone_mass?: number | null
          created_at?: string
          fat_free_mass?: number | null
          id?: string
          metabolic_age?: number | null
          muscle_mass?: number | null
          protein?: number | null
          recorded_at?: string
          recorded_by?: string | null
          skeletal_muscle?: number | null
          smi?: number | null
          source?: string | null
          subcutaneous_fat?: number | null
          user_id: string
          visceral_fat?: number | null
          waist_hip_ratio?: number | null
          weight?: number | null
        }
        Update: {
          bmi?: number | null
          bmr?: number | null
          body_age?: number | null
          body_fat_percent?: number | null
          body_type?: string | null
          body_water_percent?: number | null
          bone_mass?: number | null
          created_at?: string
          fat_free_mass?: number | null
          id?: string
          metabolic_age?: number | null
          muscle_mass?: number | null
          protein?: number | null
          recorded_at?: string
          recorded_by?: string | null
          skeletal_muscle?: number | null
          smi?: number | null
          source?: string | null
          subcutaneous_fat?: number | null
          user_id?: string
          visceral_fat?: number | null
          waist_hip_ratio?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      daily_survey_questions: {
        Row: {
          created_at: string
          display_order: number
          follow_up_label: string | null
          follow_up_options: Json | null
          habit_category: string | null
          id: string
          is_active: boolean
          question_text: string
          question_type: string
          updated_at: string
          week_end: number
          week_start: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          follow_up_label?: string | null
          follow_up_options?: Json | null
          habit_category?: string | null
          id?: string
          is_active?: boolean
          question_text: string
          question_type?: string
          updated_at?: string
          week_end?: number
          week_start?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          follow_up_label?: string | null
          follow_up_options?: Json | null
          habit_category?: string | null
          id?: string
          is_active?: boolean
          question_text?: string
          question_type?: string
          updated_at?: string
          week_end?: number
          week_start?: number
        }
        Relationships: []
      }
      daily_survey_responses: {
        Row: {
          answer: boolean
          created_at: string
          follow_up_value: number | null
          id: string
          question_id: string
          response_date: string
          user_id: string
        }
        Insert: {
          answer: boolean
          created_at?: string
          follow_up_value?: number | null
          id?: string
          question_id: string
          response_date?: string
          user_id: string
        }
        Update: {
          answer?: boolean
          created_at?: string
          follow_up_value?: number | null
          id?: string
          question_id?: string
          response_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "daily_survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_goals: {
        Row: {
          created_at: string
          habit_type: string
          id: string
          month: number
          set_by: string | null
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_type: string
          id?: string
          month: number
          set_by?: string | null
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          habit_type?: string
          id?: string
          month?: number
          set_by?: string | null
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_data: {
        Row: {
          data_type: string
          id: string
          recorded_at: string
          source: string | null
          unit: string | null
          user_id: string
          value: number
        }
        Insert: {
          data_type: string
          id?: string
          recorded_at?: string
          source?: string | null
          unit?: string | null
          user_id: string
          value: number
        }
        Update: {
          data_type?: string
          id?: string
          recorded_at?: string
          source?: string | null
          unit?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      patient_medications: {
        Row: {
          created_at: string | null
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          medication_name: string
          notes: string | null
          prescribed_by: string | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          medication_name: string
          notes?: string | null
          prescribed_by?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          medication_name?: string
          notes?: string | null
          prescribed_by?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      patient_professionals: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          is_active: boolean
          patient_id: string
          professional_id: string
          specialty: Database["public"]["Enums"]["specialty"]
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          patient_id: string
          professional_id: string
          specialty: Database["public"]["Enums"]["specialty"]
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          patient_id?: string
          professional_id?: string
          specialty?: Database["public"]["Enums"]["specialty"]
        }
        Relationships: [
          {
            foreignKeyName: "patient_professionals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_visible_to_others: boolean
          note_type: string
          patient_id: string
          professional_id: string
          specialty: Database["public"]["Enums"]["specialty"]
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_visible_to_others?: boolean
          note_type?: string
          patient_id: string
          professional_id: string
          specialty: Database["public"]["Enums"]["specialty"]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_visible_to_others?: boolean
          note_type?: string
          patient_id?: string
          professional_id?: string
          specialty?: Database["public"]["Enums"]["specialty"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_notes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          bio: string | null
          consultation_price: number | null
          created_at: string
          id: string
          is_active: boolean
          is_verified: boolean
          license_number: string | null
          location: string | null
          office_address: string | null
          specialty: Database["public"]["Enums"]["specialty"]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          consultation_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          license_number?: string | null
          location?: string | null
          office_address?: string | null
          specialty: Database["public"]["Enums"]["specialty"]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          consultation_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          license_number?: string | null
          location?: string | null
          office_address?: string | null
          specialty?: Database["public"]["Enums"]["specialty"]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          height: number | null
          id: string
          partner_user_id: string | null
          research_consent: boolean | null
          research_consent_at: string | null
          sex: string | null
          shift_type: string | null
          updated_at: string
          user_id: string
          waist_circumference: number | null
          wearable_model: string | null
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          height?: number | null
          id?: string
          partner_user_id?: string | null
          research_consent?: boolean | null
          research_consent_at?: string | null
          sex?: string | null
          shift_type?: string | null
          updated_at?: string
          user_id: string
          waist_circumference?: number | null
          wearable_model?: string | null
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          height?: number | null
          id?: string
          partner_user_id?: string | null
          research_consent?: boolean | null
          research_consent_at?: string | null
          sex?: string | null
          shift_type?: string | null
          updated_at?: string
          user_id?: string
          waist_circumference?: number | null
          wearable_model?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      test_results: {
        Row: {
          completed_at: string
          id: string
          scores: Json
          test_id: string
          test_name: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          scores: Json
          test_id: string
          test_name: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          scores?: Json
          test_id?: string
          test_name?: string
          user_id?: string
        }
        Relationships: []
      }
      unlocked_habits: {
        Row: {
          habit_id: string
          id: string
          target_avg_duration_minutes: number | null
          target_sessions_per_week: number | null
          unlocked_at: string
          unlocked_by: string | null
          user_id: string
        }
        Insert: {
          habit_id: string
          id?: string
          target_avg_duration_minutes?: number | null
          target_sessions_per_week?: number | null
          unlocked_at?: string
          unlocked_by?: string | null
          user_id: string
        }
        Update: {
          habit_id?: string
          id?: string
          target_avg_duration_minutes?: number | null
          target_sessions_per_week?: number | null
          unlocked_at?: string
          unlocked_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_cycles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          started_at: string
          started_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          started_at?: string
          started_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          started_at?: string
          started_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          bedtime: number | null
          breakfast_time: string | null
          created_at: string
          id: string
          notification_settings: Json | null
          notifications_enabled: boolean | null
          reminders: Json | null
          sleep_goal: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bedtime?: number | null
          breakfast_time?: string | null
          created_at?: string
          id?: string
          notification_settings?: Json | null
          notifications_enabled?: boolean | null
          reminders?: Json | null
          sleep_goal?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bedtime?: number | null
          breakfast_time?: string | null
          created_at?: string
          id?: string
          notification_settings?: Json | null
          notifications_enabled?: boolean | null
          reminders?: Json | null
          sleep_goal?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_professional_specialty: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["specialty"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_professional: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "patient" | "professional"
      specialty: "psychology" | "nutrition" | "medicine" | "physiotherapy"
      subscription_plan: "plata" | "oro" | "platino" | "black"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "patient", "professional"],
      specialty: ["psychology", "nutrition", "medicine", "physiotherapy"],
      subscription_plan: ["plata", "oro", "platino", "black"],
    },
  },
} as const
