import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/shared/stores/appStore";
import type { Role } from "@/shared/types";
import { roleHomePath } from "@/shared/utils/format";

interface Props {
  children: ReactNode;
  allow: Role[];
}

export function ProtectedRoute({ children, allow }: Props) {
  const currentUser = useAppStore((s) => s.currentUser);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allow.includes(currentUser.role)) {
    return <Navigate to={roleHomePath(currentUser.role)} replace />;
  }

  return <>{children}</>;
}
