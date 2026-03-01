export interface User {
  id: string; // Changed to string for UUID
  name: string;
  role: 'employee' | 'manager';
  hourly_rate: number;
  profession?: string;
  photo_url?: string;
  earnings_today?: number;
}

export interface Workplace {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface PointLog {
  id: number;
  user_id: string; // Changed to string for UUID
  user_name?: string;
  user_profession?: string;
  workplace_id: number;
  workplace_name?: string;
  type: 'in' | 'out';
  timestamp: string;
  latitude: number;
  longitude: number;
  photo_url: string;
}

export interface UserStats {
  logs: PointLog[];
  earnings: number;
}
