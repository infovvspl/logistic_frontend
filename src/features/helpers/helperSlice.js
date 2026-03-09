import { createSlice } from '@reduxjs/toolkit';

const helperSlice = createSlice({
    name: 'helpers',
    initialState: {
        list: [],
        loading: false,
        error: null
    },
    reducers: {
        setHelpers: (state, action) => {
            state.list = action.payload;
        },
        addHelper: (state, action) => {
            state.list.unshift(action.payload);
        },
        updateHelper: (state, action) => {
            const index = state.list.findIndex(h => h._id === action.payload._id);
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload };
            }
        },
        deleteHelper: (state, action) => {
            state.list = state.list.filter(h => h._id !== action.payload);
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const { setHelpers, addHelper, updateHelper, deleteHelper, setLoading, setError } = helperSlice.actions;
export default helperSlice.reducer;
