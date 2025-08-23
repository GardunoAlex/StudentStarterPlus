export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      opportunities: {
        Row: {
          id: string
          title: string
          organization: string
          description: string
          deadline: string
          gpa: number
          majors: string[]
          class_years: string[]
          location: string
          type: string
          industry: string
          application_link: string
          logo: string
          organization_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          organization: string
          description: string
          deadline: string
          gpa: number
          majors: string[]
          class_years: string[]
          location: string
          type: string
          industry: string
          application_link: string
          logo: string
          organization_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          organization?: string
          description?: string
          deadline?: string
          gpa?: number
          majors?: string[]
          class_years?: string[]
          location?: string
          type?: string
          industry?: string
          application_link?: string
          logo?: string
          organization_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_codes: {
        Row: {
          code: string
          organization_name: string
          email: string
          created_at: string
        }
        Insert: {
          code: string
          organization_name: string
          email: string
          created_at?: string
        }
        Update: {
          code?: string
          organization_name?: string
          email?: string
          created_at?: string
        }
      }
    }
  }
}