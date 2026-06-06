import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    // We'll add more reducers here later (gigs, chat, etc)
  }
});

export default store;