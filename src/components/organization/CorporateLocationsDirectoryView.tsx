import React, { useState } from 'react';
import { LocationProfile, OrganizationProfile, Employee, PortalType } from '../../types';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Search,
  Plus,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Globe,
  Clock,
  TrendingUp,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { LocationProfileModal } from './LocationProfileModal';

interface CorporateLocationsDirectoryViewProps {
  portal: PortalType;
  organizations: OrganizationProfile[];
  locations: LocationProfile[];
  employees: Employee[];
  currentLocationId: string;
  onSelectLocation: (locId: string) => void;
  onUpdateLocation: (loc: LocationProfile) => void;
  onAddLocation: (loc: LocationProfile) => void;
}

export const CorporateLocationsDirectoryView: React.FC<CorporateLocationsDirectoryViewProps> = ({
  portal,
  organizations,
  locations,
  employees,
  currentLocationId,
  onSelectLocation,
  onUpdateLocation,
  onAddLocation
}) => {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [editingLocation, setEditingLocation] = useState<LocationProfile | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const activeOrg = organizations[0];

  const regions = Array.from(new Set(locations.map(l => l.regionName)));

  const filteredLocations = locations.filter(loc => {
    const q = search.toLowerCase();
    const matchSearch =
      loc.locationName.toLowerCase().includes(q) ||
      loc.displayName.toLowerCase().includes(q) ||
      loc.storeNumber.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q) ||
      loc.generalManagerName.toLowerCase().includes(q);

    const matchRegion = regionFilter === 'all' || loc.regionName === regionFilter;
    return matchSearch && matchRegion;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Corporate Locations Directory &amp; Units
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50">
              {locations.length} Operating Units
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hierarchy, store numbers, branding names, address registry, and general manager oversight across all corporate branches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Location</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by store number, city, manager..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Region:</span>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
          >
            <option value="all">All Enterprise Regions</option>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLocations.map(loc => {
          const locStaff = employees.filter(e => e.locationId === loc.id || e.primaryLocationId === loc.id);
          const isCurrent = loc.id === currentLocationId;

          return (
            <div
              key={loc.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div>
                {/* Top Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-mono font-bold text-xs border border-indigo-200/50">
                      {loc.storeNumber}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {loc.districtName}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {loc.status.toUpperCase()}
                  </span>
                </div>

                {/* Location Name & Display Name */}
                <div className="mt-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {loc.displayName || loc.locationName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono text-[11px]">
                    Code: {loc.locationCode} • Path: {loc.hierarchyPath.split(' > ').slice(-2).join(' > ')}
                  </p>
                </div>

                {/* Address & Contact Info */}
                <div className="space-y-2 mt-4 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{loc.addressLine1}, {loc.city}, {loc.state} {loc.zipCode}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{loc.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>GM: <strong>{loc.generalManagerName}</strong> ({locStaff.length} active staff)</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onSelectLocation(loc.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {isCurrent ? '✓ Active Location' : 'Switch Context'}
                </button>

                <button
                  onClick={() => setEditingLocation(loc)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Identity</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Location Modal */}
      {editingLocation && (
        <LocationProfileModal
          isOpen={true}
          onClose={() => setEditingLocation(null)}
          location={editingLocation}
          organization={activeOrg}
          onSave={(updated) => {
            onUpdateLocation(updated);
            setEditingLocation(null);
          }}
        />
      )}

      {/* Add Location Modal */}
      {isAddOpen && (
        <LocationProfileModal
          isOpen={true}
          onClose={() => setIsAddOpen(false)}
          isNew={true}
          organization={activeOrg}
          onSave={(newLoc) => {
            onAddLocation(newLoc);
            setIsAddOpen(false);
          }}
        />
      )}
    </div>
  );
};
