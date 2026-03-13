import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  search: '',
  selectedId: null,
}

const clientSlice = createSlice({
  name: 'clients',
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

export const { setSearch, setSelectedId } = clientSlice.actions
export default clientSlice.reducer

