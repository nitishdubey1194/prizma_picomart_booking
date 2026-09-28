const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:3000';

export interface FetchAppointmentOptions {
  providerId?: string | number | null;
  status?: string;
  startDate?: string;
  endDate?: string;
}
export type UserSearchResult = {
  id: string;
  email: string;
  fullName?: string | null;
  role?: string | null;
};

export type AvailabilityBlock = {
  id: number;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type Tenant = {
  id: number | string;
  subdomain: string;
  name: string;
  isActive: boolean;
  planId?: number;
  themeId?: number | null;
};

export type Provider = {
  id: number;
  name: string;
  slug: string;
  category: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  userId?: string | null;
  isActive?: boolean;
  userLinkEmail?: string | null;
};

export type Service = {
  id: number;
  name: string;
  slug: string;
  durationMinutes: number;
  price: number | string;
  bufferMinutes?: number;
  description?: string | null;
  isActive?: boolean;
};

export type AvailabilitySlot = {
  startTime: string; // ISO instant
  endTime: string;   // ISO instant
  formattedTime?: string;
};

export type AvailabilityException = {
  id: number;
  exceptionDate: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

export type AppointmentWithDetails = {
  id: number;
  providerId: number;
  serviceId: number;
  userId: string;
  startTime: string;
  endTime: string;
  localDate?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number | string;
  customerNotes: string | null;
  providerName?: string;
  serviceName?: string;
  customerEmail?: string;
};

export interface BookAppointmentPayload {
  providerId: number;
  serviceId: number;
  startTime: string;
  endTime?: string;
  localDate?: string;
  customerNotes?: string;
}

export interface ProviderServiceMapping {
  id: number | string;
  providerId: number;
  serviceId: number;
  customDurationMinutes?: number | null;
  customPrice?: number | string | null;
  serviceName?: string;
  serviceDescription?: string | null;
  defaultDurationMinutes?: number;
  defaultPrice?: number | string;
}

export interface LinkProviderServicePayload {
  serviceId: number | string;
  customDurationMinutes?: number | null;
  customPrice?: number | string | null;
}
// ---------------------------------------------------------------------------
// Base Fetch Wrapper
// ---------------------------------------------------------------------------

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
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw new Error(
      body.error ?? body.message ?? `Request to ${path} failed (${res.status})`
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------------------------------------------------------------------------
// Providers & Services Queries
// ---------------------------------------------------------------------------

export async function getProviders(tenantSlug: string, serviceId?: number | string | null): Promise<Provider[]> {
  const url = serviceId
        ? `/api/providers?serviceId=${serviceId}`
        : `/api/providers`;
  const data = await apiFetch<Provider[] | { providers: Provider[] }>(
    url,
    tenantSlug
  );

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.providers)) {
    return data.providers;
  }
  return [];
}

export async function getProvider(
  tenantSlug: string,
  providerId: number
): Promise<Provider> {
  const data = await apiFetch<Provider | { provider: Provider }>(
    `/api/providers/${providerId}`,
    tenantSlug
  );

  if (data && typeof data === 'object' && 'provider' in data && data.provider) {
    return data.provider;
  }
  return data as Provider;
}

export async function getServices(tenantSlug: string): Promise<Service[]> {
  const data = await apiFetch<Service[] | { services: Service[] }>(
    '/api/services',
    tenantSlug
  );

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.services)) {
    return data.services;
  }
  return [];
}

export async function getProviderServices(
  tenantSlug: string,
  providerId: number
): Promise<Service[]> {
  const data = await apiFetch<Service[] | { services: Service[] }>(
    `/api/providers/${providerId}/services`,
    tenantSlug
  );

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.services)) {
    return data.services;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Availability Slots & Calendar Overrides
// ---------------------------------------------------------------------------

export type AvailabilityResponse =
  | { slots: AvailabilitySlot[] }
  | AvailabilitySlot[];

export async function getAvailability(
  tenantSlug: string,
  providerId: number,
  date: string,
  serviceId: number
): Promise<AvailabilitySlot[]> {
  const data = await apiFetch<AvailabilityResponse>(
    `/api/providers/${providerId}/availability/slots?date=${encodeURIComponent(date)}&serviceId=${serviceId}`,
    tenantSlug
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object' && Array.isArray(data.slots)) {
    return data.slots;
  }

  return [];
}

export async function getAvailabilityBlocks(
  tenantSlug: string,
  providerId: number
): Promise<AvailabilityBlock[]> {
  const data = await apiFetch<
    AvailabilityBlock[] | { schedule: AvailabilityBlock[] }
  >(`/api/providers/${providerId}/availability`, tenantSlug);

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.schedule)) {
    return data.schedule;
  }
  return [];
}

