import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice.js'
import driverReducer from '../features/drivers/driverSlice.js'
import vehicleReducer from '../features/vehicles/vehicleSlice.js'
import clientReducer from '../features/clients/clientSlice.js'
import assignmentReducer from '../features/assignments/assignmentSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    drivers: driverReducer,
    vehicles: vehicleReducer,
    clients: clientReducer,
    assignments: assignmentReducer,
  },
})

export const selectAuth = (state) => state.auth

