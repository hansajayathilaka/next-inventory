import { useState } from 'react';
import { usePOSStore } from '@/stores/posStore';

export function Cart() {
  const {
    getCurrentSession,
    removeItem,
    updateItem,
    applyItemDiscount,
    applyBillDiscount,
    calculateTotals,
    clearCart,
  } = usePOSStore();

  const session = getCurrentSession();
  const [editingItemID, setEditingItemID] = useState<number | null>(null);
  const [billDiscountType, setBillDiscountType] = useState<string>('');
  const [billDiscountValue, setBillDiscountValue] = useState<number>(0);

  if (!session) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">No active session selected</p>
      </div>
    );
  }

  const { subtotal, total } = calculateTotals();

  const handleQuantityChange = (itemID: number, newQuantity: number) => {
    if (newQuantity <= 0) return;

    const item = session.items.find((i) => i.id === itemID);
    if (!item) return;

    const newLineTotal = newQuantity * item.unitPrice;
    updateItem(itemID, {
      quantity: newQuantity,
      lineTotal: newLineTotal,
    });
  };

  const handleApplyBillDiscount = () => {
    if (billDiscountType && billDiscountValue > 0) {
      applyBillDiscount(billDiscountType, billDiscountValue);
      setBillDiscountType('');
      setBillDiscountValue(0);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Cart</h2>

      {/* Items List */}
      {session.items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Cart is empty</p>
      ) : (
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left px-4 py-2">Product</th>
                  <th className="text-right px-4 py-2">Qty</th>
                  <th className="text-right px-4 py-2">Unit Price</th>
                  <th className="text-right px-4 py-2">Discount</th>
                  <th className="text-right px-4 py-2">Total</th>
                  <th className="text-center px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {session.items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div>
                        <p className="font-medium">{item.productName || 'Product'}</p>
                        <p className="text-xs text-gray-500">{item.productCode || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="text-right px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id!, parseInt(e.target.value))}
                        className="w-16 px-2 py-1 border rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="text-right px-4 py-2">
                      ₱{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-2">
                      <button
                        onClick={() => setEditingItemID(item.id!)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        {item.discountValue > 0 ? `${item.discountValue}${item.discountType === 'percent' ? '%' : ''}` : 'Add'}
                      </button>
                    </td>
                    <td className="text-right px-4 py-2 font-medium">
                      ₱{item.lineTotal.toFixed(2)}
                    </td>
                    <td className="text-center px-4 py-2">
                      <button
                        onClick={() => removeItem(item.id!)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discount Editor Modal */}
      {editingItemID !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Apply Item Discount</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Discount Type</label>
              <select
                value={`${session.items.find((i) => i.id === editingItemID)?.discountType || 'percent'}`}
                onChange={(e) => {
                  const item = session.items.find((i) => i.id === editingItemID);
                  if (item) {
                    applyItemDiscount(editingItemID, e.target.value, item.discountValue);
                  }
                }}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Discount Value</label>
              <input
                type="number"
                min="0"
                value={session.items.find((i) => i.id === editingItemID)?.discountValue || 0}
                onChange={(e) => {
                  const item = session.items.find((i) => i.id === editingItemID);
                  if (item) {
                    applyItemDiscount(editingItemID, item.discountType || 'percent', parseFloat(e.target.value));
                  }
                }}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter discount value"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingItemID(null)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Done
              </button>
              <button
                onClick={() => {
                  applyItemDiscount(editingItemID, 'fixed', 0);
                  setEditingItemID(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Subtotal:</span>
          <span className="font-medium">₱{subtotal.toFixed(2)}</span>
        </div>

        {session.billDiscountValue > 0 && (
          <div className="flex justify-between mb-2 text-green-600">
            <span>Bill Discount:</span>
            <span>-₱{(
              session.billDiscountType === 'percent'
                ? subtotal * (session.billDiscountValue / 100)
                : session.billDiscountValue
            ).toFixed(2)}</span>
          </div>
        )}

        <div className="border-t pt-2 flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span className="text-blue-600">₱{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Bill Discount Section */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-3">Apply Bill Discount</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <select
            value={billDiscountType}
            onChange={(e) => setBillDiscountType(e.target.value)}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select type</option>
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Amount</option>
          </select>
          <input
            type="number"
            min="0"
            value={billDiscountValue}
            onChange={(e) => setBillDiscountValue(parseFloat(e.target.value))}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Discount value"
          />
        </div>
        <button
          onClick={handleApplyBillDiscount}
          className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium text-sm"
        >
          Apply Bill Discount
        </button>
      </div>

      {/* Cart Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => clearCart()}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-medium"
        >
          Clear Cart
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={session.items.length === 0}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}
