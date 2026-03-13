import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  search: '',
  selectedId: null,
}

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setSearch(state, action) {
      state.search = action.payload ?? ''
    },
    setSelectedId(state, action) {
      state.selectedId = action.payload ?? null
    },
  },
})

export const { setSearch, setSelectedId } = vehicleSlice.actions
export default vehicleSlice.reducer

