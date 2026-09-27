import Image from 'next/image';
import type { Provider } from '@/lib/api';

export function ProviderRow({ provider }: { provider: Provider }) {
  return (
    <li className="ledger-row flex items-center gap-4 py-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink/10 font-display text-lg">
        {provider.photoUrl ? (
          <Image src={provider.photoUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
        ) : (
          provider.name.charAt(0)
        )}
      </div>
      <div>
        <p className="font-medium">{provider.name}</p>
        <p className="text-sm text-ink/60">{provider.title ?? provider.category}</p>
      </div>
    </li>
  );
}