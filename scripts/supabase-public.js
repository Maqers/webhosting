/**
 * Supabase URL + public (anon) key for build scripts.
 * src/config/supabaseConfig.js uses import.meta.env, which only exists inside
 * Vite, so Node can't import it. Read the values out of that file instead of
 * duplicating them, so there is still one place to change them.
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const configSrc = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../src/config/supabaseConfig.js'),
  'utf8'
)

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || configSrc.match(/SUPABASE_URL\s*=[\s\S]*?"(https:\/\/[^"]+)"/)[1]

export const SUPABASE_PUBLIC_KEY = configSrc.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/)[1]
export const SUPABASE_REVIEWS_URL = `${SUPABASE_URL}/rest/v1/reviews?select=product_id,name,rating,text,created_at`
