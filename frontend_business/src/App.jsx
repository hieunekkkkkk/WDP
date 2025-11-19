import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './index.css';
import '@fontsource/montserrat';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import ProtectedRoute from './components/ProtectedRoute';
import useGeolocation from './utils/useGeolocation';

import LandingPage from './page/user/LandingPage';
import LoginPage from './page/user/LoginPage';
import SignupPage from './page/user/SignupPage';
import BusinessPage from './page/user/BusinessPage';
import UserProfilePage from './page/user/UserProfilePage';
import AuthCallback from './auth/AuthCallback';
import PersonalizedPage from './page/user/PersonalizedPage';
import DiscoverPage from './page/user/DiscoverPage';
import DiscoverByCategoryPage from './page/user/DiscoverByCategoryPage';
import AnimatedLayout from './components/AnimatedLayout';
import MyBusinessPage from './page/user/MyBusinessPage';
import ProductRegistrationPage from './page/user/ProductRegistrationPage';
import BusinessMessagesPage from './page/user/BusinessMessagesPage';
import BusinessRegistrationPage from './page/user/BusinessRegistrationPage';
import UserPayComplete from './components/UserPayComplete';
import StackPage from './page/user/StackPage';
import OwnerRoute from './components/OwnerRoute';
import NoBusinessRoute from './components/NoBusinessRoute';
import AiChatLayout from './layout/AiChatLayout.jsx';
import AboutLandingPage from './page/user/AboutLandingPage.jsx';
import DashboardPage from './page/user/DashboardPage.jsx';
import KnowledgePage from './components/ai-support/KnowledgePage.jsx';
import MyAi from './components/ai-common/MyAi.jsx';
import BusinessAiChat from './components/ai-assistant/BusinessAiChat.jsx';
import StockPage from './page/user/StockPage.jsx';

const AppRoutes = () => {
  const location = useLocation();

  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      if (user.publicMetadata?.locked === true) {
        if (location.pathname !== "/auth-callback") {
          navigate("/auth-callback");
        }
      }
    }
  }, [isLoaded, user, location.pathname, navigate]);

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
          <Route path="my-ai" element={<MyAi />} />
          <Route path="bot-knowledge/:botId" element={<KnowledgePage />} />
          <Route path="stock" element={<StockPage />} />
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
              <NoBusinessRoute>
                <SignedIn>
                  <BusinessRegistrationPage />
                </SignedIn>
                <SignedOut>
                  <LoginPage />
                </SignedOut>
              </NoBusinessRoute>
            }
          />
          <Route
            path="/business-message"
            element={
              <>
                <SignedIn>
                  <BusinessMessagesPage />
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
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  // Gọi hook geolocation trực tiếp trong App component
  const { location, error, fetchLocation } = useGeolocation(false);

  useEffect(() => {
    // Tự động fetch location khi app mount
    fetchLocation();
  }, []);

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