export async function getExceptions(
  tenantSlug: string,
  providerId: number
): Promise<AvailabilityException[]> {
  const data = await apiFetch<
    AvailabilityException[] | { exceptions: AvailabilityException[] }
  >(`/api/providers/${providerId}/availability/exceptions`, tenantSlug);

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.exceptions)) {
    return data.exceptions;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function bookAppointment(
  tenantSlug: string,
  accessToken: string,
  payload: BookAppointmentPayload
): Promise<{ id: number } | { appointment: { id: number } }> {
  return apiFetch<{ id: number } | { appointment: { id: number } }>(
    '/api/appointments',
    tenantSlug,
    {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    }
  );
}
export interface FetchAppointmentOptions {
  providerId?: string | number | null;
  status?: string;
  startDate?: string;
  endDate?: string;
}
export async function getAppointments(
  tenantSlug: string,
  accessToken: string,
  options: FetchAppointmentOptions = {}
): Promise<AppointmentWithDetails[]> {
  const queryParams = new URLSearchParams();

  if (options.providerId != null) {
    queryParams.set("providerId", String(options.providerId));
  }
  if (options.status) {
    queryParams.set("status", options.status);
  }
  if (options.startDate) {
    queryParams.set("startDate", options.startDate);
  }
  if (options.endDate) {
    queryParams.set("endDate", options.endDate);
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/appointments${queryString ? `?${queryString}` : ""}`;

  const response = await apiFetch<
    | AppointmentWithDetails[]
    | { appointments: AppointmentWithDetails[] }
    | { success: boolean; data: AppointmentWithDetails[] }
  >(endpoint, tenantSlug, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (Array.isArray(response)) return response;
  if (response && typeof response === "object") {
    if ("appointments" in response && Array.isArray(response.appointments)) {
      return response.appointments;
    }
    if ("data" in response && Array.isArray(response.data)) {
      return response.data;
    }
  }

  return [];
}

export function updateAppointmentStatus(
  tenantSlug: string,
  accessToken: string,
  appointmentId: number,
  status: 'confirmed' | 'completed' | 'cancelled',
  remarks?: string
) {
  return apiFetch<AppointmentWithDetails>(
    `/api/appointments/${appointmentId}/status`,
    tenantSlug,
    {
      method: 'PATCH',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ status, remarks }),
    }
  );
}

export function cancelAppointment(
  tenantSlug: string,
  accessToken: string,
  appointmentId: number,
  reason?: string
) {
  return apiFetch<AppointmentWithDetails>(
    `/api/appointments/${appointmentId}/cancel`,
    tenantSlug,
    {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ reason }),
    }
  );
}

// ---------------------------------------------------------------------------
// Admin Mutations (Providers, Services, Schedules)
// ---------------------------------------------------------------------------

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
  data: Partial<{
    name: string;
    slug: string;
    category: string;
    title: string;
    bio: string;
    avatarUrl: string;
  }>
) {
  return apiFetch<Provider>(`/api/providers/${providerId}`, tenantSlug, {
    method: 'PATCH',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export function deleteProvider(
  tenantSlug: string,
  accessToken: string,
  providerId: number
) {
  return apiFetch<void>(`/api/providers/${providerId}`, tenantSlug, {
    method: 'DELETE',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createService(
  tenantSlug: string,
  accessToken: string,
  data: { name: string; slug: string; durationMinutes: number; price: number | string }
) {
  return apiFetch<Service>('/api/services', tenantSlug, {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export function deleteService(
  tenantSlug: string,
  accessToken: string,
  serviceId: number
) {
  return apiFetch<void>(`/api/services/${serviceId}`, tenantSlug, {
    method: 'DELETE',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createAvailabilityBlock(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  data: { weekday: number; startTime: string; endTime: string }
) {
  return apiFetch<AvailabilityBlock>(
    `/api/providers/${providerId}/availability`,
    tenantSlug,
    {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    }
  );
}

export function deleteAvailabilityBlock(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  blockId: number
) {
  return apiFetch<void>(
    `/api/providers/${providerId}/availability/${blockId}`,
    tenantSlug,
    {
      method: 'DELETE',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}

export function createException(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  data: {
    exceptionDate: string;
    isAvailable: boolean;
    startTime?: string | null;
    endTime?: string | null;
    reason?: string;
  }
) {
  return apiFetch<AvailabilityException>(
    `/api/providers/${providerId}/availability/exceptions`,
    tenantSlug,
    {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    }
  );
}

export function deleteException(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  exceptionId: number
) {
  return apiFetch<void>(
    `/api/providers/${providerId}/availability/exceptions/${exceptionId}`,
    tenantSlug,
    {
      method: 'DELETE',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}

// ---------------------------------------------------------------------------
// Users & Provider Account Linking
// ---------------------------------------------------------------------------

export async function searchUsers(
  tenantSlug: string,
  accessToken: string,
  query: string
): Promise<UserSearchResult[]> {
  const data = await apiFetch<UserSearchResult[] | { users: UserSearchResult[] }>(
    `/api/users/search?q=${encodeURIComponent(query)}`,
    tenantSlug,
    {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.users)) {
    return data.users;
  }
  return [];
}

export function linkProviderToUser(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  userId: string | null
) {
  return apiFetch<Provider>(`/api/providers/${providerId}/link`, tenantSlug, {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ userId }),
  });
}


/**
 * Assign a service to a provider (with optional price/duration overrides)
 */
export function linkProviderToService(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  payload: LinkProviderServicePayload
) {
  return apiFetch<{ success: boolean; data: ProviderServiceMapping }>(
    `/api/providers/${providerId}/services`,
    tenantSlug,
    {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Remove an assigned service from a provider
 */
export function unlinkProviderToService(
  tenantSlug: string,
  accessToken: string,
  providerId: number,
  serviceId: number | string
) {
  return apiFetch<{ success: boolean; data: { serviceId: number | string } } | void>(
    `/api/providers/${providerId}/services/${serviceId}`,
    tenantSlug,
    {
      method: 'DELETE',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}

// export async function unlinkProviderService(
//   subdomain: string,
//   accessToken: string,
//   providerId: string,
//   serviceId: string,
// ) {
//   const res = apiFetch(`/api/providers/${providerId}/services/${serviceId}`, {
//     method: 'DELETE',
//     cache: 'no-store',
//     headers: { Authorization: `Bearer ${accessToken}` },
//   });
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.error || 'Failed to remove service mapping');
//   return json.data;
// }

// ---------------------------------------------------------------------------
// Tenant Resolution
// ---------------------------------------------------------------------------

export async function getTenant(subdomain: string): Promise<Tenant | null> {
  const res = await fetch(`${API_ORIGIN}/api/tenants/${encodeURIComponent(subdomain)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to look up tenant');

  const data = (await res.json()) as Tenant | { tenant: Tenant };
  if (data && typeof data === 'object' && 'tenant' in data && data.tenant) {
    return data.tenant;
  }
  return data as Tenant;
}

export async function getProviderAssignedServices(
  tenantSlug: string,
  providerId: number
): Promise<Service[]> {
  const data = await apiFetch<
    Service[] | { services: Service[] } | { data: Service[] }
  >(`/api/providers/${providerId}/services`, tenantSlug, {
    cache: 'no-store',
  });

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if ('services' in data && Array.isArray(data.services)) {
      return data.services;
    }
    if ('data' in data && Array.isArray(data.data)) {
      return data.data;
    }
  }
  return [];
}
