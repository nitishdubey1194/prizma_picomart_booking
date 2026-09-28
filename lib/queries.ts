import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProviders, getServices, getAvailability, bookAppointment, updateAppointmentStatus, getAppointments, deleteService, createService, deleteProvider, createProvider, deleteException, createException, getExceptions, deleteAvailabilityBlock, createAvailabilityBlock, getAvailabilityBlocks, cancelAppointment, searchUsers, linkProviderToUser,

  getProviderAssignedServices,
  linkProviderToService,
  unlinkProviderToService,
  LinkProviderServicePayload,
  } from '@/lib/api';
import { getAccessToken } from './auth';
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export { WEEKDAY_NAMES };
export type CurrentUser = {
  id: string;
  email: string;
  role: string[];
  providerId: number | null;
};
export const queryKeys = {
  providers: (tenantSlug: string) => ['providers', tenantSlug] as const,
  services: (tenantSlug: string) => ['services', tenantSlug] as const,
  availability: (tenantSlug: string, providerId: number, date: string) =>
    ['availability', tenantSlug, providerId, date] as const,
};

export function useProviders(tenantSlug: string, serviceId?: number | string | null) {
  return useQuery({
    queryKey: ["providers", tenantSlug, serviceId ?? "all"],
    queryFn: () => getProviders(tenantSlug,serviceId ?? "all"),
  });
}

export function useServices(tenantSlug: string) {
  return useQuery({
    queryKey: queryKeys.services(tenantSlug),
    queryFn: () => getServices(tenantSlug),
  });
}

export function useAvailability(
  tenantSlug: string,
  providerId: number | null,
  date: string,
  serviceId: number | null
) {
  return useQuery({
    queryKey: [...queryKeys.availability(tenantSlug, providerId ?? 0, date), serviceId],
    queryFn: () => getAvailability(tenantSlug, providerId as number, date, serviceId as number),
    enabled: providerId !== null && serviceId !== null,
  });
}

export function useBookAppointment(tenantSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      accessToken: string;
      providerId: number;
      serviceId: number;
      startTime: string;
      endTime: string;
      localDate: string;
      customerNotes?: string;
    }) => {
      const { accessToken, ...payload } = variables;
      return bookAppointment(tenantSlug, accessToken, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", tenantSlug] });
      queryClient.invalidateQueries({ queryKey: ["availability", tenantSlug] });
    },
  });
}

export function useCurrentUser(tenantSlug: string) {
  return useQuery({
    queryKey: ['currentUser', tenantSlug],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) return null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_ORIGIN}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': tenantSlug },
      });
      if (!res.ok) return null;
      return res.json() as Promise<CurrentUser>;
    },
  });
}

export function useAppointments(tenantSlug: string) {
  return useQuery({
    queryKey: ['appointments', tenantSlug],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return getAppointments(tenantSlug, token);
    },
  });
}

export function useUpdateAppointmentStatus(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'confirmed' | 'completed' | 'cancelled' }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return updateAppointmentStatus(tenantSlug, token, id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', tenantSlug] });
    },
  });
}

export function useCreateProvider(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; category: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return createProvider(tenantSlug, token, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.providers(tenantSlug) }),
  });
}

export function useDeleteProvider(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (providerId: number) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return deleteProvider(tenantSlug, token, providerId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.providers(tenantSlug) }),
  });
}

export function useCreateService(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; durationMinutes: number; price: number }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return createService(tenantSlug, token, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.services(tenantSlug) }),
  });
}

export function useDeleteService(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serviceId: number) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return deleteService(tenantSlug, token, serviceId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.services(tenantSlug) }),
  });
}

export function useAvailabilityBlocks(tenantSlug: string, providerId: number | null) {
  return useQuery({
    queryKey: ['availabilityBlocks', tenantSlug, providerId],
    queryFn: () => getAvailabilityBlocks(tenantSlug, providerId as number),
    enabled: providerId !== null,
  });
}

export function useCreateAvailabilityBlock(tenantSlug: string, providerId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { weekday: number; startTime: string; endTime: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return createAvailabilityBlock(tenantSlug, token, providerId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['availabilityBlocks', tenantSlug, providerId] }),
  });
}

export function useDeleteAvailabilityBlock(tenantSlug: string, providerId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: number) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return deleteAvailabilityBlock(tenantSlug, token, providerId, blockId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['availabilityBlocks', tenantSlug, providerId] }),
  });
}

export function useExceptions(tenantSlug: string, providerId: number | null) {
  return useQuery({
    queryKey: ['exceptions', tenantSlug, providerId],
    queryFn: () => getExceptions(tenantSlug, providerId as number),
    enabled: providerId !== null,
  });
}

export function useCreateException(tenantSlug: string, providerId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { exceptionDate: string; isAvailable: boolean; reason?: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return createException(tenantSlug, token, providerId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exceptions', tenantSlug, providerId] }),
  });
}

export function useDeleteException(tenantSlug: string, providerId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exceptionId: number) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return deleteException(tenantSlug, token, providerId, exceptionId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exceptions', tenantSlug, providerId] }),
  });
}
export function useCancelAppointment(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return cancelAppointment(tenantSlug, token, id, reason);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments', tenantSlug] }),
  });
}
export function useUserSearch(tenantSlug: string, email: string) {
  return useQuery({
    queryKey: ['userSearch', tenantSlug, email],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return searchUsers(tenantSlug, token, email);
    },
    enabled: email.length >= 3, // avoid firing on every keystroke of a 1-2 char query
  });
}

export function useLinkProvider(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ providerId, userId }: { providerId: number; userId: string | null }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in.');
      return linkProviderToUser(tenantSlug, token, providerId, userId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.providers(tenantSlug) }),
  });
}

export function useProviderAssignedServices(tenantSlug: string, providerId: number) {
  return useQuery({
    queryKey: ['provider-services', tenantSlug, providerId],
    queryFn: () => getProviderAssignedServices(tenantSlug, providerId),
    enabled: !!tenantSlug && !!providerId,
  });
}

export function useLinkServiceToProvider(tenantSlug: string, accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      providerId,
      payload,
    }: {
      providerId: number;
      payload: LinkProviderServicePayload;
    }) => linkProviderToService(tenantSlug, accessToken, providerId, payload),
    onSuccess: (_, { providerId }) => {
      queryClient.invalidateQueries({
        queryKey: ['provider-services', tenantSlug, providerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['providers', tenantSlug],
      });
    },
  });
}

export function useUnlinkServiceFromProvider(tenantSlug: string, accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      providerId,
      serviceId,
    }: {
      providerId: number;
      serviceId: number | string;
    }) => unlinkProviderToService(tenantSlug, accessToken, providerId, serviceId),
    onSuccess: (_, { providerId }) => {
      queryClient.invalidateQueries({
        queryKey: ['provider-services', tenantSlug, providerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['providers', tenantSlug],
      });
    },
  });
}