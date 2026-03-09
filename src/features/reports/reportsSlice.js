import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    dailyReport: null,
    loading: false,
    error: null,
};

const reportsSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {
        setDailyReport: (state, action) => {
            state.dailyReport = action.payload;
            state.loading = false;
            state.error = null;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { setDailyReport, setLoading, setError } = reportsSlice.actions;
export default reportsSlice.reducer;
