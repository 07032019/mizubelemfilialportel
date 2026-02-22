import { useState, useEffect } from "react";
import { Banner } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch("/api/banners")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch banners");
        return res.json();
      })
      .then(data => setBanners(data))
      .catch(err => console.error("Banner fetch error:", err));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  if (banners.length === 0) return null;

  const next = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

  return (
    <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden rounded-3xl shadow-xl group">
      <AnimatePresence mode="wait">
        <motion.div
          key={banners[currentIndex].id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img 
            src={banners[currentIndex].image} 
            alt={banners[currentIndex].title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent flex flex-col justify-end p-8 md:p-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-4 max-w-2xl"
            >
              <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-[0.3em] text-white rounded-full">
                Destaque da Semana
              </span>
              <h2 className="text-4xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                {banners[currentIndex].title}
              </h2>
              <p className="text-lg md:text-xl text-stone-300 leading-relaxed font-medium">
                {banners[currentIndex].subtitle}
              </p>
              <div className="pt-4">
                <button className="px-8 py-4 bg-white text-stone-900 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[var(--primary,#10b981)] hover:text-white transition-all duration-300 shadow-xl shadow-black/20">
                  Explorar Agora
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? "w-8 bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
