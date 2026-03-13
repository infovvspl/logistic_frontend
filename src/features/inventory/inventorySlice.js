import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    categories: [],
    suppliers: [],
    products: [],
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
        setSuppliers: (state, action) => {
            state.suppliers = action.payload;
        },
        addSupplier: (state, action) => {
            state.suppliers.push(action.payload);
        },
        updateSupplier: (state, action) => {
            const index = state.suppliers.findIndex(s => s.supplier_id === action.payload.supplier_id);
            if (index !== -1) state.suppliers[index] = action.payload;
        },
        deleteSupplier: (state, action) => {
            state.suppliers = state.suppliers.filter(s => s.supplier_id !== action.payload);
        },
        setProducts: (state, action) => {
            state.products = action.payload;
        },
        addProduct: (state, action) => {
            state.products.push(action.payload);
        },
        updateProduct: (state, action) => {
            const index = state.products.findIndex(i => i.product_id === action.payload.product_id);
            if (index !== -1) state.products[index] = action.payload;
        },
        deleteProduct: (state, action) => {
            state.products = state.products.filter(i => i.product_id !== action.payload);
        },
        setTransactions: (state, action) => {
            state.transactions = action.payload;
        },
        addTransaction: (state, action) => {
            const transaction = { ...action.payload, transaction_id: state.transactions.length + 1, transaction_date: new Date().toISOString() };
            state.transactions.push(transaction);

            // Update stock quantity
            const productIndex = state.products.findIndex(i => i.product_id === transaction.product_id);
            if (productIndex !== -1) {
                if (transaction.transaction_type === 'IN') {
                    state.products[productIndex].quantity_in_stock += Number(transaction.quantity);
                } else {
                    state.products[productIndex].quantity_in_stock -= Number(transaction.quantity);
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
    setSuppliers, addSupplier, updateSupplier, deleteSupplier,
    setProducts, addProduct, updateProduct, deleteProduct,
    setTransactions, addTransaction, addPurchase
} = inventorySlice.actions;

export default inventorySlice.reducer;
