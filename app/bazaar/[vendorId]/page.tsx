export default async function VendorStorefront({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  return (
    <div className="py-12">
      <h1 className="text-4xl font-display font-bold text-ink mb-4">
        Storefront: {vendorId.replace('-', ' ').toUpperCase()}
      </h1>
      <div className="bg-surface-card p-8 border border-hairline">
        <p className="text-body text-lg">
          Welcome to the {vendorId} storefront. This page is currently applying the theme dynamically.
        </p>
      </div>
    </div>
  );
}
