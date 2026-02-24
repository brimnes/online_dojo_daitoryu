import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Клиент будет null если переменные не заданы — компоненты сами решают что делать
export const supabase = (url && key) ? createClient(url, key) : null;

// Флаг — подключена ли БД
export const IS_DB_CONNECTED = !!(url && key);
