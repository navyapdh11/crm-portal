// Database types for AR Cleaning AU

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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'customer' | 'cleaner' | 'admin'
          avatar_url: string | null
          stripe_customer_id: string | null
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'cleaner' | 'admin'
          avatar_url?: string | null
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'cleaner' | 'admin'
          avatar_url?: string | null
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cleaners: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          hourly_rate: number
          rating: number
          total_jobs: number
          is_verified: boolean
          is_available: boolean
          service_radius_km: number
          current_location: string | null
          last_seen_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          hourly_rate?: number
          rating?: number
          total_jobs?: number
          is_verified?: boolean
          is_available?: boolean
          service_radius_km?: number
          current_location?: string | null
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          hourly_rate?: number
          rating?: number
          total_jobs?: number
          is_verified?: boolean
          is_available?: boolean
          service_radius_km?: number
          current_location?: string | null
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          base_price: number
          duration_minutes: number
          category: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          base_price: number
          duration_minutes: number
          category: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          base_price?: number
          duration_minutes?: number
          category?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          cleaner_id: string | null
          service_id: string
          status: 'pending' | 'matched' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_at: string
          completed_at: string | null
          total_amount: number
          cleaner_payout: number | null
          platform_fee: number
          address: string
          latitude: number
          longitude: number
          notes: string | null
          payment_intent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          cleaner_id?: string | null
          service_id: string
          status?: 'pending' | 'matched' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_at: string
          completed_at?: string | null
          total_amount: number
          cleaner_payout?: number | null
          platform_fee?: number
          address: string
          latitude: number
          longitude: number
          notes?: string | null
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          cleaner_id?: string | null
          service_id?: string
          status?: 'pending' | 'matched' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_at?: string
          completed_at?: string | null
          total_amount?: number
          cleaner_payout?: number | null
          platform_fee?: number
          address?: string
          latitude?: number
          longitude?: number
          notes?: string | null
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cleaner_locations: {
        Row: {
          id: string
          cleaner_id: string
          location: string
          speed: number
          heading: number
          accuracy: number
          geohash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cleaner_id: string
          location: string
          speed?: number
          heading?: number
          accuracy?: number
          geohash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cleaner_id?: string
          location?: string
          speed?: number
          heading?: number
          accuracy?: number
          geohash?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          stripe_payment_intent_id: string
          amount: number
          currency: string
          status: 'pending' | 'succeeded' | 'failed' | 'refunded'
          payout_id: string | null
          payout_amount: number | null
          payout_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          stripe_payment_intent_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          payout_id?: string | null
          payout_amount?: number | null
          payout_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          stripe_payment_intent_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          payout_id?: string | null
          payout_amount?: number | null
          payout_status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          data?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      cleaner_pnl: {
        Row: {
          cleaner_id: string
          total_earnings: number
          total_payouts: number
          job_count: number
          avg_rating: number
          period_start: string
          period_end: string
        }
      }
      platform_pnl: {
        Row: {
          total_revenue: number
          total_payouts: number
          total_fees: number
          net_profit: number
          booking_count: number
          period_start: string
          period_end: string
        }
      }
    }
    Functions: {
      find_nearby_cleaners: {
        Args: {
          lat: number
          lng: number
          radius_km: number
        }
        Returns: {
          cleaner_id: string
          distance_km: number
          hourly_rate: number
          rating: number
          is_available: boolean
        }[]
      }
    }
  }
}
