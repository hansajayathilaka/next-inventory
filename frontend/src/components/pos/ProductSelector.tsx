import { useState } from 'react';
import { usePOSStore } from '@/stores/posStore';

interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  category_id: number;
  custom_attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface InventoryBatch {
  id: number;
  product_id: number;
  product?: Product;
  supplier_id: number;
  quantity_received: number;
  quantity_available: number;
  cost_price: number;
  retail_price: number;
  received_date: string;
}

export function ProductSelector() {
  const { addItem, getCurrentSession } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<InventoryBatch | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mockProducts] = useState<InventoryBatch[]>([
    {
      id: 1,
      product_id: 1,
      supplier_id: 1,
      quantity_received: 50,
      quantity_available: 45,
      cost_price: 100,
      retail_price: 250,
      received_date: '2025-10-01',
      product: {
        id: 1,
        code: 'BIKE-WHEEL-26',
        name: '26" Bicycle Wheel',
        description: 'Standard 26-inch bicycle wheel with rim and spokes',
        category_id: 1,
        created_at: '2025-10-01',
        updated_at: '2025-10-01',
      },
    },
    {
      id: 2,
      product_id: 2,
      supplier_id: 1,
      quantity_received: 30,
      quantity_available: 28,
      cost_price: 50,
      retail_price: 120,
      received_date: '2025-10-02',
      product: {
        id: 2,
        code: 'CHAIN-8SP',
        name: '8-Speed Bicycle Chain',
        description: 'Compatible with 8-speed drivetrains',
        category_id: 2,
        created_at: '2025-10-01',
        updated_at: '2025-10-01',
      },
    },
    {
      id: 3,
      product_id: 3,
      supplier_id: 2,
      quantity_received: 100,
      quantity_available: 95,
      cost_price: 20,
      retail_price: 50,
      received_date: '2025-10-03',
      product: {
        id: 3,
        code: 'BRAKE-PAD-SET',
        name: 'Bicycle Brake Pad Set',
        description: 'Universal brake pad set for rim brakes',
        category_id: 3,
        created_at: '2025-10-01',
        updated_at: '2025-10-01',
      },
    },
  ]);

  const session = getCurrentSession();

  const filteredProducts = mockProducts.filter(
    (batch) =>
      batch.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.product?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = () => {
    if (!selectedProduct || !session || quantity <= 0) return;

    if (quantity > selectedProduct.quantity_available) {
      alert(`Only ${selectedProduct.quantity_available} items available`);
      return;
    }

    addItem({
      sessionID: session.sessionID,
      inventoryBatchID: selectedProduct.id,
      quantity,
      unitPrice: selectedProduct.retail_price,
      discountType: undefined,
      discountValue: 0,
      lineTotal: quantity * selectedProduct.retail_price,
      productName: selectedProduct.product?.name,
      productCode: selectedProduct.product?.code,
    });

    // Reset selection
    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Product Selector</h2>

      {!session ? (
        <p className="text-gray-500 text-center py-4">No active session selected</p>
      ) : (
        <>
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by product name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 max-h-96 overflow-y-auto border rounded p-2">
            {filteredProducts.length === 0 ? (
              <p className="text-gray-500 col-span-2 text-center py-4">No products found</p>
            ) : (
              filteredProducts.map((batch) => (
                <div
                  key={batch.id}
                  onClick={() => setSelectedProduct(batch)}
                  className={`p-3 border rounded cursor-pointer transition ${
                    selectedProduct?.id === batch.id
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  } ${batch.quantity_available <= 0 ? 'opacity-50' : ''}`}
                >
                  <p className="font-semibold text-sm">{batch.product?.name}</p>
                  <p className="text-xs text-gray-600">{batch.product?.code}</p>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-medium">₱{batch.retail_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Available</p>
                      <p className={`font-medium ${batch.quantity_available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {batch.quantity_available}
                      </p>
                    </div>
                  </div>

                  {batch.quantity_available <= 0 && (
                    <p className="text-xs text-red-600 mt-2">Out of stock</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Selected Product Details and Quantity */}
          {selectedProduct && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
              <h3 className="font-semibold mb-3">Add to Cart</h3>

              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700">
                  {selectedProduct.product?.name}
                </p>
                <p className="text-sm text-gray-600">{selectedProduct.product?.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <p className="text-lg font-semibold">₱{selectedProduct.retail_price.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Available</label>
                  <p className="text-lg font-semibold text-green-600">
                    {selectedProduct.quantity_available}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.quantity_available}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="text-right mb-4 pb-4 border-b">
                <p className="text-sm text-gray-600">Line Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₱{(selectedProduct.retail_price * quantity).toFixed(2)}
                </p>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={quantity <= 0 || quantity > selectedProduct.quantity_available}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                + Add to Cart
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
