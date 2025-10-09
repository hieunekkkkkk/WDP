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
import StudentMessagesPage from "./page/user/StudentMessagesPage";
import UserPayComplete from "./components/UserPayComplete";
import StackPage from "./page/user/StackPage";
import ClientRoute from "./components/ClientRoute";
import AboutLandingPage from "./page/user/AboutLandingPage.jsx";
import AiChatStudentLayout from "./layout/AiChatStudentLayout.jsx";
import KnowledgePage from "./components/ai-support/KnowledgePage.jsx";
import AiSupportDocument from "./components/ai-support/AiSupportDocument.jsx";
import MyAi from "./components/ai-common/MyAi.jsx";
import MyCalendar from "./components/calendar/MyCalendar.jsx";

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

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