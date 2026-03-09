import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    categories: [],
    suppliers: [
        {
            supplier_id: 1,
            supplier_name: 'TechCorp',
            contact_person: 'John Smith',
            phone: '+919876543210',
            email: 'sales@techcorp.com',
            address: 'Industrial Area, Phase 1'
        }
    ],
    items: [
        {
            item_id: 1,
            item_name: 'Laptop L50',
            item_image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2071&auto=format&fit=crop',
            category_id: 1,
            unit_price: 45000.00,
            quantity_in_stock: 15,
            supplier_id: 1
        }
    ],
    transactions: [],
    purchases: [],
    loading: false,
    error: null
};

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        setCategories: (state, action) => {
            state.categories = action.payload;
        },
        addCategory: (state, action) => {
            state.categories.push(action.payload);
        },
        updateCategory: (state, action) => {
            const index = state.categories.findIndex(c => c.category_id === action.payload.category_id);
            if (index !== -1) state.categories[index] = action.payload;
        },
        deleteCategory: (state, action) => {
            state.categories = state.categories.filter(c => c.category_id !== action.payload);
        },
        addSupplier: (state, action) => {
            state.suppliers.push({ ...action.payload, supplier_id: state.suppliers.length + 1 });
        },
        updateSupplier: (state, action) => {
            const index = state.suppliers.findIndex(s => s.supplier_id === action.payload.supplier_id);
            if (index !== -1) state.suppliers[index] = action.payload;
        },
        deleteSupplier: (state, action) => {
            state.suppliers = state.suppliers.filter(s => s.supplier_id !== action.payload);
        },
        addItem: (state, action) => {
            state.items.push({ ...action.payload, item_id: state.items.length + 1 });
        },
        updateItem: (state, action) => {
            const index = state.items.findIndex(i => i.item_id === action.payload.item_id);
            if (index !== -1) state.items[index] = action.payload;
        },
        deleteItem: (state, action) => {
            state.items = state.items.filter(i => i.item_id !== action.payload);
        },
        addTransaction: (state, action) => {
            const transaction = { ...action.payload, transaction_id: state.transactions.length + 1, transaction_date: new Date().toISOString() };
            state.transactions.push(transaction);

            // Update stock quantity
            const itemIndex = state.items.findIndex(i => i.item_id === transaction.item_id);
            if (itemIndex !== -1) {
                if (transaction.transaction_type === 'IN') {
                    state.items[itemIndex].quantity_in_stock += Number(transaction.quantity);
                } else {
                    state.items[itemIndex].quantity_in_stock -= Number(transaction.quantity);
                }
            }
        },
        addPurchase: (state, action) => {
            state.purchases.push({ ...action.payload, purchase_id: state.purchases.length + 1, purchase_date: new Date().toISOString() });
        }
    }
});

export const {
    setCategories, addCategory, updateCategory, deleteCategory,
    addSupplier, updateSupplier, deleteSupplier,
    addItem, updateItem, deleteItem,
    addTransaction, addPurchase
} = inventorySlice.actions;

export default inventorySlice.reducer;
