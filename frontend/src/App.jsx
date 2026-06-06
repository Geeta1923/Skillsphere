import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useSelector, useDispatch } from 'react-redux'
import { authSuccess, authFail } from './redux/slices/authSlice'
import API from './utils/axios'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import FreelancerDashboard from './pages/dashboard/FreelancerDashboard'
import DashboardLayout from './layouts/DashboardLayout'
import ProfilePage from './pages/dashboard/ProfilePage'
import BrowseGigs from './pages/dashboard/BrowseGigs'
import GigDetail from './pages/dashboard/GigDetail'
import MyProposals from './pages/dashboard/MyProposals'
import ClientDashboard from './pages/dashboard/ClientDashboard'
import CreateGig from './pages/dashboard/CreateGig'
import ChatPage from './pages/dashboard/ChatPage'
import ReviewsPage from './pages/dashboard/ReviewsPage'
import ClientReviewsPage from './pages/dashboard/ClientReviewsPage'
import EarningsPage from './pages/dashboard/EarningsPage'
import PaymentPage from './pages/dashboard/PaymentPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminGigs from './pages/admin/AdminGigs'
import AdminPayments from './pages/admin/AdminPayments'
import GigProposals from './pages/dashboard/GigProposals'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import LandingPage from './pages/LandingPage'
import AnalyticsDashboard from './pages/dashboard/AnalyticsDashboard'
import ProgressTracker from './pages/dashboard/ProgressTracker'
import DisputesPage from './pages/dashboard/DisputesPage'
import AdminDisputes from './pages/admin/AdminDisputes'
import AvailabilityScheduler from './pages/dashboard/AvailabilityScheduler'
import AIMatch from './pages/dashboard/AIMatch'
import SkillGapPage from './pages/dashboard/SkillGapPage'
import InterviewPage from './pages/dashboard/InterviewPage'
import PortfolioArchitect from './pages/dashboard/PortfolioArchitect'
import MentorMarketplace from './pages/dashboard/MentorMarketplace'
import MySessions from './pages/dashboard/MySessions'






// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth)
  return user ? children : <Navigate to="/login" />
}

const RoleDashboard = () => {
  const { user } = useSelector(state => state.auth)
  if (user?.role === 'admin') return <Navigate to="/admin" />
  if (user?.role === 'client') return <ClientDashboard />
  return <FreelancerDashboard />
}

const RoleReviews = () => {
  const { user } = useSelector(state => state.auth)
  return user?.role === 'client' ? <ClientReviewsPage /> : <ReviewsPage />
}

const ClientRoute = ({ children }) => {
  const { user } = useSelector(state => state.auth)
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'client' && user.role !== 'admin') return <Navigate to="/dashboard" />
  return children
}

const FreelancerRoute = ({ children }) => {
  const { user } = useSelector(state => state.auth)
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'freelancer' && user.role !== 'admin') return <Navigate to="/dashboard" />
  return children
}

const AdminRoute = ({ children }) => {
  const { user } = useSelector(state => state.auth)
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'admin') return <Navigate to="/dashboard" />
  return children
}

function App() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await API.get('/auth/me')
        if (data.success) {
          dispatch(authSuccess(data.user))
        }
      } catch (err) {
        dispatch(authFail(null)) // Not logged in
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkSession()
  }, [dispatch])

  if (isCheckingAuth) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f0f1a', color: 'white'
      }}>
        <div className="spinner"></div> 
        <p style={{ marginLeft: '10px' }}>Loading SkillSphere...</p>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />  // ← was Navigate to /login

        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardLayout>
      {/* Show different dashboard based on role */}
      <RoleDashboard />
    </DashboardLayout>
  </ProtectedRoute>
} />
        <Route path="/dashboard/profile" element={
  <ProtectedRoute>
    <DashboardLayout>
      <ProfilePage />
    </DashboardLayout>
  </ProtectedRoute>
} />

    <Route path="/dashboard/create-gig" element={
  <ClientRoute>
    <DashboardLayout>
      <CreateGig />
    </DashboardLayout>
  </ClientRoute>
} />
    <Route path="/dashboard/gigs" element={
  <ProtectedRoute>
    <DashboardLayout>
      <BrowseGigs />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/dashboard/gigs/:id" element={
  <ProtectedRoute>
    <DashboardLayout>
      <GigDetail />
    </DashboardLayout>
  </ProtectedRoute>
} />



