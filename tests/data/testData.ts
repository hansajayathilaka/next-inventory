/**
 * Centralized Test Data
 * Contains all test users, customers, products, and other test data
 */

export const testUsers = {
  admin: {
    username: 'admin',
    email: 'admin@hardware-store.local',
    password: 'Admin@123456',
    firstName: 'System',
    lastName: 'Administrator',
  },
  manager: {
    username: 'manager1',
    email: 'john.manager@hardware-store.local',
    password: 'Manager@123456',
    firstName: 'John',
    lastName: 'Manager',
  },
  cashier: {
    username: 'cashier1',
    email: 'sarah.jones@hardware-store.local',
    password: 'Cashier@123456',
    firstName: 'Sarah',
    lastName: 'Jones',
  },
  cashier2: {
    username: 'cashier2',
    email: 'mike.smith@hardware-store.local',
    password: 'Cashier@123456',
    firstName: 'Mike',
    lastName: 'Smith',
  },
  stockManager: {
    username: 'stockmgr1',
    email: 'david.brown@hardware-store.local',
    password: 'Stock@123456',
    firstName: 'David',
    lastName: 'Brown',
  },
  associate: {
    username: 'associate1',
    email: 'emily.davis@hardware-store.local',
    password: 'Sales@123456',
    firstName: 'Emily',
    lastName: 'Davis',
  },
};

export const testCustomers = {
  customer1: {
    id: 1,
    name: 'Local Bike Shop',
    email: 'owner@localbikeshow.com',
    phone: '+1-555-0101',
    creditLimit: 5000.00,
  },
  customer2: {
    id: 2,
    name: 'Mountain Biking Club',
    email: 'purchases@mtbclub.org',
    phone: '+1-555-0102',
    creditLimit: 3000.00,
  },
  customer3: {
    id: 3,
    name: 'City Cycle Rentals',
    email: 'fleet@citycyclerentals.com',
    phone: '+1-555-0103',
    creditLimit: 8000.00,
  },
  customer4: {
    id: 4,
    name: 'Community Repair Collective',
    email: 'repairs@communitybikeshop.org',
    phone: '+1-555-0104',
    creditLimit: 2000.00,
  },
  customer5: {
    id: 5,
    name: 'Family Cycles Store',
    email: 'info@familycycles.com',
    phone: '+1-555-0105',
    creditLimit: 4500.00,
  },
};

export const testProducts = {
  product1: {
    code: 'WHEEL-26-ROAD',
    name: '26 inch road bike wheel',
    description: '26 inch road bike wheel',
    category: 'Wheels',
    price: 45.99,
  },
  product2: {
    code: 'WHEEL-27-HYBRID',
    name: '27.5 inch hybrid wheel',
    description: '27.5 inch hybrid wheel',
    category: 'Wheels',
    price: 52.50,
  },
  product3: {
    code: 'TIRE-700C-ROAD',
    name: '700c road bike tire - 25mm',
    description: '700c road bike tire - 25mm',
    category: 'Tires',
    price: 35.99,
  },
  product4: {
    code: 'CHAIN-11SP',
    name: '11-speed bike chain',
    description: '11-speed bike chain',
    category: 'Drivetrain',
    price: 28.50,
  },
  product5: {
    code: 'GEAR-CRANKSET-50-34',
    name: 'Compact crankset 50/34 teeth',
    description: 'Compact crankset 50/34 teeth',
    category: 'Drivetrain',
    price: 89.99,
  },
  product6: {
    code: 'BRAKE-DISC-MECH',
    name: 'Mechanical disc brake - 160mm rotor',
    description: 'Mechanical disc brake - 160mm rotor',
    category: 'Braking',
    price: 65.00,
  },
  product7: {
    code: 'LIGHT-FRONT-LED',
    name: 'LED front light - 500 lumens',
    description: 'LED front light - 500 lumens',
    category: 'Lights & Reflectors',
    price: 42.50,
  },
};

export const testPayments = {
  cashPayment: {
    method: 'cash',
    amount: 100.00,
  },
  cardPayment: {
    method: 'card',
    cardNumber: '4532123456789010',
  },
  creditPayment: {
    method: 'credit',
    customerId: 1,
  },
};

export const testSettlements = {
  fullSettlement: {
    amount: 500.00,
    method: 'cash',
    reference: 'SETTLE-001',
  },
  partialSettlement: {
    amount: 250.00,
    method: 'card',
    reference: 'SETTLE-002',
  },
};

export const testDiscounts = {
  fixedDiscount: {
    type: 'fixed',
    amount: 10.00,
  },
  percentageDiscount: {
    type: 'percentage',
    amount: 10,
  },
};
