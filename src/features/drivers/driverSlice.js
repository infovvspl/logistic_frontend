import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  search: '',
  selectedId: null,
}

const driverSlice = createSlice({
  name: 'drivers',
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

export const { setSearch, setSelectedId } = driverSlice.actions
export default driverSlice.reducer

