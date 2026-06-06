import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,        // logged in user data
  isLoading: false,  // for showing spinners
  error: null        // for showing error messages
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called when login/register starts
    authStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    // Called when login/register succeeds
    authSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    },
    // Called when login/register fails
    authFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    // Called on logout
    logout: (state) => {
      state.user = null;
      state.error = null;
    },
    updateUserRole: (state, action) => {
      if (state.user) {
        state.user.role = action.payload;
      }
    }
  }
});

export const { authStart, authSuccess, authFail, logout, updateUserRole } = authSlice.actions;

export default authSlice.reducer;