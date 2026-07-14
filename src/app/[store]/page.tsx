import { StoreProvider } from "@/lib/store-context";
import type { StoreContextValue } from "@/lib/store-context";
import { C } from "@/lib/brand-colors";
import FortuneCard from "@/components/fortune-card";
import AIGuessCard from "@/components/ai-guess-card";

export default async function StoreHomepage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: storeParam } = await params;
  const storeId = /^\d+$/.test(storeParam) ? parseInt(storeParam) : 10007;

  const contextValue: StoreContextValue = {
    storeId,
    industry: "food",
    decoration: null,
    loading: true,
    theme: { color: C.teal, logo: "" },
  };

  return (
    <StoreProvider value={contextValue}>
      {/* Fixed top sections */}
      <FortuneCard />
      <AIGuessCard />

      {/* Module area will be rendered client-side */}
      <div id="module-area">
        <div className="px-3 mt-3">
          <div className="rounded-[8px] border border-dashed border-gray-200 p-6 text-center text-gray-400 text-[12px]">
            加载模块中...
          </div>
        </div>
      </div>
    </StoreProvider>
  );
}
