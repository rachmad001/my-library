import { getPublicCatalogs } from "@/actions/catalog";
import CatalogCard from "@/components/CatalogCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalogs = await getPublicCatalogs();

  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to <span className="text-indigo-600">E-Library</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Discover, create, and share catalogs of knowledge. Read chapters in flipbook style or download PDFs.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Catalogs</h2>
        {catalogs.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>No catalogs found. Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogs.map((catalog) => (
              <CatalogCard key={catalog.id} catalog={catalog} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
