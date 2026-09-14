import type { DashboardResponse } from '../types/dashboard';
import { api } from './api';
export const fetchDashboard = () => api<DashboardResponse>('/api/dashboard');
