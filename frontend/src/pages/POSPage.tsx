import { SessionManager } from '@/components/pos/SessionManager';
import { Cart } from '@/components/pos/Cart';
import { ProductSelector } from '@/components/pos/ProductSelector';
import { usePOSStore } from '@/stores/posStore';

export function POSPage() {
  const { getCurrentSession, calculateTotals, completeSession } = usePOSStore();

  const session = getCurrentSession();
  const { total } = calculateTotals();

  const handleCheckout = () => {
    if (!session) return;

    if (session.items.length === 0) {
      alert('Cart is empty');
      return;
    }

    // TODO: Implement actual payment processing
    alert(
      `Checkout initiated. Total: ₱${total.toFixed(2)}\n\nThis will redirect to payment processing.`
    );

    // Mark session as completed after checkout
    completeSession();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <p className="text-gray-500 mt-2">Multi-session POS system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Selector and Session Manager */}
        <div className="lg:col-span-2 space-y-6">
          <SessionManager />
          <ProductSelector />
        </div>

        {/* Right Column - Cart */}
        <div className="space-y-4">
          <Cart />

          {/* Checkout Section */}
          {session && session.items.length > 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow">
              <div className="mb-6">
                <p className="text-sm opacity-90">Total Amount Due</p>
                <p className="text-4xl font-bold">₱{total.toFixed(2)}</p>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full px-6 py-3 bg-white text-blue-600 rounded font-bold hover:bg-gray-100 transition mb-2"
              >
                Proceed to Checkout
              </button>

              <button className="w-full px-6 py-3 bg-blue-800 text-white rounded font-bold hover:bg-blue-900 transition">
                Hold Sale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Session Info */}
      {session && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Session Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Session ID</p>
              <p className="font-mono text-xs">{session.sessionID.slice(-12)}</p>
            </div>
            <div>
              <p className="text-gray-600">Staff</p>
              <p className="font-medium">{session.staffName}</p>
            </div>
            <div>
              <p className="text-gray-600">Customer</p>
              <p className="font-medium">{session.customerName || 'Walk-in'}</p>
            </div>
            <div>
              <p className="text-gray-600">Items</p>
              <p className="font-medium">{session.items.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-sm">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <button className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
            New Session (N)
          </button>
          <button className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Clear Cart (C)
          </button>
          <button className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Apply Discount (D)
          </button>
          <button className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Checkout (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}
