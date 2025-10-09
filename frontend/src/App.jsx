import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import "./index.css";
import "@fontsource/montserrat";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./page/user/LandingPage";
import LoginPage from "./page/user/LoginPage";
import SignupPage from "./page/user/SignupPage";
import BusinessPage from "./page/user/BusinessPage";
import UserProfilePage from "./page/user/UserProfilePage";
import AuthCallback from "./auth/AuthCallback";
import PersonalizedPage from "./page/user/PersonalizedPage";
import DiscoverPage from "./page/user/DiscoverPage";
import DiscoverByCategoryPage from "./page/user/DiscoverByCategoryPage";
import AnimatedLayout from "./components/AnimatedLayout";
import MyBusinessPage from "./page/user/MyBusinessPage";
import ProductRegistrationPage from "./page/user/ProductRegistrationPage";
import BusinessMessagesPage from "./page/user/BusinessMessagesPage";
import StudentMessagesPage from "./page/user/StudentMessagesPage";
import BusinessRegistrationPage from "./page/user/BusinessRegistrationPage";
import ManageUserPage from "./page/admin/ManageUserPage";
import ManageBusinessPage from "./page/admin/ManageBusinessPage";
import ManageTransactionPage from "./page/admin/ManageTransactionPage";
import UserPayComplete from "./components/UserPayComplete";
import StackPage from "./page/user/StackPage";
import AdminRoute from "./components/AdminRoute";
import OwnerRoute from "./components/OwnerRoute";
import ClientRoute from "./components/ClientRoute";
import AiChatLayout from "./layout/AiChatLayout.jsx";
import AboutLandingPage from "./page/user/AboutLandingPage.jsx";
import DashboardPage from "./page/user/DashboardPage.jsx";
import AiChatStudentLayout from "./layout/AiChatStudentLayout.jsx";
import KnowledgePage from "./components/ai-support/KnowledgePage.jsx";
import BusinessAiChat from "./components/ai-assistant/BusinessAiChat.jsx";
import AiSupportDocument from "./components/ai-support/AiSupportDocument.jsx";
import MyAi from "./components/ai-common/MyAi.jsx";
import MyCalendar from "./components/calendar/MyCalendar.jsx";
const AppRoutes = () => {
  const location = useLocation();
  const ComingSoonPage = () => <div>🚧 Coming soon...</div>;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* Business Dashboard */}
        <Route
          path="/business-dashboard"
          element={
            <OwnerRoute>
              <AiChatLayout />
            </OwnerRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="messages" element={<BusinessMessagesPage />} />
          <Route path="ai-assistant" element={<BusinessAiChat />} />
          <Route path="bot-knowledge/:botId" element={<KnowledgePage />} />
        </Route>

        {/* Student Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ClientRoute>
              <AiChatStudentLayout />
            </ClientRoute>
          }
        >

          <Route index element={<MyAi />} />
          <Route path="messages" element={<StudentMessagesPage />} />
          <Route path="ai-module" element={<StudentAiChat />} />
          <Route path="bot-knowledge/:botId" element={<KnowledgePage />} />
          <Route path="calendar" element={<MyCalendar />} />
          <Route path="ai-available" element={<AiSupportDocument />} />
          <Route path="my-ai" element={<MyAi />} />
        </Route>

        <Route
          path="/auth-callback"
          element={
            <>
              <SignedIn>
                <AuthCallback />
              </SignedIn>
              <SignedOut>
                <LoginPage />
              </SignedOut>
            </>
          }
        />

        {/* Protected Layout with animation and accessToken check */}
        <Route
          element={
            <ProtectedRoute>
              <AnimatedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<AboutLandingPage />} />
          <Route path="/landingPage" element={<LandingPage />} />
          <Route path="/business/:id" element={<BusinessPage />} />
          <Route path="/personalized" element={<PersonalizedPage />} />
          <Route path="/discover/" element={<DiscoverPage />} />
          <Route
            path="/discover/:category"
            element={<DiscoverByCategoryPage />}
          />
          <Route
            path="/user-profile/*"
            element={
              <>
                <SignedIn>
                  <UserProfilePage />
                </SignedIn>
                <SignedOut>
                  <LoginPage />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/payment-complete"
            element={
              <>
                <SignedIn>
                  <UserPayComplete />
                </SignedIn>
                <SignedOut>
                  <LoginPage />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/stacks"
            element={
              <>
                <SignedIn>
                  <StackPage />
                </SignedIn>
                <SignedOut>
                  <LoginPage />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/business-registration"
            element={
              <ClientRoute>
                <SignedIn>
                  <BusinessRegistrationPage />
                </SignedIn>
                <SignedOut>
                  <LoginPage />
                </SignedOut>
              </ClientRoute>
            }
          />
          <Route
            path="/business-message"
            element={
              <>
                <SignedIn>
                  <MessagesPage />
                </SignedIn>
                <SignedOut>
                  <LoginPage />
                </SignedOut>
              </>
            }
          />

          {/* Owner routes */}
          <Route
            path="/my-business"
            element={
              <OwnerRoute>
                <MyBusinessPage />
              </OwnerRoute>
            }
          />
          <Route
            path="/product-registration"
            element={
              <OwnerRoute>
                <ProductRegistrationPage />
              </OwnerRoute>
            }
          />
          <Route
            path="/business-dashboard"
            element={
              <OwnerRoute>
                <AiChatLayout />
              </OwnerRoute>
            }
          >
            <Route
              path="message"
              element={
                <OwnerRoute>
                  <BusinessMessagesPage />
                </OwnerRoute>
              }
            />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <ManageUserPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/businesses"
            element={
              <AdminRoute>
                <ManageBusinessPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <ManageTransactionPage />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
