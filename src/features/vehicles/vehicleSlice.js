import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    list: [],
    loading: false,
    error: null
};

const vehicleSlice = createSlice({
    name: 'vehicles',
    initialState,
    reducers: {
        setVehicles: (state, action) => {
            state.list = action.payload;
            state.loading = false;
            state.error = null;
        },
        addVehicle: (state, action) => {
            state.list.unshift(action.payload);
        },
        updateVehicle: (state, action) => {
            const index = state.list.findIndex(v => v._id === action.payload._id || v.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
        },
        deleteVehicle: (state, action) => {
            state.list = state.list.filter(v => v._id !== action.payload && v.id !== action.payload);
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        }
    }
});

export const { setVehicles, addVehicle, updateVehicle, deleteVehicle, setLoading, setError } = vehicleSlice.actions;
export default vehicleSlice.reducer;
