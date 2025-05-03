import { createClient } from '@supabase/supabase-js'

// Ambil URL dan Kunci Anon Supabase dari environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Pastikan variabel environment tersedia
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in environment variables");
}

// Buat instance klien Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Ekspor instance sebagai default (opsional, bisa juga export biasa)
// export default supabase;
// Penggunaan export biasa lebih umum dan memudahkan tree-shaking/import individual jika diperlukan 