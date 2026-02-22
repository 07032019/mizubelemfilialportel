import { Link } from "react-router-dom";
import { ShoppingBag, User, LogOut, LayoutDashboard, Settings } from "lucide-react";

interface NavbarProps {
  token: string | null;
  onLogout: () => void;
  storeName?: string;
}

export default function Navbar({ token, onLogout, storeName }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center group-hover:bg-[var(--primary,#10b981)] transition-colors duration-300">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-900 uppercase">
            {storeName || "Catálogo"}
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <Link to="/" className="text-sm font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors">
            Catálogo
          </Link>
          {token ? (
            <div className="flex items-center gap-4 pl-8 border-l border-stone-200">
              <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-all">
                <LayoutDashboard className="w-4 h-4" />
                Painel
              </Link>
              <button 
                onClick={onLogout}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[var(--primary,#10b981)] transition-all shadow-xl shadow-stone-900/10 hover:shadow-[var(--primary,#10b981)]/20">
              <User className="w-4 h-4" />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
