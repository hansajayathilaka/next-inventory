import { create } from 'zustand';

export interface SalesSessionItem {
  id?: number;
  sessionID: string;
  inventoryBatchID: number;
  quantity: number;
  unitPrice: number;
  discountType?: string; // "percent" or "fixed"
  discountValue: number;
  lineTotal: number;
  productName?: string; // For display
  productCode?: string; // For display
  createdAt?: string;
}

export interface SalesSession {
  id?: number;
  sessionID: string;
  staffID: number;
  staffName?: string; // For display
  customerID?: number;
  customerName?: string; // For display
  billDiscountType?: string; // "percent" or "fixed"
  billDiscountValue: number;
  status: string; // "active", "completed", "abandoned"
  lastActivity: Date;
  items: SalesSessionItem[];
  subtotal?: number; // Calculated
  total?: number; // Calculated
}

interface POSStore {
  // Session state
  sessions: Record<string, SalesSession>;
  currentSessionID: string | null;

  // Create a new session
  createSession: (sessionID: string, staffID: number, staffName: string, customerID?: number, customerName?: string) => void;

  // Switch to a different session
  switchSession: (sessionID: string) => void;

  // Get current session
  getCurrentSession: () => SalesSession | null;

  // List all active sessions
  getActiveSessions: () => SalesSession[];

  // Add item to current session
  addItem: (item: SalesSessionItem) => void;

  // Update item in current session
  updateItem: (itemID: number, updates: Partial<SalesSessionItem>) => void;

  // Remove item from current session
  removeItem: (itemID: number) => void;

  // Clear all items from current session
  clearCart: () => void;

  // Apply discount to specific item
  applyItemDiscount: (itemID: number, discountType: string, discountValue: number) => void;

  // Apply discount to entire bill
  applyBillDiscount: (discountType: string, discountValue: number) => void;

  // Calculate session totals
  calculateTotals: (sessionID?: string) => { subtotal: number; total: number };

  // Complete session
  completeSession: (sessionID?: string) => void;

  // Abandon session
  abandonSession: (sessionID?: string) => void;

  // Delete session
  deleteSession: (sessionID: string) => void;

  // Clear all sessions
  clearAllSessions: () => void;

  // Load session from backend
  loadSession: (session: SalesSession) => void;
}

