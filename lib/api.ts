const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:3000';

export type UserSearchResult = { id: string; email: string };
export type AvailabilityBlock = {
  id: number;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};
export type Tenant = {
  id: number;
  subdomain: string;
  name: string;
  isActive: boolean;
};

export type Provider = {
  id: number;
  name: string;
  slug: string;
  category: string;
  title?: string;
  bio?: string;
  photoUrl?: string;
};

export type Service = {
  id: number;
  name: string;
  slug: string;
  durationMinutes: number;
  price: number;
};

export type AvailabilitySlot = {
  startTime: string; // ISO instant
  endTime: string;
};

async function apiFetch<T>(
  path: string,
  tenantSlug: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-slug': tenantSlug,
      ...(init?.headers ?? {}),
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request to ${path} failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function getProviders(tenantSlug: string) {
  return apiFetch<Provider[]>('/api/providers', tenantSlug);
}

export function getProvider(tenantSlug: string, providerId: number) {
  return apiFetch<Provider>(`/api/providers/${providerId}`, tenantSlug);
}

export function getServices(tenantSlug: string) {
  return apiFetch<Service[]>('/api/services', tenantSlug);
}

export function getProviderServices(tenantSlug: string, providerId: number) {
  return apiFetch<Service[]>(`/api/providers/${providerId}/services`, tenantSlug);
}



export function bookAppointment(
  tenantSlug: string,
  accessToken: string,
  payload: { providerId: number; serviceId: number; startTime: string; customerNotes?: string }
) {
  return apiFetch<{ id: number }>('/api/appointments', tenantSlug, {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
}
export function getAvailability(
  tenantSlug: string,
  providerId: number,
  date: string,
  serviceId: number
) {
  return apiFetch<{ start: string; end: string; available: boolean }[]>(
    `/api/providers/${providerId}/availability/slots?date=${date}&serviceId=${serviceId}`,
    tenantSlug
  ).then((slots) =>
    slots.filter((s) => s.available).map((s) => ({ startTime: s.start, endTime: s.end }))
  );
}
export type AppointmentWithDetails = {
  id: number;
  providerId: number;
  serviceId: number;
  userId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  customerNotes: string | null;
  providerName: string;
  serviceName: string;
  customerEmail: string;
};

export function getAppointments(tenantSlug: string, accessToken: string) {
  return apiFetch<AppointmentWithDetails[]>('/api/appointments', tenantSlug, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// export function updateAppointmentStatus(
//   tenantSlug: string,
//   accessToken: string,
//   appointmentId: number,
//   status: 'confirmed' | 'completed' | 'cancelled'
// ) {
//   return apiFetch<AppointmentWithDetails>(`/api/appointments/${appointmentId}/status`, tenantSlug, {
//     method: 'PATCH',
//     cache: 'no-store',
//     headers: { Authorization: `Bearer ${accessToken}` },
//     body: JSON.stringify({ status }),
//   });
// }

export function updateAppointmentStatus(
  tenantSlug: string,
  accessToken: string,
  appointmentId: number,
  status: 'confirmed' | 'completed' | 'cancelled'
) {
  return apiFetch<AppointmentWithDetails>(`/api/appointments/${appointmentId}/status`, tenantSlug, {
    method: 'PATCH',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ status }),
  });
}

export function createProvider(
  tenantSlug: string,
  accessToken: string,
  data: { name: string; slug: string; category: string }
) {
  return apiFetch<Provider>('/api/providers', tenantSlug, {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export function updateProvider(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  data: Partial<{ name: string; slug: string; category: string; title: string; bio: string }>
) {
  return apiFetch<Provider>(`/api/providers/${providerId}`, tenantSlug, {
    method: 'PATCH',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export function deleteProvider(tenantSlug: string, accessToken: string, providerId: number) {
  return apiFetch<void>(`/api/providers/${providerId}`, tenantSlug, {
    method: 'DELETE',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createService(
  tenantSlug: string,
  accessToken: string,
  data: { name: string; slug: string; durationMinutes: number; price: number }
) {
  return apiFetch<Service>('/api/services', tenantSlug, {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export function deleteService(tenantSlug: string, accessToken: string, serviceId: number) {
  return apiFetch<void>(`/api/services/${serviceId}`, tenantSlug, {
    method: 'DELETE',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
export type AvailabilityException = {
  id: number;
  exceptionDate: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

export function getAvailabilityBlocks(tenantSlug: string, providerId: number) {
  return apiFetch<AvailabilityBlock[]>(`/api/providers/${providerId}/availability`, tenantSlug);
}

export function createAvailabilityBlock(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  data: { weekday: number; startTime: string; endTime: string }
) {
  return apiFetch<AvailabilityBlock>(`/api/providers/${providerId}/availability`, tenantSlug, {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export function deleteAvailabilityBlock(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  blockId: number
) {
  return apiFetch<void>(`/api/providers/${providerId}/availability/${blockId}`, tenantSlug, {
    method: 'DELETE',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getExceptions(tenantSlug: string, providerId: number) {
  return apiFetch<AvailabilityException[]>(`/api/providers/${providerId}/availability/exceptions`, tenantSlug);
}

export function createException(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  data: { exceptionDate: string; isAvailable: boolean; reason?: string }
) {
  return apiFetch<AvailabilityException>(`/api/providers/${providerId}/availability/exceptions`, tenantSlug, {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export function deleteException(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  exceptionId: number
) {
  return apiFetch<void>(`/api/providers/${providerId}/availability/exceptions/${exceptionId}`, tenantSlug, {
    method: 'DELETE',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
export function cancelAppointment(
  tenantSlug: string,
  accessToken: string,
  appointmentId: number,
  reason?: string
) {
  return apiFetch<AppointmentWithDetails>(`/api/appointments/${appointmentId}/cancel`, tenantSlug, {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ reason }),
  });
}

export function searchUsers(tenantSlug: string, accessToken: string, email: string) {
  return apiFetch<UserSearchResult[]>(`/api/users/search?email=${encodeURIComponent(email)}`, tenantSlug, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function linkProviderToUser(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  userId: string
) {
  return apiFetch<Provider>(`/api/providers/${providerId}/link`, tenantSlug, {
    method: 'PATCH',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ userId }),
  });
}
export async function getTenant(subdomain: string): Promise<Tenant | null> {
  const res = await fetch(`${API_ORIGIN}/api/tenants/${subdomain}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to look up tenant');
  return res.json();
}