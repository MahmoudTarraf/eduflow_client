import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import Celebration from './components/common/Celebration';
import GamificationNotifier from './components/common/GamificationNotifier';
import ToastManager from './components/common/ToastManager';

// Import RTL form styles
import './styles/rtl-forms.css';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Login2FA from './pages/auth/Login2FA';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOTP from './pages/auth/VerifyOTP';
import ResetPassword from './pages/auth/ResetPassword';
import StudentDashboard from './pages/student/Dashboard';
import StudentCourse from './pages/student/Course';
import CourseDetailsPage from './pages/student/CourseDetailsPage';
import StudentGroupSections from './pages/student/GroupSections';
import StudentSectionContent from './pages/student/SectionContent';
import EnrollPage from './pages/student/EnrollPage';
import PaymentPage from './pages/student/PaymentPage';
import PayAllPage from './pages/student/PayAllPage';
import StudentCertificates from './pages/student/Certificates';
import Wishlist from './pages/student/Wishlist';
import MyStats from './pages/student/MyStats';
import Leaderboard from './pages/student/Leaderboard';
import CourseDetails from './pages/CourseDetails';
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorCourseDetails from './pages/instructor/CourseDetails';
import CourseGroups from './pages/instructor/CourseGroups';
import GroupSections from './pages/instructor/GroupSections';
import PendingPayments from './pages/instructor/PendingPayments';
import CertificateManagement from './pages/instructor/CertificateManagement';
import InstructorGrading from './pages/instructor/Grading';
import InstructorSettings from './pages/instructor/Settings';
import StudentSettings from './pages/student/Settings';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminInstructors from './pages/admin/Instructors';
import AdminCourses from './pages/admin/Courses';
import CategoryManagement from './pages/admin/CategoryManagement';
import LevelManagement from './pages/admin/LevelManagement';
import PaymentVerification from './pages/admin/PaymentVerification';
import AdminCertificateManagement from './pages/admin/CertificateManagement';
import AdminSettings from './pages/admin/Settings';
import AdminDeleteRequests from './pages/admin/DeleteRequests';
import AgreementSettings from './pages/admin/AgreementSettings';
import InstructorApplications from './pages/admin/InstructorApplications';
import GlobalSettings from './pages/admin/GlobalSettings';
import DiscountManagement from './pages/admin/DiscountManagement';
import BackupManagement from './pages/admin/BackupManagement';
import GamificationManagement from './pages/admin/GamificationManagement';
import YouTubeConfiguration from './pages/admin/YouTubeConfiguration';
import YouTubeVideoLibrary from './pages/admin/YouTubeVideoLibrary';
import TelegramFiles from './pages/admin/TelegramFiles';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifySuccess from './pages/auth/VerifySuccess';
import VerifyError from './pages/auth/VerifyError';
import InstructorRegister from './pages/auth/InstructorRegister';
import InstructorPendingApproval from './pages/instructor/PendingApproval';

// New instructor payment and earnings pages
import InstructorAgreement from './pages/instructor/InstructorAgreement';
import PendingApproval from './pages/instructor/PendingApproval';
import MyEarnings from './pages/instructor/MyEarnings';
import InstructorPaymentHistory from './pages/instructor/PaymentHistory';
import TwoFASettings from './pages/security/TwoFASettings';
import TrustedDevices from './pages/security/TrustedDevices';

// Active Test pages
import ActiveTestManager from './pages/instructor/ActiveTestManager';
import CreateActiveTest from './pages/instructor/CreateActiveTest';
import TestStatistics from './pages/instructor/TestStatistics';
import TakeActiveTest from './pages/student/TakeActiveTest';
import TestResults from './pages/student/TestResults';

// Student payment pages
import MyPayments from './pages/student/MyPayments';
import PaymentHistory from './pages/student/PaymentHistory';

// New admin payment and earnings pages
import InstructorPayments from './pages/admin/InstructorPayments';
import AdminEarnings from './pages/admin/AdminEarnings';
import PaymentEarnings from './pages/admin/PaymentEarnings';
import InstructorEarningsManagement from './pages/admin/InstructorEarningsManagement';
import InstructorAgreementsManagement from './pages/admin/InstructorAgreementsManagement';