export const usePOSStore = create<POSStore>((set, get) => ({
  sessions: {},
  currentSessionID: null,

  createSession: (sessionID, staffID, staffName, customerID, customerName) => {
    const newSession: SalesSession = {
      sessionID,
      staffID,
      staffName,
      customerID,
      customerName,
      billDiscountType: undefined,
      billDiscountValue: 0,
      status: 'active',
      lastActivity: new Date(),
      items: [],
      subtotal: 0,
      total: 0,
    };

    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionID]: newSession,
      },
      currentSessionID: sessionID,
    }));
  },

  switchSession: (sessionID) => {
    set({ currentSessionID: sessionID });
  },

  getCurrentSession: () => {
    const { sessions, currentSessionID } = get();
    return currentSessionID ? sessions[currentSessionID] : null;
  },

  getActiveSessions: () => {
    const { sessions } = get();
    return Object.values(sessions).filter((s) => s.status === 'active');
  },

  addItem: (item) => {
    const { currentSessionID, sessions } = get();
    if (!currentSessionID) return;

    const session = sessions[currentSessionID];
    if (!session) return;

    // Generate ID for item if not provided
    const itemID = item.id || Math.max(...session.items.map((i) => i.id || 0), 0) + 1;

    const newItem: SalesSessionItem = {
      ...item,
      id: itemID,
      sessionID: currentSessionID,
    };

    set((state) => ({
      sessions: {
        ...state.sessions,
        [currentSessionID]: {
          ...session,
          items: [...session.items, newItem],
          lastActivity: new Date(),
        },
      },
    }));
  },

  updateItem: (itemID, updates) => {
    const { currentSessionID, sessions } = get();
    if (!currentSessionID) return;

    const session = sessions[currentSessionID];
    if (!session) return;

    const itemIndex = session.items.findIndex((i) => i.id === itemID);
    if (itemIndex === -1) return;

    const updatedItem = { ...session.items[itemIndex], ...updates };
    const newItems = [...session.items];
    newItems[itemIndex] = updatedItem;

    set((state) => ({
      sessions: {
        ...state.sessions,
        [currentSessionID]: {
          ...session,
          items: newItems,
          lastActivity: new Date(),
        },
      },
    }));
  },

  removeItem: (itemID) => {
    const { currentSessionID, sessions } = get();
    if (!currentSessionID) return;

    const session = sessions[currentSessionID];
    if (!session) return;

    set((state) => ({
      sessions: {
        ...state.sessions,
        [currentSessionID]: {
          ...session,
          items: session.items.filter((i) => i.id !== itemID),
          lastActivity: new Date(),
        },
      },
    }));
  },

  clearCart: () => {
    const { currentSessionID, sessions } = get();
    if (!currentSessionID) return;

    const session = sessions[currentSessionID];
    if (!session) return;

    set((state) => ({
      sessions: {
        ...state.sessions,
        [currentSessionID]: {
          ...session,
          items: [],
          billDiscountType: undefined,
          billDiscountValue: 0,
          lastActivity: new Date(),
        },
      },
    }));
  },

  applyItemDiscount: (itemID, discountType, discountValue) => {
    const { currentSessionID, sessions } = get();
    if (!currentSessionID) return;

    const session = sessions[currentSessionID];
    if (!session) return;

    const itemIndex = session.items.findIndex((i) => i.id === itemID);
    if (itemIndex === -1) return;

    const item = session.items[itemIndex];
    let lineTotal = item.quantity * item.unitPrice;

    if (discountType === 'percent') {
      lineTotal -= lineTotal * (discountValue / 100);
    } else if (discountType === 'fixed') {
      lineTotal -= discountValue;
    }

    const updatedItem = {
      ...item,
      discountType,
      discountValue,
      lineTotal: Math.max(0, lineTotal),
    };

    const newItems = [...session.items];
    newItems[itemIndex] = updatedItem;

    set((state) => ({
      sessions: {
        ...state.sessions,
        [currentSessionID]: {
          ...session,
          items: newItems,
          lastActivity: new Date(),
        },
      },
    }));
  },

  applyBillDiscount: (discountType, discountValue) => {
    const { currentSessionID, sessions } = get();
    if (!currentSessionID) return;

    const session = sessions[currentSessionID];
    if (!session) return;

    set((state) => ({
      sessions: {
        ...state.sessions,
        [currentSessionID]: {
          ...session,
          billDiscountType: discountType,
          billDiscountValue: discountValue,
          lastActivity: new Date(),
        },
      },
    }));
  },

  calculateTotals: (sessionID) => {
    const { sessions, currentSessionID } = get();
    const id = sessionID || currentSessionID;
    if (!id) return { subtotal: 0, total: 0 };

    const session = sessions[id];
    if (!session) return { subtotal: 0, total: 0 };

    // Calculate subtotal from all items
    const subtotal = session.items.reduce((sum, item) => sum + item.lineTotal, 0);

    // Apply bill-level discount
    let total = subtotal;
    if (session.billDiscountValue > 0) {
      if (session.billDiscountType === 'percent') {
        total -= total * (session.billDiscountValue / 100);
      } else if (session.billDiscountType === 'fixed') {
        total -= session.billDiscountValue;
      }
    }

    return {
      subtotal: Math.max(0, subtotal),
      total: Math.max(0, total),
    };
  },

  completeSession: (sessionID) => {
    const { currentSessionID, sessions } = get();
    const id = sessionID || currentSessionID;
    if (!id) return;

    const session = sessions[id];
    if (!session) return;

    set((state) => ({
      sessions: {
        ...state.sessions,
        [id]: {
          ...session,
          status: 'completed',
          lastActivity: new Date(),
        },
      },
    }));
  },

  abandonSession: (sessionID) => {
    const { currentSessionID, sessions } = get();
    const id = sessionID || currentSessionID;
    if (!id) return;

    const session = sessions[id];
    if (!session) return;

    set((state) => ({
      sessions: {
        ...state.sessions,
        [id]: {
          ...session,
          status: 'abandoned',
          lastActivity: new Date(),
        },
      },
    }));
  },

  deleteSession: (sessionID) => {
    set((state) => {
      const newSessions = { ...state.sessions };
      delete newSessions[sessionID];

      return {
        sessions: newSessions,
        currentSessionID:
          state.currentSessionID === sessionID ? null : state.currentSessionID,
      };
    });
  },

  clearAllSessions: () => {
    set({
      sessions: {},
      currentSessionID: null,
    });
  },

  loadSession: (session) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [session.sessionID]: session,
      },
      currentSessionID: session.sessionID,
    }));
  },
}));
