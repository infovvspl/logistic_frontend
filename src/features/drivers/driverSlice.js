import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    list: [],
    loading: false,
    error: null,
};

const driverSlice = createSlice({
    name: 'drivers',
    initialState,
    reducers: {
        setDrivers: (state, action) => {
            state.list = action.payload;
        },
        addDriver: (state, action) => {
            state.list.unshift(action.payload);
        },
        updateDriver: (state, action) => {
            const index = state.list.findIndex(d => d._id === action.payload._id);
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload };
            }
        },
        deleteDriver: (state, action) => {
            state.list = state.list.filter(d => d._id !== action.payload);
        },
    },
});

export const { setDrivers, addDriver, updateDriver, deleteDriver } = driverSlice.actions;
export default driverSlice.reducer;
