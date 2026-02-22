import { useState, useEffect } from "react";
import { Product, Banner, AppSettings, Category } from "../types";
import { 
  Plus, Pencil, Trash2, X, Check, Image as ImageIcon, 
  ShoppingBag, Layout, Palette, Settings as SettingsIcon,
  Monitor, Smartphone, Tags, Save, Upload, Download,
  BarChart3, PieChart as PieChartIcon, TrendingUp, Package,
  Layers, Type
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface AdminDashboardProps {
  token: string;
}

type Tab = "dashboard" | "products" | "categories" | "banners" | "settings";

export default function AdminDashboard({ token }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<AppSettings>({
    primaryColor: "#10b981",
    accentColor: "#059669",
    layoutMode: "grid",
    storeName: "Minha Loja",
    fontFamily: "Inter"
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === "dashboard") {
        const res = await fetch("/api/stats", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch stats");
        setStats(await res.json());
      } else if (activeTab === "products") {
        const [pRes, cRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories")
        ]);
        if (!pRes.ok || !cRes.ok) throw new Error("Failed to fetch products or categories");
        setProducts(await pRes.json());
        setCategories(await cRes.json());
      } else if (activeTab === "categories") {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        setCategories(await res.json());
      } else if (activeTab === "banners") {
        const res = await fetch("/api/admin/banners", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch banners");
        setBanners(await res.json());
      } else if (activeTab === "settings") {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        if (Object.keys(data).length > 0) setSettings(data as AppSettings);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Erro ao carregar dados. Verifique sua conexão.");
    }
  };

  const handleOpenModal = (item?: any) => {
    setError("");
    if (activeTab === "products") {
      setEditingItem(item || null);
      setFormData(item ? { ...item, price: item.price.toString(), stock: item.stock.toString() } : { name: "", price: "", stock: "0", description: "", category_id: "", image: "" });
    } else if (activeTab === "categories") {
      setEditingItem(item || null);
      setFormData(item ? { ...item } : { name: "" });
    } else if (activeTab === "banners") {
      setEditingItem(item || null);
      setFormData(item ? { ...item } : { title: "", subtitle: "", image: "", active: 1 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    let endpoint = "";
    if (activeTab === "products") endpoint = "/api/products";
    else if (activeTab === "categories") endpoint = "/api/categories";
    else if (activeTab === "banners") endpoint = "/api/banners";

    const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
    const method = editingItem ? "PUT" : "POST";

    let body = { ...formData };
    if (activeTab === "products") {
      body.price = parseFloat(formData.price);
      body.stock = parseInt(formData.stock);
      body.category_id = parseInt(formData.category_id);
    } else if (activeTab === "banners") {
      body.active = formData.active ? 1 : 0;
    }

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchData();
    } else {
      const data = await res.json();
      setError(data.error || "Ocorreu um erro ao salvar.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    let endpoint = "";
    if (activeTab === "products") endpoint = "/api/products";
    else if (activeTab === "categories") endpoint = "/api/categories";
    else if (activeTab === "banners") endpoint = "/api/banners";

    const res = await fetch(`${endpoint}/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (res.ok) {
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao excluir.");
    }
  };

  const handleQuickPriceUpdate = async (product: Product, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price)) return;

    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        ...product,
        price
      })
    });
    fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (res.ok) {
        const { imageUrl } = await res.json();
        setFormData({ ...formData, image: imageUrl });
      } else {
        setError("Erro ao fazer upload da imagem.");
      }
    } catch (err) {
      setError("Erro de conexão ao fazer upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    if (!imageUrl.startsWith("/uploads/")) {
      alert("Apenas imagens locais podem ser baixadas.");
      return;
    }
    
    const filename = imageUrl.replace("/uploads/", "");
    try {
      const res = await fetch(`/api/download/${filename}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Erro ao baixar arquivo.");
      }
    } catch (err) {
      alert("Erro de conexão ao baixar.");
    }
  };

  const handleSaveSettings = async () => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    if (res.ok) alert("Configurações salvas!");
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight">Painel de Controle</h1>
          <p className="text-stone-400 text-lg">Gerencie sua presença digital e acompanhe seu crescimento.</p>
        </div>
        <div className="flex bg-stone-100/50 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/50 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "dashboard" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "products" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            Produtos
          </button>
          <button 
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "categories" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            Categorias
          </button>
          <button 
            onClick={() => setActiveTab("banners")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "banners" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            Banners
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "settings" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            Aparência
          </button>
        </div>
      </header>

      {activeTab === "dashboard" && stats && stats.totalProducts !== undefined && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-white p-8 rounded-[2.5rem] border border-stone-200/60 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500">
              <div className="flex flex-col gap-6">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em] mb-1">Total de Produtos</p>
                  <h3 className="text-4xl font-bold text-stone-900 tracking-tight">{stats.totalProducts}</h3>
                </div>
              </div>
            </div>
            <div className="group bg-white p-8 rounded-[2.5rem] border border-stone-200/60 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500">
              <div className="flex flex-col gap-6">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em] mb-1">Categorias</p>
                  <h3 className="text-4xl font-bold text-stone-900 tracking-tight">{stats.totalCategories}</h3>
                </div>
              </div>
            </div>
            <div className="group bg-white p-8 rounded-[2.5rem] border border-stone-200/60 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500">
              <div className="flex flex-col gap-6">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em] mb-1">Preço Médio</p>
                  <h3 className="text-4xl font-bold text-stone-900 tracking-tight">R$ {(stats.avgPrice || 0).toFixed(2)}</h3>
                </div>
              </div>
            </div>
            <div className="group bg-white p-8 rounded-[2.5rem] border border-stone-200/60 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500">
              <div className="flex flex-col gap-6">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em] mb-1">Valor em Estoque</p>
                  <h3 className="text-4xl font-bold text-stone-900 tracking-tight">R$ {(stats.stockValue || 0).toFixed(2)}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                Produtos por Categoria
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryStats || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      cursor={{fill: '#f8fafc'}}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-emerald-600" />
                Distribuição de Categorias
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryStats || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {stats.categoryStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600" />
                Identidade Visual
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Nome da Loja</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={settings.storeName}
                    onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Cor Primária</label>
                  <div className="flex gap-2">
                    <input 
                      type="color"
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    />
                    <input 
                      type="text"
                      className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-sm"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Fonte do Sistema</label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <select 
                      className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                      value={settings.fontFamily}
                      onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}
                    >
                      <option value="Inter">Inter (Padrão)</option>
                      <option value="'Space Grotesk', sans-serif">Space Grotesk (Tech)</option>
                      <option value="'Playfair Display', serif">Playfair Display (Elegante)</option>
                      <option value="'JetBrains Mono', monospace">JetBrains Mono (Moderno)</option>
                      <option value="'Cormorant Garamond', serif">Cormorant Garamond (Clássico)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Layout className="w-5 h-5 text-emerald-600" />
                Layout do Catálogo
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSettings({...settings, layoutMode: 'grid'})}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${settings.layoutMode === 'grid' ? "border-emerald-600 bg-emerald-50" : "border-stone-100 hover:border-stone-200"}`}
                >
                  <Monitor className="w-8 h-8 text-stone-400" />
                  <span className="font-bold text-sm">Grade (Grid)</span>
                </button>
                <button 
                  onClick={() => setSettings({...settings, layoutMode: 'list'})}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${settings.layoutMode === 'list' ? "border-emerald-600 bg-emerald-50" : "border-stone-100 hover:border-stone-200"}`}
                >
                  <Smartphone className="w-8 h-8 text-stone-400" />
                  <span className="font-bold text-sm">Lista (Mobile-first)</span>
                </button>
              </div>
            </div>

            <button 
              onClick={handleSaveSettings}
              className="w-full py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-stone-900/10"
            >
              Salvar Todas as Configurações
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-xl">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                Dica de Design
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Use cores que contrastem bem com o fundo claro. O modo "Lista" é ideal para catálogos com descrições longas, enquanto o "Grade" destaca melhor as imagens dos produtos.
              </p>
            </div>
          </div>
        </div>
      ) : activeTab !== "dashboard" ? (
        <>
          <div className="flex justify-end">
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-5 h-5" />
              {activeTab === "products" ? "Novo Produto" : activeTab === "categories" ? "Nova Categoria" : "Novo Banner"}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                      {activeTab === "products" ? "Produto" : activeTab === "categories" ? "Nome da Categoria" : "Banner"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                      {activeTab === "products" ? "Categoria" : activeTab === "categories" ? "ID" : "Status"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                      {activeTab === "products" ? "Preço / Estoque" : activeTab === "categories" ? "" : "Subtítulo"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(activeTab === "products" ? products : activeTab === "categories" ? categories : banners).map((item: any) => (
                    <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {activeTab !== "categories" && (
                            <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                              <img 
                                src={item.image || `https://picsum.photos/seed/${item.id}/100/100`} 
                                alt="" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-stone-900">
                              {activeTab === "products" ? item.name : activeTab === "categories" ? item.name : item.title}
                            </div>
                            {activeTab === "products" && <div className="text-xs text-stone-400 truncate max-w-[200px]">{item.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {activeTab === "products" ? (
                          <span className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded-md">
                            {item.category || "Sem Categoria"}
                          </span>
                        ) : activeTab === "categories" ? (
                          <span className="text-stone-400 font-mono text-xs">#{item.id}</span>
                        ) : (
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {item.active ? "Ativo" : "Inativo"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {activeTab === "products" ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 group/price">
                              <span className="text-stone-400 text-xs">R$</span>
                              <input 
                                type="number"
                                step="0.01"
                                className="w-24 px-2 py-1 bg-transparent border-b border-transparent hover:border-stone-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-mono font-medium text-emerald-600"
                                defaultValue={item.price}
                                onBlur={(e) => handleQuickPriceUpdate(item, e.target.value)}
                              />
                              <Save className="w-3 h-3 text-stone-300 opacity-0 group-hover/price:opacity-100" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase ${item.stock > 10 ? "text-stone-400" : item.stock > 0 ? "text-amber-500" : "text-red-500"}`}>
                                Estoque: {item.stock}
                              </span>
                            </div>
                          </div>
                        ) : activeTab === "categories" ? null : (
                          <span className="text-stone-500 text-sm">{item.subtitle}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.image?.startsWith("/uploads/") && (
                            <button 
                              onClick={() => handleDownload(item.image)}
                              className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Baixar Imagem"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenModal(item)}
                            className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <h2 className="text-xl font-bold text-stone-900">
                  {editingItem ? "Editar" : "Novo"} {activeTab === "products" ? "Produto" : activeTab === "categories" ? "Categoria" : "Banner"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">
                    {error}
                  </div>
                )}

                {activeTab === "products" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Nome do Produto</label>
                        <input 
                          type="text" required
                          className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Preço (R$)</label>
                        <input 
                          type="number" step="0.01" required
                          className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Estoque</label>
                        <input 
                          type="number" required
                          className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                          value={formData.stock}
                          onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Categoria</label>
                        <select 
                          required
                          className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                          value={formData.category_id}
                          onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                        >
                          <option value="">Selecionar Categoria</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Descrição</label>
                      <textarea 
                        rows={3}
                        className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                  </>
                ) : activeTab === "categories" ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Nome da Categoria</label>
                    <div className="relative">
                      <Tags className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input 
                        type="text" required
                        className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Ex: Eletrônicos, Roupas..."
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Título do Banner</label>
                      <input 
                        type="text" required
                        className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Subtítulo</label>
                      <input 
                        type="text" required
                        className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center gap-2 py-2">
                      <input 
                        type="checkbox"
                        id="active"
                        className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                        checked={!!formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked ? 1 : 0})}
                      />
                      <label htmlFor="active" className="text-sm font-medium text-stone-700">Banner Ativo</label>
                    </div>
                  </>
                )}

                {activeTab !== "categories" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Imagem</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                          type="url" required
                          className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="URL da imagem ou faça upload"
                          value={formData.image}
                          onChange={(e) => setFormData({...formData, image: e.target.value})}
                        />
                      </div>
                      <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </label>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
