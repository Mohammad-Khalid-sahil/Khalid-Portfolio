import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const ProtectedRoute = lazy(() => import("@/components/admin/ProtectedRoute"));
const AdminOnlyRoute = lazy(() => import("@/components/admin/AdminOnlyRoute"));
const AdminLayout = lazy(() => import("@/layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminAnalytics = lazy(() => import("@/pages/admin/AdminAnalytics"));
const AdminAI = lazy(() => import("@/pages/admin/AdminAI"));
const ResourceManager = lazy(() => import("@/pages/admin/ResourceManager"));
const AdminBlog = lazy(() => import("@/pages/admin/AdminBlog"));
const AdminMessages = lazy(() => import("@/pages/admin/AdminMessages"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminMedia = lazy(() => import("@/pages/admin/AdminMedia"));

const pageFallback = (
  <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-text-muted)]">
    Loading admin...
  </div>
);

export default function AdminRoutes() {
  return (
    <Suspense fallback={pageFallback}>
      <Routes>
        <Route path="login" element={<AdminLogin />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route element={<AdminOnlyRoute />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="ai" element={<AdminAI />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="resource/:resource" element={<ResourceManager />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="media" element={<AdminMedia />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