<Route path="/dashboard/proposals" element={
  <ProtectedRoute>
    <DashboardLayout>
      <MyProposals />
    </DashboardLayout>
  </ProtectedRoute>
} />


<Route path="/dashboard/messages" element={
  <ProtectedRoute>
    <DashboardLayout>
      <ChatPage />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/dashboard/reviews" element={
  <ProtectedRoute>
    <DashboardLayout>
      <RoleReviews />
    </DashboardLayout>
  </ProtectedRoute>
} />


<Route path="/dashboard/earnings" element={
  <FreelancerRoute>
    <DashboardLayout>
      <EarningsPage />
    </DashboardLayout>
  </FreelancerRoute>
} />

<Route path="/dashboard/payments" element={
  <ProtectedRoute>
    <DashboardLayout>
      <PaymentPage />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/admin" element={
  <AdminRoute>
    <DashboardLayout>
      <AdminDashboard />
    </DashboardLayout>
  </AdminRoute>
} />

<Route path="/admin/users" element={
  <AdminRoute>
    <DashboardLayout>
      <AdminUsers />
    </DashboardLayout>
  </AdminRoute>
} />

<Route path="/admin/gigs" element={
  <AdminRoute>
    <DashboardLayout>
      <AdminGigs />
    </DashboardLayout>
  </AdminRoute>
} />

<Route path="/admin/payments" element={
  <AdminRoute>
    <DashboardLayout>
      <AdminPayments />
    </DashboardLayout>
  </AdminRoute>
} />

<Route path="/dashboard/gigs/:gigId/proposals" element={
  <ProtectedRoute>
    <DashboardLayout>
      <GigProposals />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/dashboard/analytics" element={
  <ProtectedRoute>
    <DashboardLayout>
      <AnalyticsDashboard />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/dashboard/progress" element={
  <ProtectedRoute>
    <DashboardLayout>
      <ProgressTracker />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/dashboard/disputes" element={
  <ProtectedRoute>
    <DashboardLayout>
      <DisputesPage />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/admin/disputes" element={
  <AdminRoute>
    <DashboardLayout>
      <AdminDisputes />
    </DashboardLayout>
  </AdminRoute>
} />

<Route path="/dashboard/availability" element={
  <FreelancerRoute>
    <DashboardLayout>
      <AvailabilityScheduler />
    </DashboardLayout>
  </FreelancerRoute>
} />

<Route path="/dashboard/aimatch" element={
  <ProtectedRoute>
    <DashboardLayout>
      <AIMatch />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/dashboard/skill-gap" element={
  <FreelancerRoute>
    <DashboardLayout>
      <SkillGapPage />
    </DashboardLayout>
  </FreelancerRoute>
} />

<Route path="/dashboard/interview" element={
  <FreelancerRoute>
    <DashboardLayout>
      <InterviewPage />
    </DashboardLayout>
  </FreelancerRoute>
} />

<Route path="/dashboard/portfolio-architect" element={
  <FreelancerRoute>
    <DashboardLayout>
      <PortfolioArchitect />
    </DashboardLayout>
  </FreelancerRoute>
} />

<Route path="/dashboard/mentors" element={
  <ProtectedRoute>
    <DashboardLayout>
      <MentorMarketplace />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/dashboard/mentorship-sessions" element={
  <ProtectedRoute>
    <DashboardLayout>
      <MySessions />
    </DashboardLayout>
  </ProtectedRoute>
} />


<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/verify-email" element={<VerifyEmail />} />
       {/* Catch-all for undefined routes */}
        <Route path="*" element={<Navigate to="/dashboard" />} /> 
      </Routes>
    </>
  )
}

export default App