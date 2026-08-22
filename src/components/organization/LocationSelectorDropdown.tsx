import React, { useState, useRef, useEffect } from 'react';
import { LocationProfile, OrganizationProfile } from '../../types';
import { Building2, ChevronDown, Search, MapPin, Check, Star, Plus } from 'lucide-react';

interface LocationSelectorDropdownProps {
  locations: LocationProfile[];
  currentLocationId: string;
  onSelectLocation: (locationId: string) => void;
  organization?: OrganizationProfile;
}

export const LocationSelectorDropdown: React.FC<LocationSelectorDropdownProps> = ({
  locations,
  currentLocationId,
  onSelectLocation,
  organization
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['loc-kura-104', 'loc-kura-001']);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLoc = locations.find(l => l.id === currentLocationId) || locations[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLocations = locations.filter(loc => {
    const q = search.toLowerCase();
    return (
      loc.locationName.toLowerCase().includes(q) ||
      loc.displayName.toLowerCase().includes(q) ||
      loc.storeNumber.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q) ||
      loc.regionName.toLowerCase().includes(q)
    );
  });

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
      >
        <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <div className="text-left">
          <div className="flex items-center gap-1">
            <span className="font-bold truncate max-w-[140px] sm:max-w-[180px]">
              {selectedLoc ? (selectedLoc.displayName || selectedLoc.locationName) : 'Select Location'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">({selectedLoc?.storeNumber || '#104'})</span>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in duration-150">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search store number, city, district..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {organization && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <span>Org: <strong className="text-slate-700 dark:text-slate-300">{organization.displayName}</strong></span>
                <span>{locations.length} Total Units</span>
              </div>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-1">
            {filteredLocations.map(loc => {
              const isSelected = loc.id === currentLocationId;
              const isFav = favorites.includes(loc.id);

              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc.id);
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {loc.storeNumber.replace('#', '')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold truncate">{loc.displayName || loc.locationName}</p>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {loc.city}, {loc.state} • {loc.regionName}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(e, loc.id)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>
                </div>
              );
            })}

            {filteredLocations.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No location found matching "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
