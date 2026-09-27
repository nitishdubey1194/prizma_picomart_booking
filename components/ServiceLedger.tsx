import type { Service } from '@/lib/api';

export function ServiceLedger({ services }: { services: Service[] }) {
  if (services.length === 0) {
    return <p className="text-ink/60">Services will be listed here shortly.</p>;
  }

  return (
    <ul>
      {services.map((service) => (
        <li
          key={service.id}
          className="ledger-row flex items-baseline justify-between gap-4 py-4"
        >
          <span className="font-medium">{service.name}</span>
          <span className="flex-1 border-b border-dotted border-ink/20 self-end mb-1.5" aria-hidden />
          <span className="whitespace-nowrap text-ink/70">
            {service.durationMinutes} min · ₹{service.price}
          </span>
        </li>
      ))}
    </ul>
  );
}