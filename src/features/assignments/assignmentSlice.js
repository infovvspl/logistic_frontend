import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  selectedId: null,
}

const assignmentSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    setSelectedId(state, action) {
      state.selectedId = action.payload ?? null
    },
  },
})

export const { setSelectedId } = assignmentSlice.actions
export default assignmentSlice.reducer

