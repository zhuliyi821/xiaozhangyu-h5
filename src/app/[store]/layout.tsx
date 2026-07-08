import { StoreProvider } from "@/lib/store-context";
import type { StoreContextValue, DecorationConfig } from "@/lib/store-context";

async function fetchDecoration(storeId: number): Promise<DecorationConfig | null> {
  try {
    const res = await fetch(`http://127.0.0.1:3000/api/decoration?store_id=${storeId}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.code === 0 ? json.data : null;
  } catch {
    return null;
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ store: string }>;
}) {
  // Parse store identifier: could be numeric store_id or subdomain
  const { store: storeParam } = await params;
  const storeId = /^\d+$/.test(storeParam) ? parseInt(storeParam) : 10007;

  // Fetch decoration config server-side
  const decoration = await fetchDecoration(storeId);
  const themeColor = decoration?.theme_color || "#45CCD5";

  const contextValue: StoreContextValue = {
    storeId,
    industry: (decoration?.industry as StoreContextValue["industry"]) || "food",
    decoration,
    loading: false,
    theme: { color: themeColor, logo: decoration?.logo || "" },
  };

  return (
    <StoreProvider value={contextValue}>
      <div className="max-w-[430px] mx-auto min-h-screen bg-bg">
        {children}
      </div>
    </StoreProvider>
  );
}
