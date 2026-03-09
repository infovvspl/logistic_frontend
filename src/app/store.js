import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import driverReducer from '../features/drivers/driverSlice';
import helperReducer from '../features/helpers/helperSlice';
import vehicleReducer from '../features/vehicles/vehicleSlice';
import clientReducer from '../features/clients/clientSlice';
import assignmentReducer from '../features/assignments/assignmentSlice';
import reportsReducer from '../features/reports/reportsSlice';
import inventoryReducer from '../features/inventory/inventorySlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        drivers: driverReducer,
        helpers: helperReducer,
        vehicles: vehicleReducer,
        clients: clientReducer,
        assignments: assignmentReducer,
        reports: reportsReducer,
        inventory: inventoryReducer,
    },
});
