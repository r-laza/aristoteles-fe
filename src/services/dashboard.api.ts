import type { DashboardResponse } from '../types/dashboard';

export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await fetch('/api/dashboard', {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load dashboard');
  }

  return response.json();
}
