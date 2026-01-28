import type { Task, Context, User, GoogleCalendarEvent } from '../types';

const API_BASE_URL = 'http://localhost:8090/api';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Include cookies for session
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Handle empty response (e.g., DELETE returns 204 No Content)
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text);
}

// Context API
export const contextApi = {
  getAll: () => apiCall<Context[]>('/contexts'),
  getById: (id: number) => apiCall<Context>(`/contexts/${id}`),
  create: (data: { namespace: string; description: string; color?: string }) =>
    apiCall<Context>('/contexts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { namespace: string; description: string; color?: string }) =>
    apiCall<Context>(`/contexts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiCall<void>(`/contexts/${id}`, { method: 'DELETE' }),
};

// Task API
export const taskApi = {
  getAll: () => apiCall<Task[]>('/tasks'),
  getActive: () => apiCall<Task[]>('/tasks?filter=active'),
  getArchived: () => apiCall<Task[]>('/tasks?filter=archived'),
  getByContext: (contextId: number) =>
    apiCall<Task[]>(`/tasks?contextId=${contextId}`),
  getById: (id: number) => apiCall<Task>(`/tasks/${id}`),
  create: (data: Omit<Task, 'id'>) =>
    apiCall<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Omit<Task, 'id'>) =>
    apiCall<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: number, status: Task['status']) =>
    apiCall<Task>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: number) =>
    apiCall<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

// Auth API
export const authApi = {
  // Get login URL - redirect user to this URL for Google OAuth
  getLoginUrl: () => `${API_BASE_URL.replace('/api', '')}/oauth2/authorization/google`,
  
  // Get current user info
  getCurrentUser: () => apiCall<User>('/auth/me'),
  
  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      await apiCall<User>('/auth/me');
      return true;
    } catch {
      return false;
    }
  },
  
  // Logout
  logout: () => apiCall<void>('/auth/logout', { method: 'POST' }),
};

// Calendar API
export const calendarApi = {
  // Get Google Calendar events
  // Get Google Calendar events
  getEvents: (start: string, end: string) => {
    const params = new URLSearchParams();
    params.append('start', start);
    params.append('end', end);
    const queryString = params.toString();
    return apiCall<GoogleCalendarEvent[]>(`/calendar/events?${queryString}`);
  },
  
  // Sync all tasks to Google Calendar
  syncAll: () => apiCall<void>('/calendar/sync', { method: 'POST' }),
};
