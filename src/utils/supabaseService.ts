import { supabase, isSupabaseConfigured } from './supabase';
import { Transaction } from '../types/stock';

export interface UserProfile {
  id: string;
  username?: string;
  role?: string;
  display_name?: string;
  alerts_enabled?: number;
}

// 1. Direct Username & Password Authentication against `users` table
export async function loginWithUsernameAndPassword(usernameInput: string, passwordInput: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase URL & ANON_KEY must be configured in environment variables.' };
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', usernameInput.trim())
      .limit(1);

    if (error) {
      console.error('Login database query error:', error);
      return { success: false, error: 'Database query error: ' + error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Username not found.' };
    }

    const user = data[0];

    // Check password (matches direct stored string or hash)
    if (user.password !== passwordInput) {
      return { success: false, error: 'Incorrect password.' };
    }

    // Check role authorization
    if (user.role === 'blocked' || user.role === 'disabled') {
      return { success: false, error: 'Account is disabled or not authorized.' };
    }

    const profile: UserProfile = {
      id: String(user.id),
      username: user.username,
      role: user.role,
      display_name: user.display_name || user.username,
      alerts_enabled: user.alerts_enabled
    };

    return { success: true, user: profile };
  } catch (err: any) {
    console.error('Login error:', err);
    return { success: false, error: err.message || 'Login failed.' };
  }
}

// 2. User Authorization Check against `users` table
export async function checkUserAuthorization(userId: string): Promise<{ isAuthorized: boolean; profile?: UserProfile }> {
  if (!isSupabaseConfigured || !supabase) return { isAuthorized: true };
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .limit(1);

    if (error || !data || data.length === 0) {
      return { isAuthorized: true };
    }

    const user = data[0];
    const isAuthorized = user.role !== 'blocked' && user.role !== 'disabled';
    return {
      isAuthorized,
      profile: {
        id: String(user.id),
        username: user.username,
        role: user.role,
        display_name: user.display_name || user.username
      }
    };
  } catch (err) {
    return { isAuthorized: true };
  }
}

// 2. Transactions & Portfolio Items Sync
export async function fetchUserPortfolioItems(userId: string): Promise<Transaction[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    // First try fetching detailed transaction logs from `transactions` table
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (!txError && txData && txData.length > 0) {
      return txData.map((t: any) => ({
        id: String(t.id),
        symbol: t.symbol,
        type: t.type || 'BUY',
        price: Number(t.price || 0),
        quantity: Number(t.quantity || 0),
        date: t.date || (t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
      }));
    }

    // Fallback: fetch from `portfolio_items` table if `transactions` table is empty
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Fetch portfolio_items error:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id || `tx-${item.ticker}`,
      symbol: item.ticker,
      type: 'BUY',
      price: Number(item.avg_buy || 0),
      quantity: Number(item.lot || 0),
      date: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }));
  } catch (err) {
    console.error('Error fetching transactions/portfolio_items:', err);
    return [];
  }
}

export async function savePortfolioItemToSupabase(
  userId: string, 
  symbol: string, 
  quantity: number, 
  price: number,
  date?: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const txDate = date || new Date().toISOString().split('T')[0];

    // 1. Insert into `transactions` table for full order log history
    const { error: txErr } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        symbol: symbol,
        type: 'BUY',
        price: price,
        quantity: quantity,
        date: txDate
      }]);

    if (txErr) {
      console.warn('Transactions insert warning (table might need to be created):', txErr.message);
    }

    // 2. Insert or update `portfolio_items` table for net position
    const { data: existing } = await supabase
      .from('portfolio_items')
      .select('id, lot, avg_buy')
      .eq('user_id', userId)
      .eq('ticker', symbol)
      .limit(1);

    if (existing && existing.length > 0) {
      const current = existing[0];
      const newLot = Number(current.lot) + quantity;
      const newAvgBuy = ((Number(current.lot) * Number(current.avg_buy)) + (quantity * price)) / newLot;

      const { error } = await supabase
        .from('portfolio_items')
        .update({
          lot: newLot,
          avg_buy: newAvgBuy,
          updated_at: new Date().toISOString()
        })
        .eq('id', current.id);

      return !error;
    } else {
      const { error } = await supabase
        .from('portfolio_items')
        .insert([{
          user_id: userId,
          ticker: symbol,
          lot: quantity,
          avg_buy: price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      return !error;
    }
  } catch (err) {
    console.error('Error saving transaction/portfolio_item:', err);
    return false;
  }
}

export async function deletePortfolioItemFromSupabase(userId: string, symbol: string, txId?: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    // Delete from `transactions` if ID provided
    if (txId && !txId.startsWith('tx-')) {
      await supabase.from('transactions').delete().eq('id', txId);
    }

    // Delete from `portfolio_items`
    const { error } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('user_id', userId)
      .eq('ticker', symbol);

    return !error;
  } catch (err) {
    console.error('Error deleting transaction/portfolio_item:', err);
    return false;
  }
}

// 3. Watchlist Items Sync (`watchlist_items` table: id, user_id, item_type, value)
export async function fetchUserWatchlistItems(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('watchlist_items')
      .select('value')
      .eq('user_id', userId)
      .eq('item_type', 'ticker');

    if (error) {
      console.error('Fetch watchlist_items error:', error);
      return [];
    }

    return (data || []).map((w: any) => w.value);
  } catch (err) {
    console.error('Error fetching watchlist_items:', err);
    return [];
  }
}

export async function toggleWatchlistInSupabase(userId: string, symbol: string, isFav: boolean): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    if (isFav) {
      const { error } = await supabase
        .from('watchlist_items')
        .insert([{
          user_id: userId,
          item_type: 'ticker',
          value: symbol,
          created_at: new Date().toISOString()
        }]);
      return !error;
    } else {
      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('user_id', userId)
        .eq('item_type', 'ticker')
        .eq('value', symbol);
      return !error;
    }
  } catch (err) {
    console.error('Error toggling watchlist_item:', err);
    return false;
  }
}
