import { useEffect } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { fetchMe } from "@/store/authSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useAuthCheck() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, initialized, loading } = useAppSelector(
    (s) => s.auth,
  );

  useEffect(() => {
    if (!initialized && !loading && !isAuthenticated) {
      dispatch(fetchMe());
    }
  }, [initialized, loading, isAuthenticated, dispatch]);

  return { isAuthenticated, initialized, loading };
}
