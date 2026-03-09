import { createSlice } from '@reduxjs/toolkit';

const assignmentSlice = createSlice({
    name: 'assignments',
    initialState: {
        list: [],           // All assignments (system-wide)
        requests: [],       // Admin: Assignments by request
        myAssignments: [],  // Drivers/Helpers: Personal assignments
        availableDrivers: [], // Admin: Drivers available for assignment
        loading: false,
        error: null,
    },
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        setAssignments: (state, action) => {
            state.list = action.payload;
            state.loading = false;
        },
        setRequests: (state, action) => {
            state.requests = action.payload;
            state.loading = false;
        },
        setMyAssignments: (state, action) => {
            state.myAssignments = action.payload;
            state.loading = false;
        },
        setAvailableDrivers: (state, action) => {
            state.availableDrivers = action.payload;
            state.loading = false;
        },
        updateAssignmentStatus: (state, action) => {
            const { id, status } = action.payload;
            // Update in myAssignments
            const myIdx = state.myAssignments.findIndex(a => (a._id || a.id) === id);
            if (myIdx !== -1) {
                state.myAssignments[myIdx].status = status;
            }
            // Update in general list
            const listIdx = state.list.findIndex(a => (a._id || a.id) === id);
            if (listIdx !== -1) {
                state.list[listIdx].status = status;
            }
        }
    },
});

export const {
    setAssignments,
    setRequests,
    setMyAssignments,
    setAvailableDrivers,
    setLoading,
    setError,
    updateAssignmentStatus
} = assignmentSlice.actions;

export default assignmentSlice.reducer;
