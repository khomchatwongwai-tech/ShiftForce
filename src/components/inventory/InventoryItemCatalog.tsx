import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  InventoryItem,
  InventoryCategory,
  InventoryCategoryGroup,
  UnitOfMeasure,
  StorageLocation,
  StockStatus
} from '../../types/inventory';
import { Department } from '../../types';
import { WasteLogger } from './WasteLogger';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  Sliders,
  Sparkles,
  ArrowUpDown,
  Calendar,
  Truck,
  Layers,
  X
} from 'lucide-react';

export const InventoryItemCatalog: React.FC = () => {
  const { items, addItem, updateItem, deleteItem } = useInventory();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<InventoryCategoryGroup | 'All'>('All');
  const [selectedStorage, setSelectedStorage] = useState<StorageLocation | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<StockStatus | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [wasteLoggingItemId, setWasteLoggingItemId] = useState<string | null>(null);

  // Form State for Add / Edit Item
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    barcode: string;
    category: InventoryCategory;
    categoryGroup: InventoryCategoryGroup;
    department: Department;
    unitOfMeasure: UnitOfMeasure;
    packSize: number;
    packUnit: string;
    conversionRatio: number;
    unitCost: number;
    parLevel: number;
    reorderPoint: number;
    reorderQuantity: number;
    quantityOnHand: number;
    storageArea: StorageLocation;
    storageBin: string;
    supplierName: string;
    leadTimeDays: number;
    isPerishable: boolean;
    shelfLifeDays: number;
    notes: string;
  }>({
    name: '',
    sku: '',
    barcode: '',
    category: 'Meats & Poultry',
    categoryGroup: 'Food',
    department: 'Back of House',
    unitOfMeasure: 'unit',
    packSize: 1,
    packUnit: 'Unit',
    conversionRatio: 1,
    unitCost: 10.0,
    parLevel: 20,
    reorderPoint: 5,
    reorderQuantity: 15,
    quantityOnHand: 15,
    storageArea: 'Walk-in Cooler',
    storageBin: '',
    supplierName: 'Sysco Premium Foods',
    leadTimeDays: 2,
    isPerishable: true,
    shelfLifeDays: 7,
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      barcode: '',
      category: 'Meats & Poultry',
      categoryGroup: 'Food',
      department: 'Back of House',
      unitOfMeasure: 'unit',
      packSize: 1,
      packUnit: 'Case',
      conversionRatio: 1,
      unitCost: 12.50,
      parLevel: 25,
      reorderPoint: 8,
      reorderQuantity: 20,
      quantityOnHand: 18,
      storageArea: 'Walk-in Cooler',
      storageBin: 'Section A-1',
      supplierName: 'Sysco Foods',
      leadTimeDays: 2,
      isPerishable: true,
      shelfLifeDays: 7,
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      barcode: item.barcode || '',
      category: item.category,
      categoryGroup: item.categoryGroup,
      department: item.department,
      unitOfMeasure: item.unitOfMeasure,
      packSize: item.packSize,
      packUnit: item.packUnit,
      conversionRatio: item.conversionRatio,
      unitCost: item.unitCost,
      parLevel: item.parLevel,
      reorderPoint: item.reorderPoint,
      reorderQuantity: item.reorderQuantity,
      quantityOnHand: item.quantityOnHand,
      storageArea: item.storageArea,
      storageBin: item.storageBin || '',
      supplierName: item.supplierName,
      leadTimeDays: item.leadTimeDays,
      isPerishable: item.isPerishable,
      shelfLifeDays: item.shelfLifeDays || 14,
      notes: item.notes || '',
    });
    setShowAddModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) return;

    let status: StockStatus = 'in_stock';
    if (formData.quantityOnHand <= 0) {
      status = 'out_of_stock';
    } else if (formData.quantityOnHand <= formData.reorderPoint) {
      status = 'critical';
    } else if (formData.quantityOnHand < formData.parLevel * 0.6) {
      status = 'low_stock';
    } else if (formData.quantityOnHand > formData.parLevel * 1.5) {
      status = 'overstocked';
    }

    if (editingItem) {
      await updateItem(editingItem.id, {
        ...formData,
        packCost: formData.unitCost * formData.conversionRatio,
        status,
      });
    } else {
      await addItem({
        organizationId: 'org-workqora-corp',
        locationId: 'loc-01',
        ...formData,
        packCost: formData.unitCost * formData.conversionRatio,
        beginningInventory: formData.quantityOnHand,
        purchasesReceived: 0,
        transfersIn: 0,
        transfersOut: 0,
        depletionsSalesUsage: 0,
        wasteQuantity: 0,
        endingInventory: formData.quantityOnHand,
        theoreticalUsage: 0,
        actualUsage: 0,
        varianceQuantity: 0,
        varianceCost: 0,
        status,
      });
    }

    setShowAddModal(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedGroup !== 'All' && item.categoryGroup !== selectedGroup) return false;
      if (selectedStorage !== 'All' && item.storageArea !== selectedStorage) return false;
      if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchSku = item.sku.toLowerCase().includes(query);
        const matchSupplier = item.supplierName.toLowerCase().includes(query);
        if (!matchName && !matchSku && !matchSupplier) return false;
      }
      return true;
    });
  }, [items, selectedGroup, selectedStorage, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Master Inventory Catalog & Par Levels</h2>
              <p className="text-xs text-slate-500">Live stock valuation, safety thresholds, and SKU specifications</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Inventory Item
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium ml-1">Group:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
            >
              <option value="All">All Groups</option>
              <option value="Food">Food Only</option>
              <option value="Beverage & Bar">Beverage & Bar</option>
              <option value="Operating Supplies">Operating Supplies</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium ml-1">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="critical">Critical Par Risk</option>
              <option value="overstocked">Overstocked</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900">{filteredItems.length}</strong> of {items.length} SKUs
        </div>
      </div>

      {/* Item Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const totalExtendedValue = item.quantityOnHand * item.unitCost;
          const parPercentage = (item.quantityOnHand / Math.max(1, item.parLevel)) * 100;

          return (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                {/* Header Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {item.sku}
                    </span>
                    <span className="ml-2 text-[10px] font-semibold text-slate-400 uppercase">
                      {item.categoryGroup}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.status === 'in_stock' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        In Stock
                      </span>
                    )}
                    {item.status === 'low_stock' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Low Stock
                      </span>
                    )}
                    {item.status === 'critical' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Critical Reorder
                      </span>
                    )}
                    {item.status === 'overstocked' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        Overstocked
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{item.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{item.category} • {item.storageArea}</p>

                {/* Par Level Progress Bar */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Stock vs. Par Target</span>
                    <span className="font-bold text-slate-900">
                      {item.quantityOnHand} / {item.parLevel} {item.unitOfMeasure} ({parPercentage.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        parPercentage <= 30
                          ? 'bg-rose-500'
                          : parPercentage <= 65
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, parPercentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Reorder Point: {item.reorderPoint} {item.unitOfMeasure}</span>
                    <span>Reorder Qty: {item.reorderQuantity} {item.unitOfMeasure}</span>
                  </div>
                </div>

                {/* Key Cost & Supplier Grid */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="p-2 bg-slate-50/70 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Unit Cost</span>
                    <strong className="text-slate-900">${item.unitCost.toFixed(2)}</strong> / {item.unitOfMeasure}
                  </div>

                  <div className="p-2 bg-slate-50/70 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Total Value</span>
                    <strong className="text-emerald-700">${totalExtendedValue.toFixed(2)}</strong>
                  </div>

                  <div className="p-2 bg-slate-50/70 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Pack Spec</span>
                    <span className="text-slate-800 font-medium">{item.packUnit} ({item.conversionRatio}x)</span>
                  </div>

                  <div className="p-2 bg-slate-50/70 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Distributor</span>
                    <span className="text-slate-800 font-medium truncate block">{item.supplierName}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <div className="text-[11px] text-slate-400">
                  Lead: {item.leadTimeDays}d • {item.isPerishable ? 'Perishable' : 'Shelf Stable'}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id={`btn-log-waste-item-${item.id}`}
                    type="button"
                    onClick={() => setWasteLoggingItemId(item.id)}
                    className="px-2 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 rounded-lg transition-colors flex items-center space-x-1"
                    title="Record Waste for this item"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Log Waste</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Item Specs"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* WasteLogger Modal when triggered from item card */}
      {wasteLoggingItemId && (
        <WasteLogger
          isOpen={true}
          preselectedItemId={wasteLoggingItemId}
          onClose={() => setWasteLoggingItemId(null)}
        />
      )}

      {/* Add / Edit Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Inventory Item Specifications' : 'Add New Inventory Master SKU'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. USDA Prime Center-Cut Ribeye 14oz"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">SKU / Item ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. BEEF-RIBEYE-14OZ"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category Group</label>
                  <select
                    value={formData.categoryGroup}
                    onChange={(e) => setFormData({ ...formData, categoryGroup: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  >
                    <option value="Food">Food</option>
                    <option value="Beverage & Bar">Beverage & Bar</option>
                    <option value="Operating Supplies">Operating Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Specific Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  >
                    <option value="Meats & Poultry">Meats & Poultry</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Dairy & Eggs">Dairy & Eggs</option>
                    <option value="Dry Goods & Pantry">Dry Goods & Pantry</option>
                    <option value="Draft Beer">Draft Beer</option>
                    <option value="Bottled & Canned Beer">Bottled & Canned Beer</option>
                    <option value="Wine - Red">Wine - Red</option>
                    <option value="Spirits & Liquors">Spirits & Liquors</option>
                    <option value="Paper & Disposables">Paper & Disposables</option>
                    <option value="Chemicals & Sanitation">Chemicals & Sanitation</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={formData.unitOfMeasure}
                    onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  >
                    <option value="unit">unit / portion</option>
                    <option value="lb">lb (pounds)</option>
                    <option value="oz">oz (ounces)</option>
                    <option value="bottle">bottle</option>
                    <option value="keg">keg (1/2 BBL)</option>
                    <option value="liter">liter</option>
                    <option value="case">case</option>
                    <option value="gal">gal (gallon)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Par Level Target</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.parLevel}
                    onChange={(e) => setFormData({ ...formData, parLevel: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Reorder Point</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.reorderPoint}
                    onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Storage Area</label>
                  <select
                    value={formData.storageArea}
                    onChange={(e) => setFormData({ ...formData, storageArea: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  >
                    <option value="Walk-in Cooler">Walk-in Cooler</option>
                    <option value="Walk-in Freezer">Walk-in Freezer</option>
                    <option value="Dry Storage Pantry">Dry Storage Pantry</option>
                    <option value="Main Bar Liquor Room">Main Bar Liquor Room</option>
                    <option value="Wine Cellar / Rack">Wine Cellar / Rack</option>
                    <option value="Kitchen Prep Station">Kitchen Prep Station</option>
                    <option value="Dish & Chemical Room">Dish & Chemical Room</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Primary Supplier / Vendor</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
                >
                  {editingItem ? 'Save Updates' : 'Add Item to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
