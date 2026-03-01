import { Workplace, PointLog, UserStats, User } from "../types";
import { supabase } from "../lib/supabase";

export const api = {
  async getWorkplaces(): Promise<Workplace[]> {
    const { data, error } = await supabase
      .from('workplaces')
      .select('*');
    if (error) throw error;
    return data || [];
  },

  async register(name: string, hourlyRate: number, profession: string, photo: string): Promise<User> {
    // This is handled by Auth component now, but kept for compatibility or specific logic
    throw new Error("Use Supabase Auth for registration");
  },

  async login(name: string, photo: string): Promise<User> {
    // This is handled by Auth component now
    throw new Error("Use Supabase Auth for login");
  },

  async getUserStats(userId: string): Promise<UserStats> {
    const { data: logs, error: logsError } = await supabase
      .from('point_logs')
      .select(`
        *,
        workplaces (name)
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (logsError) throw logsError;

    // Calculate earnings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('hourly_rate')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const hourlyRate = profile?.hourly_rate || 0;
    let earnings = 0;

    // Simple earnings calculation: for each 'in' finding the next 'out'
    for (let i = 0; i < (logs?.length || 0); i++) {
      if (logs[i].type === 'out' && logs[i + 1]?.type === 'in') {
        const outTime = new Date(logs[i].timestamp).getTime();
        const inTime = new Date(logs[i + 1].timestamp).getTime();
        const hours = (outTime - inTime) / (1000 * 60 * 60);
        earnings += hours * hourlyRate;
      }
    }

    return {
      logs: logs.map(l => ({
        ...l,
        workplace_name: l.workplaces?.name
      })),
      earnings
    };
  },

  async registerPoint(data: {
    userId: string;
    workplaceId: number;
    type: 'in' | 'out';
    latitude: number;
    longitude: number;
    photo: string;
  }): Promise<{ success: boolean; timestamp: string }> {
    const { data: result, error } = await supabase
      .from('point_logs')
      .insert([
        {
          user_id: data.userId,
          workplace_id: data.workplaceId,
          type: data.type,
          latitude: data.latitude,
          longitude: data.longitude,
          photo_url: data.photo,
          timestamp: new Date().toISOString()
        }
      ])
      .select()
      .maybeSingle();

    if (error) throw error;
    return { success: true, timestamp: result?.timestamp || new Date().toISOString() };
  },

  async getManagerDashboard(): Promise<{ logs: any[], stats: any }> {
    const { data: logs, error: logsError } = await supabase
      .from('point_logs')
      .select(`
        *,
        profiles (name, profession, photo_url),
        workplaces (name)
      `)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (logsError) throw logsError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: activeToday } = await supabase
      .from('point_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', today.toISOString());

    const { count: totalLogs } = await supabase
      .from('point_logs')
      .select('*', { count: 'exact', head: true });

    return {
      logs: logs.map(l => ({
        ...l,
        user_name: l.profiles?.name,
        user_profession: l.profiles?.profession,
        photo_url: l.profiles?.photo_url || l.photo_url,
        workplace_name: l.workplaces?.name
      })),
      stats: {
        active_today: activeToday || 0,
        total_logs: totalLogs || 0,
        total_earnings_today: 0 // Simplified for now
      }
    };
  },

  async getManagerUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    if (error) throw error;
    return data || [];
  },

  async updateUserRate(userId: string, hourlyRate: number): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('profiles')
      .update({ hourly_rate: hourlyRate })
      .eq('id', userId);
    if (error) throw error;
    return { success: true };
  },

  async deleteLog(logId: number): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('point_logs')
      .delete()
      .eq('id', logId);
    if (error) throw error;
    return { success: true };
  },

  async deleteUser(userId: string): Promise<{ success: boolean }> {
    // This is tricky because of auth.users
    // For now we just delete the profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (error) throw error;
    return { success: true };
  },

  async verifyManagerPassword(password: string): Promise<{ success: boolean }> {
    // In Supabase, we rely on the 'role' field in the profile
    return { success: true };
  },

  async updateManagerPassword(newPassword: string): Promise<{ success: boolean }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return { success: true };
  }
};
