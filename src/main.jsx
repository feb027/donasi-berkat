import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ChatProvider } from './contexts/ChatContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext'

// Import pages and layout components directly
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BrowseDonationsPage from './pages/BrowseDonationsPage';
import CreateDonationPage from './pages/CreateDonationPage';
import DonationDetailPage from './pages/DonationDetailPage';
import DashboardPage from './pages/DashboardPage';
import EditDonationPage from './pages/EditDonationPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageDonationsPage from './pages/admin/ManageDonationsPage';
import AdminUserDetailsPage from './pages/admin/AdminUserDetailsPage';
import ManageBadgesPage from './pages/admin/ManageBadgesPage';
import NotificationsPage from './pages/NotificationsPage';
import FAQPage from './pages/FAQPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import TechnicalOverviewPage from './pages/TechnicalOverviewPage';

// --- Wishlist Pages ---
import BrowseWishlistPage from './pages/BrowseWishlistPage';
import CreateWishlistPage from './pages/CreateWishlistPage';
import WishlistDetailPage from './pages/WishlistDetailPage';
import EditWishlistPage from './pages/EditWishlistPage';

// Import Toaster
import { Toaster } from 'react-hot-toast';

// Define the router configuration
const router = createBrowserRouter([
  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "signup",
    element: <SignupPage />,
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
          {
            path: "users",
            element: <ManageUsersPage />,
          },
          {
            path: "users/:userId",
            element: <AdminUserDetailsPage />,
          },
          {
            path: "donations",
            element: <ManageDonationsPage />,
          },
          {
            path: "badges",
            element: <ManageBadgesPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "browse",
        element: <BrowseDonationsPage />,
      },
      {
        path: "donations/:id",
        element: <DonationDetailPage />,
      },
      {
        path: "wishlist/browse",
        element: <BrowseWishlistPage />,
      },
      {
        path: "wishlist/:id",
        element: <WishlistDetailPage />,
      },
      {
        path: "profile/:userId",
        element: <ProfilePage />,
      },
      {
        path: "faq",
        element: <FAQPage />,
      },
      {
        path: "kebijakan-privasi",
        element: <PrivacyPolicyPage />,
      },
      {
        path: "syarat-ketentuan",
        element: <TermsAndConditionsPage />,
      },
      {
        path: "technical-overview",
        element: <TechnicalOverviewPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "donate",
            element: <CreateDonationPage />,
          },
          {
            path: "wishlist/create",
            element: <CreateWishlistPage />,
          },
          {
            path: "wishlist/:id/edit",
            element: <EditWishlistPage />,
          },
          {
            path: "donations/:donationId/edit",
            element: <EditDonationPage />,
          },
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "edit-profile",
            element: <EditProfilePage />,
          },
          {
            path: "notifications",
            element: <NotificationsPage />,
          },
        ],
      },
    ],
  },

]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ChatProvider>
        <NotificationProvider>
          <RouterProvider router={router} future={{ v7_scrollRestoration: true }} />
          <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
        </NotificationProvider>
      </ChatProvider>
    </AuthProvider>
  </React.StrictMode>,
)
