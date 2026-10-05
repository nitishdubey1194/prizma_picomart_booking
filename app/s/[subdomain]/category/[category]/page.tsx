// app/s/[subdomain]/category/[category]/page.tsx
import Link from "next/link";
import Image from "next/image";

interface Props {
  params: Promise<{ subdomain: string; category: string }>;
}

async function fetchProviders(category: string, subdomain: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_ORIGIN}/api/providers?category=${encodeURIComponent(category)}`,
    {
      headers: { "x-tenant-slug": subdomain },
      next: { revalidate: 60 },
    }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export default async function CategoryProvidersPage({ params }: Props) {
  const { subdomain, category } = await params;
  const providers = await fetchProviders(category, subdomain);
  const formattedTitle = category.replace(/-/g, " ").toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{formattedTitle} Specialists</h1>
      <p className="text-gray-600 mb-8">
        Select a location or provider below to view available services and book.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((p: { id: number; avatarUrl: string; name: string; title: string; category: string; bio: string; slug: string }) => (
          <div key={p.id} className="border rounded-xl p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mb-4 relative">
                {p.avatarUrl && (
                  <Image src={p.avatarUrl} alt={p.name} fill className="object-cover" />
                )}
              </div>
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <p className="text-sm text-gray-500 font-medium">{p.title || p.category}</p>
              <p className="text-sm text-gray-700 mt-2 line-clamp-3">{p.bio}</p>
            </div>
            <Link
              href={`/s/${subdomain}/providers/${p.slug}`}
              className="mt-6 inline-block text-center bg-black text-white py-2 rounded-lg font-medium hover:bg-neutral-800 transition"
            >
              View Services & Book
            </Link>
          </div>
        ))}
        {providers.length === 0 && (
          <p className="text-gray-500 col-span-full">No active providers found in this category.</p>
        )}
      </div>
    </div>
  );
}