import { useState, useEffect } from "react";
import { Product, AppSettings } from "../types";
import ProductCard from "../components/ProductCard";
import BannerCarousel from "../components/BannerCarousel";
import { Search, Filter, ShoppingBag } from "lucide-react";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/settings")
        ]);

        if (!pRes.ok) {
          console.error("Products API failed:", pRes.status);
          throw new Error(`Products API error! status: ${pRes.status}`);
        }
        if (!sRes.ok) {
          console.error("Settings API failed:", sRes.status);
          throw new Error(`Settings API error! status: ${sRes.status}`);
        }

        const productsData = await pRes.json();
        const settingsData = await sRes.json();

        setProducts(productsData);
        setSettings(settingsData);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = ["Todos", ...new Set(products.map(p => p.category || "Sem Categoria"))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.description.toLowerCase().includes(search.toLowerCase());
    const productCategory = p.category || "Sem Categoria";
    const matchesCategory = category === "Todos" || productCategory === category;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary,#10b981)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20" style={{ '--primary': settings?.primaryColor || '#10b981' } as any}>
      <BannerCarousel />

      <div className="space-y-12">
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-stone-900">
            {settings?.storeName || "Nosso Catálogo"}
          </h1>
          <p className="text-stone-400 text-lg leading-relaxed">
            Descubra uma curadoria exclusiva de produtos que combinam design atemporal e qualidade excepcional.
          </p>
        </header>

        <div className="sticky top-24 z-40 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/60 backdrop-blur-xl p-3 rounded-3xl border border-stone-200/50 shadow-xl shadow-stone-200/20">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="O que você procura hoje?"
              className="w-full pl-12 pr-4 py-3 bg-stone-50/50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all placeholder:text-stone-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  category === cat 
                  ? "text-white shadow-lg" 
                  : "bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                }`}
                style={category === cat ? { backgroundColor: 'var(--primary)', boxShadow: `0 8px 20px -4px ${settings?.primaryColor || '#10b981'}40` } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className={
            settings?.layoutMode === 'list' 
            ? "flex flex-col gap-8 max-w-4xl mx-auto" 
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          }>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-stone-200">
            <ShoppingBag className="w-16 h-16 text-stone-200 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-stone-900">Nenhum tesouro encontrado</h3>
            <p className="text-stone-400">Tente ajustar seus filtros ou busca para encontrar o que deseja.</p>
          </div>
        )}
      </div>
    </div>
  );
}
