
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "app_parameters": {
                  Row: {
                    "created_at": string,"description": string,"key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description": string,"key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"category_map": {
                  Row: {
                    "category": string,"category_group": string,"created_at": string,"is_sensitive": boolean,"is_visitable": boolean,"overture_category": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"category_group": string,"created_at"?: string,"is_sensitive": boolean,"is_visitable": boolean,"overture_category": string,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string,"category_group"?: string,"created_at"?: string,"is_sensitive"?: boolean,"is_visitable"?: boolean,"overture_category"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"cities": {
                  Row: {
                    "boundary": unknown,"country_id": string,"created_at": string,"gers_id": string,"id": string,"name": string,"source": string,"state": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "boundary": unknown,"country_id": string,"created_at"?: string,"gers_id": string,"id"?: string,"name": string,"source"?: string,"state"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "boundary"?: unknown,"country_id"?: string,"created_at"?: string,"gers_id"?: string,"id"?: string,"name"?: string,"source"?: string,"state"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cities_country_id_fkey"
      columns: ["country_id"]
isOneToOne: false
      referencedRelation: "countries"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "created_at": string,"granted": boolean,"id": string,"policy_version": string,"purpose": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"granted": boolean,"id"?: string,"policy_version": string,"purpose": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"granted"?: boolean,"id"?: string,"policy_version"?: string,"purpose"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"countries": {
                  Row: {
                    "boundary": unknown,"created_at": string,"id": string,"iso_code": string,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "boundary": unknown,"created_at"?: string,"id"?: string,"iso_code": string,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "boundary"?: unknown,"created_at"?: string,"id"?: string,"iso_code"?: string,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"follows": {
                  Row: {
                    "created_at": string,"followee_id": string,"follower_id": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"followee_id": string,"follower_id": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"followee_id"?: string,"follower_id"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_followee_id_fkey"
      columns: ["followee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_follower_id_fkey"
      columns: ["follower_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"overture_imports": {
                  Row: {
                    "added": number,"changed": number,"created_at": string,"flagged": number,"id": string,"in_review": number,"merged": number,"not_visitable": number,"ran_at": string,"reconciled": number,"release": string,"removed": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added"?: number,"changed"?: number,"created_at"?: string,"flagged"?: number,"id"?: string,"in_review"?: number,"merged"?: number,"not_visitable"?: number,"ran_at"?: string,"reconciled"?: number,"release": string,"removed"?: number,"updated_at"?: string
                  }
                  Update: {
                    "added"?: number,"changed"?: number,"created_at"?: string,"flagged"?: number,"id"?: string,"in_review"?: number,"merged"?: number,"not_visitable"?: number,"ran_at"?: string,"reconciled"?: number,"release"?: string,"removed"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"places": {
                  Row: {
                    "address": string | null,"category": string | null,"category_override": string | null,"city_id": string,"confidence": number | null,"created_at": string,"gers_id": string | null,"id": string,"is_sensitive": boolean,"is_visitable": boolean,"location": unknown,"merged_gers_ids": (string)[],"merged_into_id": string | null,"name": string,"origin": string,"other_names": string | null,"overture_category": string | null,"postal_code": string | null,"search_name": string | null,"sources": (string)[],"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"category"?: string | null,"category_override"?: string | null,"city_id": string,"confidence"?: number | null,"created_at"?: string,"gers_id"?: string | null,"id"?: string,"is_sensitive"?: boolean,"is_visitable": boolean,"location": unknown,"merged_gers_ids"?: (string)[],"merged_into_id"?: string | null,"name": string,"origin"?: string,"other_names"?: string | null,"overture_category"?: string | null,"postal_code"?: string | null,"search_name"?: never,"sources"?: (string)[],"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"category"?: string | null,"category_override"?: string | null,"city_id"?: string,"confidence"?: number | null,"created_at"?: string,"gers_id"?: string | null,"id"?: string,"is_sensitive"?: boolean,"is_visitable"?: boolean,"location"?: unknown,"merged_gers_ids"?: (string)[],"merged_into_id"?: string | null,"name"?: string,"origin"?: string,"other_names"?: string | null,"overture_category"?: string | null,"postal_code"?: string | null,"search_name"?: never,"sources"?: (string)[],"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "places_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "places_merged_into_id_fkey"
      columns: ["merged_into_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"updated_at": string,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"name": string,"updated_at"?: string,"username": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"updated_at"?: string,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles_private": {
                  Row: {
                    "age_confirmed_at": string,"created_at": string,"default_visibility": string,"home_city_id": string,"show_home_city": boolean,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "age_confirmed_at"?: string,"created_at"?: string,"default_visibility"?: string,"home_city_id": string,"show_home_city"?: boolean,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "age_confirmed_at"?: string,"created_at"?: string,"default_visibility"?: string,"home_city_id"?: string,"show_home_city"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_private_home_city_id_fkey"
      columns: ["home_city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    }
                  ]
                },"tags": {
                  Row: {
                    "created_at": string,"id": string,"is_active": boolean,"kind": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"is_active"?: boolean,"kind": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"kind"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"trips": {
                  Row: {
                    "closes_at": string,"created_at": string,"id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "closes_at": string,"created_at"?: string,"id"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "closes_at"?: string,"created_at"?: string,"id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trips_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"visit_tags": {
                  Row: {
                    "tag_id": string,"visit_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "tag_id": string,"visit_id": string
                  }
                  Update: {
                    "tag_id"?: string,"visit_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "visit_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visit_tags_visit_id_fkey"
      columns: ["visit_id"]
isOneToOne: false
      referencedRelation: "visits"
      referencedColumns: ["id"]
    }
                  ]
                },"visits": {
                  Row: {
                    "created_at": string,"id": string,"is_resident": boolean,"place_id": string,"publish_at": string,"publish_on": string | null,"rating": number,"trip_id": string | null,"updated_at": string,"user_id": string,"visibility": string,"visited_on": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_resident": boolean,"place_id": string,"publish_at": string,"publish_on"?: never,"rating": number,"trip_id"?: string | null,"updated_at"?: string,"user_id"?: string,"visibility": string,"visited_on": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_resident"?: boolean,"place_id"?: string,"publish_at"?: string,"publish_on"?: never,"rating"?: number,"trip_id"?: string | null,"updated_at"?: string,"user_id"?: string,"visibility"?: string,"visited_on"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "visits_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visits_trip_id_user_id_fkey"
      columns: ["trip_id","user_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "visits_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "close_trip":
{ Args: { "p_trip_id": string }; Returns: undefined
                           },
"complete_signup":
{ Args: { "p_age_confirmed": boolean,"p_granted_purposes"?: (string)[],"p_home_city_id": string,"p_name": string,"p_policy_accepted": boolean,"p_username": string }; Returns: undefined
                           },
"create_visit":
{ Args: { "p_place_id": string,"p_rating": number,"p_tag_ids"?: (string)[],"p_visibility"?: string,"p_visited_on": string }; Returns: {
              "id": string,"publish_on": string,"visibility": string
            }[]
                           },
"limit_api_writes":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"my_visited_places":
{ Args: Record<PropertyKey, never>; Returns: {
              "away_visit_count": number,"category": string,"city_id": string,"city_latitude": number,"city_longitude": number,"city_name": string,"city_state": string,"country_code": string,"is_resident": boolean,"last_visited_on": string,"latitude": number,"longitude": number,"name": string,"place_id": string,"rating": number,"visit_count": number
            }[]
                           },
"nearby_places":
{ Args: { "p_latitude": number,"p_longitude": number }; Returns: {
              "address": string,"category": string,"distance_meters": number,"id": string,"is_sensitive": boolean,"is_visitable": boolean,"name": string
            }[]
                           },
"publish_visit_now":
{ Args: { "p_visit_id": string }; Returns: string
                           },
"search_cities":
{ Args: { "p_query": string }; Returns: {
              "id": string,"name": string,"state": string
            }[]
                           },
"search_places":
{ Args: { "p_latitude"?: number,"p_longitude"?: number,"p_query": string }; Returns: {
              "address": string,"category": string,"distance_meters": number,"id": string,"is_sensitive": boolean,"is_visitable": boolean,"name": string
            }[]
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
