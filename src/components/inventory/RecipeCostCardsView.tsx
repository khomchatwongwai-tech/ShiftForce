import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { RecipeCostCard, RecipeIngredient, UnitOfMeasure } from '../../types/inventory';
import { Department } from '../../types';
import {
  Utensils,
  Plus,
  Search,
  DollarSign,
  Percent,
  Clock,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Flame,
  ChefHat,
  X,
  Layers
} from 'lucide-react';

export const RecipeCostCardsView: React.FC = () => {
  const { recipes, items, saveRecipe, deleteRecipe } = useInventory();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeCostCard | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    category: RecipeCostCard['category'];
    department: Department;
    portionSize: string;
    yieldServings: number;
    menuPrice: number;
    targetFoodCostPercentage: number;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    station: string;
    instructions: string;
    allergens: string;
    ingredients: RecipeIngredient[];
  }>({
    name: '',
    category: 'Entrees',
    department: 'Back of House',
    portionSize: '1 Serving',
    yieldServings: 1,
    menuPrice: 28.00,
    targetFoodCostPercentage: 28.0,
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    station: 'Main Kitchen',
    instructions: '1. Prep ingredients.\n2. Cook to target internal temp.\n3. Plate and garnish.',
    allergens: 'Dairy',
    ingredients: [],
  });

  const handleOpenAdd = () => {
    setEditingRecipe(null);
    setFormData({
      name: '',
      category: 'Entrees',
      department: 'Back of House',
      portionSize: '1 Serving',
      yieldServings: 1,
      menuPrice: 32.00,
      targetFoodCostPercentage: 28.0,
      prepTimeMinutes: 10,
      cookTimeMinutes: 12,
      station: 'Grill Station',
      instructions: '1. Season protein.\n2. Sear over high heat.\n3. Rest and serve.',
      allergens: '',
      ingredients: items.slice(0, 2).map((item) => ({
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitOfMeasure: item.unitOfMeasure,
        unitCost: item.unitCost,
        extendedCost: item.unitCost,
        prepYieldPercent: 95,
        actualCost: item.unitCost / 0.95,
      })),
    });
    setShowModal(true);
  };

  const handleOpenEdit = (rec: RecipeCostCard) => {
    setEditingRecipe(rec);
    setFormData({
      name: rec.name,
      category: rec.category,
      department: rec.department,
      portionSize: rec.portionSize,
      yieldServings: rec.yieldServings,
      menuPrice: rec.menuPrice,
      targetFoodCostPercentage: rec.targetFoodCostPercentage,
      prepTimeMinutes: rec.prepTimeMinutes,
      cookTimeMinutes: rec.cookTimeMinutes,
      station: rec.station,
      instructions: rec.instructions.join('\n'),
      allergens: rec.allergens.join(', '),
      ingredients: rec.ingredients,
    });
    setShowModal(true);
  };

  const handleAddIngredient = () => {
    const defaultItem = items[0];
    if (!defaultItem) return;
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          itemId: defaultItem.id,
          itemName: defaultItem.name,
          quantity: 1,
          unitOfMeasure: defaultItem.unitOfMeasure,
          unitCost: defaultItem.unitCost,
          extendedCost: defaultItem.unitCost,
          prepYieldPercent: 100,
          actualCost: defaultItem.unitCost,
        },
      ],
    }));
  };

  const handleIngredientItemSelect = (index: number, itemId: string) => {
    const selectedItem = items.find((i) => i.id === itemId);
    if (!selectedItem) return;
    setFormData((prev) => {
      const updated = [...prev.ingredients];
      const curr = updated[index];
      const ext = Number((curr.quantity * selectedItem.unitCost).toFixed(2));
      const act = Number((ext / (curr.prepYieldPercent / 100)).toFixed(2));
      updated[index] = {
        ...curr,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        unitOfMeasure: selectedItem.unitOfMeasure,
        unitCost: selectedItem.unitCost,
        extendedCost: ext,
        actualCost: act,
      };
      return { ...prev, ingredients: updated };
    });
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: number) => {
    setFormData((prev) => {
      const updated = [...prev.ingredients];
      const curr = { ...updated[index], [field]: value };
      curr.extendedCost = Number((curr.quantity * curr.unitCost).toFixed(2));
      curr.actualCost = Number((curr.extendedCost / (Math.max(1, curr.prepYieldPercent) / 100)).toFixed(2));
      updated[index] = curr;
      return { ...prev, ingredients: updated };
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.ingredients.length === 0) return;

    await saveRecipe(
      {
        organizationId: 'org-shiftforce-corp',
        locationId: 'loc-01',
        name: formData.name,
        category: formData.category,
        department: formData.department,
        portionSize: formData.portionSize,
        yieldServings: formData.yieldServings,
        menuPrice: formData.menuPrice,
        targetFoodCostPercentage: formData.targetFoodCostPercentage,
        prepTimeMinutes: formData.prepTimeMinutes,
        cookTimeMinutes: formData.cookTimeMinutes,
        station: formData.station,
        allergens: formData.allergens.split(',').map((s) => s.trim()).filter(Boolean),
        instructions: formData.instructions.split('\n').filter(Boolean),
        ingredients: formData.ingredients,
        status: 'active',
      },
      editingRecipe?.id
    );

    setShowModal(false);
  };

  const filteredRecipes = recipes.filter((rec) => {
    if (selectedCategory !== 'All' && rec.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return rec.name.toLowerCase().includes(q) || rec.station.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ChefHat className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recipe Costing & Menu Engineering Cards</h2>
              <p className="text-xs text-slate-500">Live ingredient costs, prep yield margins, and target food cost % tracking</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create Recipe Cost Card
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipes, station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
          >
            <option value="All">All Categories</option>
            <option value="Steaks & Chops">Steaks & Chops</option>
            <option value="Seafood">Seafood</option>
            <option value="Entrees">Entrees</option>
            <option value="Craft Cocktails">Craft Cocktails</option>
            <option value="Desserts">Desserts</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900">{filteredRecipes.length}</strong> active recipes
        </div>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRecipes.map((rec) => {
          const isProfitable = rec.foodCostPercentage <= rec.targetFoodCostPercentage;

          return (
            <div key={rec.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md">
                      {rec.category}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">{rec.station}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRecipe(rec.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-tight">{rec.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{rec.portionSize} • Yield: {rec.yieldServings} Serving</p>

                {/* Financial Summary Grid */}
                <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Menu Price</span>
                    <div className="text-base font-black text-slate-900 mt-0.5">${rec.menuPrice.toFixed(2)}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Cost / Serv</span>
                    <div className="text-base font-bold text-indigo-700 mt-0.5">${rec.costPerServing.toFixed(2)}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Food Cost %</span>
                    <div className={`text-base font-black mt-0.5 ${isProfitable ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {rec.foodCostPercentage.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Margin ($)</span>
                    <div className="text-base font-bold text-emerald-700 mt-0.5">${rec.grossProfitMargin.toFixed(2)}</div>
                  </div>
                </div>

                {/* Ingredients Breakdown Table */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Recipe Ingredient Yield Cost</h4>
                  <div className="space-y-1.5">
                    {rec.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                        <span className="font-medium text-slate-800 truncate max-w-[200px]">{ing.itemName}</span>
                        <div className="text-right text-slate-500">
                          <span>{ing.quantity} {ing.unitOfMeasure}</span>
                          <span className="text-slate-400 mx-1">@</span>
                          <span className="font-semibold text-slate-700">${ing.actualCost.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({ing.prepYieldPercent}% yield)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prep steps & Allergens footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Prep: {rec.prepTimeMinutes}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Cook: {rec.cookTimeMinutes}m
                  </span>
                </div>

                {rec.allergens.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded">
                      Allergens: {rec.allergens.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Recipe Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingRecipe ? 'Edit Recipe Cost Card' : 'Create New Menu Item Recipe Card'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Recipe Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Menu Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.menuPrice}
                    onChange={(e) => setFormData({ ...formData, menuPrice: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  >
                    <option value="Steaks & Chops">Steaks & Chops</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Entrees">Entrees</option>
                    <option value="Appetizers">Appetizers</option>
                    <option value="Craft Cocktails">Craft Cocktails</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Target Food Cost %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    value={formData.targetFoodCostPercentage}
                    onChange={(e) => setFormData({ ...formData, targetFoodCostPercentage: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Prep Station</label>
                  <input
                    type="text"
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              {/* Dynamic Ingredients Editor */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ingredients & Yield %</h4>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Ingredient
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.ingredients.map((ing, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="col-span-5">
                        <select
                          value={ing.itemId}
                          onChange={(e) => handleIngredientItemSelect(index, e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-900 truncate"
                        >
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} (${item.unitCost.toFixed(2)}/{item.unitOfMeasure})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.05"
                          min="0.01"
                          value={ing.quantity}
                          onChange={(e) => handleIngredientChange(index, 'quantity', Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-900 text-center"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          max="100"
                          value={ing.prepYieldPercent}
                          onChange={(e) => handleIngredientChange(index, 'prepYieldPercent', Number(e.target.value))}
                          placeholder="Yield %"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-900 text-center"
                        />
                      </div>

                      <div className="col-span-2 text-right font-bold text-xs text-slate-800">
                        ${ing.actualCost.toFixed(2)}
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm"
                >
                  Save Recipe Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
