-- Supabase Database Schema for StockAnalytica Lite

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
  price NUMERIC(15, 2) NOT NULL,
  quantity NUMERIC(15, 4) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Watchlists Table
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Allow public / anon access for dev/demo if auth is not enforced yet, or restrict to auth user
CREATE POLICY "Allow read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete transactions" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Allow read watchlists" ON public.watchlists FOR SELECT USING (true);
CREATE POLICY "Allow insert watchlists" ON public.watchlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete watchlists" ON public.watchlists FOR DELETE USING (true);