// Static pages
import HelpCenter from './pages/static/Help';
import FAQ from './pages/static/FAQ';
import Privacy from './pages/static/Privacy';
import Terms from './pages/static/Terms';
import About from './pages/static/About';
import Contact from './pages/static/Contact';
import Instructors from './pages/public/Instructors';
import InstructorProfile from './pages/public/InstructorProfile';

// New shared app pages
import CourseGroupsPage from './pages/app/CourseGroups';
import GroupDetailsPage from './pages/app/GroupDetails';
import SectionContentManagementPage from './pages/app/SectionContentManagement';
import StudentSectionViewPage from './pages/app/StudentSectionView';

// Contexts
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

// Utils
import { getDefaultCurrency } from './utils/currency';

// Animated Routes wrapper component
function AnimatedRoutes({ user }) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/courses/:id" element={<CourseDetails />} />
                <Route path="/instructors" element={<Instructors />} />
                <Route path="/instructor/:id" element={<InstructorProfile />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route 
                  path="/login" 
                  element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/student'} /> : <Login />} 
                />
                <Route path="/login-2fa" element={<Login2FA />} />
                <Route 
                  path="/register" 
                  element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/student'} /> : <Register />} 
                />
                <Route path="/register/instructor" element={<InstructorRegister />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Email Verification */}
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/verify-success" element={<VerifySuccess />} />
                <Route path="/verify-error" element={<VerifyError />} />

                {/* Protected Routes */}
                <Route path="/student" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/student/course/:id" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentCourse />
                  </ProtectedRoute>
                } />
                <Route path="/student/course/:id/details" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <CourseDetailsPage />
                  </ProtectedRoute>
                } />
                <Route path="/student/groups/:groupId/sections" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentGroupSections />
                  </ProtectedRoute>
                } />
                <Route path="/student/sections/:sectionId/content" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentSectionContent />
                  </ProtectedRoute>
                } />
                <Route path="/student/course/:id/enroll" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <EnrollPage />
                  </ProtectedRoute>
                } />
                <Route path="/student/section/:sectionId/payment" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <PaymentPage />
                  </ProtectedRoute>
                } />
                <Route path="/student/course/:courseId/pay-all" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <PayAllPage />
                  </ProtectedRoute>
                } />
                <Route path="/student/my-payments" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyPayments />
                  </ProtectedRoute>
                } />
                <Route path="/student/certificates" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentCertificates />
                  </ProtectedRoute>
                } />
                <Route path="/student/wishlist" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Wishlist />
                  </ProtectedRoute>
                } />
                <Route path="/student/my-stats" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyStats />
                  </ProtectedRoute>
                } />
                <Route path="/student/leaderboard" element={
                  <ProtectedRoute allowedRoles={['student','admin','instructor']}>
                    <Leaderboard />
                  </ProtectedRoute>
                } />
                <Route path="/student/payment-history" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <PaymentHistory />
                  </ProtectedRoute>
                } />
                <Route path="/student/settings" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentSettings />
                  </ProtectedRoute>
                } />
                
                {/* Active Test routes for students */}
                <Route path="/student/test/:testId" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <TakeActiveTest />
                  </ProtectedRoute>
                } />
                <Route path="/student/test-results/:attemptId" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <TestResults />
                  </ProtectedRoute>
                } />
                
                <Route path="/instructor" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <InstructorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/courses/:id" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <InstructorCourseDetails />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/courses/:id/edit" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <InstructorCourseDetails />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/courses/:courseId/groups" element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <CourseGroups />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/groups/:groupId/sections" element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <GroupSections />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/sections/:sectionId/content" element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <SectionContentManagementPage />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/payments" element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <PendingPayments />
                  </ProtectedRoute>
                } />
                {/* Payment verification removed - only accessible to admin */}
                <Route path="/instructor/certificates" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <CertificateManagement />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/grading" element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <InstructorGrading />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/settings" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <InstructorSettings />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/pending" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <InstructorPendingApproval />
                  </ProtectedRoute>
                } />
                
                {/* Active Test routes for instructors */}
                <Route path="/instructor/sections/:sectionId/tests" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <ActiveTestManager />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/tests/create/:sectionId" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <CreateActiveTest />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/tests/:testId/edit" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <CreateActiveTest />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/tests/:testId/statistics" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <TestStatistics />
                  </ProtectedRoute>
                } />
                
                {/* Instructor payment and earnings routes */}
                <Route path="/instructor/agreement" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <InstructorAgreement />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/pending-approval" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <PendingApproval />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/earnings" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <MyEarnings />
                  </ProtectedRoute>
                } />
                <Route path="/instructor/payment-history" element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <InstructorPaymentHistory />
                  </ProtectedRoute>
                } />

                {/* Security (Admin/Instructor) */}
                <Route path="/security" element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <TwoFASettings />
                  </ProtectedRoute>
                } />
                <Route path="/security/devices" element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <TrustedDevices />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/students" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminStudents />
                  </ProtectedRoute>
                } />
                <Route path="/admin/instructors" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminInstructors />
                  </ProtectedRoute>
                } />
                <Route path="/admin/courses" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminCourses />
                  </ProtectedRoute>
                } />
                <Route path="/admin/categories" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CategoryManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/levels" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <LevelManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/courses/:id/edit" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <InstructorCourseDetails />
                  </ProtectedRoute>
                } />
                <Route path="/admin/payment-verification" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PaymentVerification />
                  </ProtectedRoute>
                } />
                <Route path="/admin/certificates" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminCertificateManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/delete-requests" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDeleteRequests />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings/agreement" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AgreementSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/instructor-applications" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <InstructorApplications />
                  </ProtectedRoute>
                } />
                <Route path="/admin/global-settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <GlobalSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/youtube-configuration" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <YouTubeConfiguration />
                  </ProtectedRoute>
                } />
                <Route path="/admin/youtube-videos" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <YouTubeVideoLibrary />
                  </ProtectedRoute>
                } />
                <Route path="/admin/telegram-files" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <TelegramFiles />
                  </ProtectedRoute>
                } />
                <Route path="/admin/discounts" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DiscountManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/gamification" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <GamificationManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/backup" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <BackupManagement />
                  </ProtectedRoute>
                } />
                
                {/* Admin payment and earnings routes */}
                <Route path="/admin/instructor-payments" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <InstructorPayments />
                  </ProtectedRoute>
                } />
                <Route path="/admin/earnings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminEarnings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/payment-earnings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PaymentEarnings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/instructor-agreements" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <InstructorAgreementsManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                <Route path="/messages" element={
                  <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
                    <Messages />
                  </ProtectedRoute>
                } />

                {/* Shared App Routes (Instructor/Admin) */}
                <Route path="/app/courses/:courseId/groups" element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <CourseGroupsPage />
                  </ProtectedRoute>
                } />
                <Route path="/app/courses/:courseId/groups/:groupId" element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <GroupDetailsPage />
                  </ProtectedRoute>
                } />
                <Route path="/app/sections/:sectionId/content" element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <SectionContentManagementPage />
                  </ProtectedRoute>
                } />

                {/* Student Section View */}
                <Route path="/app/student/sections/:sectionId" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentSectionViewPage />
                  </ProtectedRoute>
                } />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { user, loading, showCelebration, hideCelebration } = useAuth();
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // Apply dir and lang attributes to document
  React.useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', i18n.language);
    document.body.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  }, [i18n.language, isRTL]);

  // Initialize default currency on app load
  React.useEffect(() => {
    getDefaultCurrency().catch(err => {
      console.error('Failed to load default currency:', err);
    });
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          
          <main className="flex-1">
            <AnimatedRoutes user={user} />
          </main>
          
          <Footer />
        </div>
      </Router>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#374151' : '#fff',
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
          },
        }}
      />
      
      <Celebration 
        show={showCelebration} 
        onComplete={hideCelebration}
        message={user ? `Welcome back, ${user.name}!` : "Welcome!"}
      />
      <GamificationNotifier />
      <ToastManager />
    </div>
  );
}

export default App;
