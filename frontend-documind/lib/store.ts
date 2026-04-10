import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/lib/features/authSlice";
import fileReducer from "@/lib/features/fileSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: fileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
