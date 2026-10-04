'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  Home,
  UserCheck,
  RotateCcw,
  LogIn,
} from 'lucide-react';

export type PermissionErrorType = 'unauthenticated' | 'role_mismatch' | 'unassigned_chair';

export interface PermissionDeniedProps {
  /** The specific category of authorization issue */
  type?: PermissionErrorType;
  /** Custom headline override */
  title?: string;
  /** Detailed explanatory message */
  description?: string;
  /** Current user identity (email or name) to show what account is signed in */
  currentIdentity?: string | null;
  /** Current user role */
  currentRole?: string | string[] | null | undefined;
  /** Required role needed to access this view (e.g., 'Vendor / Store Owner') */
  requiredRole?: string | null;
  /** URL to redirect the user to a safe landing spot */
  fallbackHref?: string;
  /** Label for the safe return button */
  fallbackLabel?: string;
  /** Show the back button */
  showBackButton?: boolean;
}

export function PermissionDenied({
  type = 'role_mismatch',
  title,
  description,
  currentIdentity,
  currentRole,
  requiredRole,
  fallbackHref = '/dashboard',
  fallbackLabel = 'Back to Overview',
  showBackButton = true,
}: PermissionDeniedProps) {
  const router = useRouter();

  // Preset copy & icons based on the error category
  const config = {
    unauthenticated: {
      badge: 'Authentication Required',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400/30',
      iconBg: 'bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/20',
      Icon: Lock,
      defaultTitle: 'Sign-In Required',
      defaultDescription:
        'You need to be authenticated to access this workstation. Please sign in to verify your identity and view this workspace.',
    },
    role_mismatch: {
      badge: 'Access Restricted',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-rose-400/30',
      iconBg: 'bg-rose-500/10 text-rose-800 ring-1 ring-rose-500/20',
      Icon: ShieldAlert,
      defaultTitle: 'Restricted Access Area',
      defaultDescription:
        'Your verified account permissions do not grant access to this page',
    },
    unassigned_chair: {
      badge: 'Chair Linkage Pending',
      badgeClass: 'bg-stone-200 text-stone-800 border-stone-300 ring-1 ring-stone-400/30',
      iconBg: 'bg-stone-200/80 text-stone-700 ring-1 ring-stone-300',
      Icon: UserCheck,
      defaultTitle: 'Unassigned Practitioner Station',
      defaultDescription:
        'Your account credentials are valid, but you have not yet been assigned to an active chair or calendar in this studio directory.',
    },
  }[type];

  const IconComponent = config.Icon;
  const displayTitle = title ?? config.defaultTitle;
  const displayDescription = description ?? config.defaultDescription;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full rounded-3xl border border-stone-200/90 bg-[#FAF8F5] p-6 text-center shadow-xs sm:p-10">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${config.iconBg}`}>
          <IconComponent className="h-7 w-7 stroke-[1.75]" />
        </div>

        {/* Security Category Tag */}
        <div className="mt-5">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeClass}`}
          >
            {config.badge}
          </span>
        </div>

        {/* Headline */}
        <h1 className="mt-3 text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
          {displayTitle}
        </h1>

        {/* Context Description */}
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-stone-600 sm:text-sm">
          {displayDescription}
        </p>

        {/* Account & Role Metadata Capsule (Only rendered if details are available) */}
        {(currentIdentity || currentRole || requiredRole) && (
          <div className="mt-6 rounded-2xl border border-stone-200/80 bg-white/70 p-3.5 text-left text-xs shadow-2xs space-y-2">
            {currentIdentity && (
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Active Identity</span>
                <span className="font-mono font-medium text-stone-800 truncate max-w-[220px]">
                  {currentIdentity}
                </span>
              </div>
            )}

            {currentRole && (
              <div className="flex items-center justify-between border-t border-stone-100 pt-2">
                <span className="text-stone-500">Your Current Role</span>
                <span className="font-semibold text-stone-800 capitalize">
                  {currentRole}
                </span>
              </div>
            )}

          </div>
        )}

        {/* Action Controls */}
        <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-3">
          {showBackButton && (
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 active:scale-[0.98] transition-all sm:w-auto cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-stone-400" />
              <span>Go Back</span>
            </button>
          )}

          {type === 'unauthenticated' ? (
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 active:scale-[0.98] transition-all sm:w-auto cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In to Continue</span>
            </Link>
          ) : (
            <Link
              href={fallbackHref}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 active:scale-[0.98] transition-all sm:w-auto cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              <span>{fallbackLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}