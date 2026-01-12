import type { Task, Context } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Context API
export const contextApi = {
  getAll: () => apiCall<Context[]>('/contexts'),
  getById: (id: number) => apiCall<Context>(`/contexts/${id}`),
  create: (data: { namespace: string; description: string }) =>
    apiCall<Context>('/contexts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { namespace: string; description: string }) =>
    apiCall<Context>(`/contexts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiCall<void>(`/contexts/${id}`, { method: 'DELETE' }),
};

// Command API
export const taskApi = {
  getAll: () => apiCall<Task[]>('/commands'),
  getActive: () => apiCall<Task[]>('/commands?filter=active'),
  getArchived: () => apiCall<Task[]>('/commands?filter=archived'),
  getByContext: (contextId: number) =>
    apiCall<Task[]>(`/commands?contextId=${contextId}`),
  getById: (id: number) => apiCall<Task>(`/commands/${id}`),
  create: (data: Omit<Task, 'id'>) =>
    apiCall<Task>('/commands', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Omit<Task, 'id'>) =>
    apiCall<Task>(`/commands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: number, status: Task['status']) =>
    apiCall<Task>(`/commands/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: number) =>
    apiCall<void>(`/commands/${id}`, { method: 'DELETE' }),
};
