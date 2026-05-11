// Top destination header containing dynamically fetched Unsplash banners.
import React from 'react';

interface TheLabHeroProps {
  itinerary: any;
}

const TheLabHero = React.memo(function TheLabHero({ itinerary }: TheLabHeroProps) {
  if (!itinerary || !itinerary.itinerary || itinerary.itinerary.length === 0) return null;

  return (
    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden h-28 sm:h-36 md:h-40 shadow-xl group border border-white/10 mb-4 sm:mb-6">
      <img
        src={(itinerary.itinerary[0] as any)?.imageUrl || "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=2000&auto=format&fit=crop"}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.5]"
        alt="Destination"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

      <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 text-white">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <span className="aurora-gradient text-[7px] sm:text-[8px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest shadow-lg">Active Journey</span>
        </div>
        <h2 className="font-extrabold tracking-tighter" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
          Tropical Intelligence: <span className="text-gradient">{itinerary.itinerary[0]?.areaFocus?.split(',')[0]}</span>
        </h2>
      </div>
    </div>
  );
});

export default TheLabHero;


