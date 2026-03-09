import { createSlice } from '@reduxjs/toolkit';

const clientSlice = createSlice({
    name: 'clients',
    initialState: { list: [], loading: false, error: null },
    reducers: {
        setClients: (state, action) => {
            state.list = action.payload;
        },
        addClient: (state, action) => {
            state.list.unshift(action.payload);
        },
        updateClient: (state, action) => {
            const index = state.list.findIndex(c => c._id === action.payload._id);
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload };
            }
        },
        deleteClient: (state, action) => {
            state.list = state.list.filter(c => c._id !== action.payload);
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        }
    },
});

export const { setClients, addClient, updateClient, deleteClient, setLoading, setError } = clientSlice.actions;
export default clientSlice.reducer;
