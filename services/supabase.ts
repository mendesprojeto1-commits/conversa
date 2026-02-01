
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pkpdidvvvjwdduuolrjh.supabase.co';
const supabaseKey = 'sb_publishable_4XNFF_KTZx_BNn2QZmXUpg_f2gFlSiY';

export const supabase = createClient(supabaseUrl, supabaseKey);
