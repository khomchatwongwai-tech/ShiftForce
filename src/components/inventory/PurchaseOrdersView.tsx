import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { PurchaseOrderInvoice, PurchaseOrderLineItem } from '../../types/inventory';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle,
  Receipt,
  Building,
  Calendar,
  X,
  Trash2
} from 'lucide-react';

export const PurchaseOrdersView: React.FC = () => {
  const { purchaseOrders, items, recordPurchaseOrder, updatePurchaseOrderStatus } = useInventory();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    poNumber: string;
    invoiceNumber: string;
    supplierName: string;
    supplierContact: string;
    orderDate: string;
    expectedDeliveryDate: string;
    paymentTerms: string;
    notes: string;
    taxAmount: number;
    freightShippingAmount: number;
    lines: PurchaseOrderLineItem[];
  }>({
    poNumber: `PO-${Date.now().toString().slice(-6)}`,
    invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
    supplierName: 'Sysco Premium Broadline Foods',
    supplierContact: 'orders@sysco.com | (415) 555-0199',
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    paymentTerms: 'Net 30',
    notes: 'Standard weekly food and dry goods stock replenishment.',
    taxAmount: 64.50,
    freightShippingAmount: 45.00,
    lines: [],
  });

  const handleOpenCreate = () => {
    setFormData({
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
      supplierName: 'Sysco Premium Broadline Foods',
      supplierContact: 'orders@sysco.com',
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      paymentTerms: 'Net 30',
      notes: 'Weekly pantry & meat supply.',
      taxAmount: 50.00,
      freightShippingAmount: 35.00,
      lines: items.slice(0, 3).map((item) => ({
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        category: item.category,
        quantityOrdered: 5,
        quantityReceived: 5,
        unitOfMeasure: item.unitOfMeasure,
        unitPrice: item.unitCost,
        extendedTotal: item.unitCost * 5,
        varianceUnits: 0,
        varianceCost: 0,
      })),
    });
    setShowCreateModal(true);
  };

  const handleAddLine = () => {
    const item = items[0];
    if (!item) return;
    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          category: item.category,
          quantityOrdered: 2,
          quantityReceived: 2,
          unitOfMeasure: item.unitOfMeasure,
          unitPrice: item.unitCost,
          extendedTotal: item.unitCost * 2,
          varianceUnits: 0,
          varianceCost: 0,
        },
      ],
    }));
  };

  const handleLineItemSelect = (index: number, itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setFormData((prev) => {
      const updated = [...prev.lines];
      const curr = updated[index];
      const ext = Number((curr.quantityOrdered * item.unitCost).toFixed(2));
      updated[index] = {
        ...curr,
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        category: item.category,
        unitOfMeasure: item.unitOfMeasure,
        unitPrice: item.unitCost,
        extendedTotal: ext,
      };
      return { ...prev, lines: updated };
    });
  };

  const handleLineQtyChange = (index: number, qty: number) => {
    setFormData((prev) => {
      const updated = [...prev.lines];
      const curr = updated[index];
      const ext = Number((qty * curr.unitPrice).toFixed(2));
      updated[index] = {
        ...curr,
        quantityOrdered: qty,
        quantityReceived: qty,
        extendedTotal: ext,
      };
      return { ...prev, lines: updated };
    });
  };

  const handleRemoveLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.lines.length === 0) return;

    const subtotal = formData.lines.reduce((acc, l) => acc + l.extendedTotal, 0);
    const totalAmount = subtotal + formData.taxAmount + formData.freightShippingAmount;

    await recordPurchaseOrder({
      organizationId: 'org-shiftforce-corp',
      locationId: 'loc-01',
      locationName: 'SF Flagship Downtown #101',
      poNumber: formData.poNumber,
      invoiceNumber: formData.invoiceNumber,
      supplierName: formData.supplierName,
      supplierContact: formData.supplierContact,
      status: 'received',
      orderDate: formData.orderDate,
      expectedDeliveryDate: formData.expectedDeliveryDate,
      receivedDate: new Date().toISOString().slice(0, 10),
      paymentTerms: formData.paymentTerms,
      subtotalAmount: subtotal,
      taxAmount: formData.taxAmount,
      freightShippingAmount: formData.freightShippingAmount,
      totalAmount,
      paymentStatus: 'unpaid',
      receivedByEmployeeId: 'emp-2',
      receivedByName: 'Marco Chen (Kitchen Lead)',
      notes: formData.notes,
      lines: formData.lines,
    });

    setShowCreateModal(false);
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    if (selectedStatus !== 'All' && po.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        po.poNumber.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.invoiceNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalSpend = purchaseOrders.reduce((acc, p) => acc + p.totalAmount, 0);
  const openCount = purchaseOrders.filter((p) => p.status === 'ordered' || p.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Purchase Orders & Invoice Receiving</h2>
              <p className="text-xs text-slate-500">Replenish stock quantities and automatically accrue Purchases Received into COGS</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create & Receive Purchase Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Purchases Received</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">Included in period COGS calculation</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Open / In-Transit Orders</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{openCount} POs</div>
          <div className="text-[10px] text-slate-400">Pending delivery dock arrival</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Invoices Logged</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{purchaseOrders.length} Invoices</div>
          <div className="text-[10px] text-slate-400">All vendor lines reconciled</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search PO #, Invoice #, Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
          >
            <option value="All">All Statuses</option>
            <option value="received">Received</option>
            <option value="reconciled">Reconciled</option>
            <option value="ordered">Ordered (In-Transit)</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900">{filteredPOs.length}</strong> orders
        </div>
      </div>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {filteredPOs.map((po) => (
          <div key={po.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{po.poNumber}</span>
                  {po.invoiceNumber && (
                    <span className="text-xs text-slate-500 font-mono">({po.invoiceNumber})</span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    po.status === 'received' || po.status === 'reconciled'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {po.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  {po.supplierName} • Ordered {po.orderDate} • Received by {po.receivedByName || 'Dock Manager'}
                </p>
              </div>

              <div className="text-right">
                <div className="text-xl font-black text-slate-900">
                  ${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400">
                  Subtotal: ${po.subtotalAmount.toFixed(2)} + Tax/Freight: ${(po.taxAmount + po.freightShippingAmount).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Line Items Preview */}
            <div className="mt-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Delivered Line Items</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {po.lines.map((line, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                    <div className="font-semibold text-slate-900 truncate">{line.itemName}</div>
                    <div className="flex justify-between text-slate-500 text-[11px] mt-0.5">
                      <span>{line.quantityReceived} {line.unitOfMeasure}</span>
                      <span className="font-bold text-indigo-900">${line.extendedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Record Vendor Purchase & Receive Stock</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">PO Number</label>
                  <input
                    type="text"
                    required
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Vendor Invoice #</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Vendor / Supplier</label>
                  <input
                    type="text"
                    required
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              {/* Dynamic Line Items */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Received Item Lines</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item Line
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="col-span-6">
                        <select
                          value={line.itemId}
                          onChange={(e) => handleLineItemSelect(index, e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-900 truncate"
                        >
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} (${item.unitCost.toFixed(2)}/{item.unitOfMeasure})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={line.quantityOrdered}
                          onChange={(e) => handleLineQtyChange(index, Number(e.target.value))}
                          placeholder="Quantity"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-900 text-center"
                        />
                      </div>

                      <div className="col-span-2 text-right font-bold text-xs text-indigo-900">
                        ${line.extendedTotal.toFixed(2)}
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(index)}
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
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Confirm & Receive into Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
