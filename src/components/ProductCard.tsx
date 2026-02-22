import { Product } from "../types";
import { motion } from "motion/react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white rounded-[2rem] border border-stone-200/60 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-stone-200/50 hover:-translate-y-1"
    >
      <div className="aspect-[4/5] bg-stone-100 relative overflow-hidden">
        <img 
          src={product.image || `https://picsum.photos/seed/${product.id}/400/500`} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-stone-900 rounded-full border border-stone-200/50 shadow-sm">
            {product.category}
          </span>
        </div>

        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
            <span className="px-4 py-2 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-stone-900 tracking-tight group-hover:text-[var(--primary,#10b981)] transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex items-end justify-between pt-2">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Preço</p>
            <span className="text-xl font-bold text-stone-900">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Estoque</p>
            <span className={`text-xs font-bold ${product.stock > 10 ? "text-stone-400" : product.stock > 0 ? "text-amber-500" : "text-red-500"}`}>
              {product.stock > 0 ? `${product.stock} un.` : "Indisponível"}
            </span>
          </div>
        </div>

        <button 
          className={`w-full py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
            product.stock > 0 
            ? "bg-stone-900 text-white hover:bg-[var(--primary,#10b981)] hover:shadow-lg hover:shadow-[var(--primary,#10b981)]/20" 
            : "bg-stone-100 text-stone-400 cursor-not-allowed"
          }`}
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? "Adicionar ao Carrinho" : "Indisponível"}
        </button>
      </div>
    </motion.div>
  );
}
