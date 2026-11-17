// Endereço e chave PUBLICÁVEL do Supabase. Os dois são públicos por natureza
// (vão para o navegador); a proteção dos dados é feita pelo RLS no banco.
// Nunca coloque aqui a chave secreta (service role).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://iigvtcqtmmgcbahheqdv.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_Hfvz5lMFMAohKzHIFa1qbg_Seqzlfh1";
