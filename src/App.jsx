import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import TakeAttendance from "./pages/TakeAttendance.jsx";
import ClassAttendance from "./pages/ClassAttendance.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import StudentAttendance from "./pages/StudentAttendance.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminStudent from "./pages/AdminStudent.jsx";

function Protected({ role, children }) {
  const { user } = useAuth();
  if (!user || user.role !== role) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to={user.role === "teacher" ? "/teacher" : user.role === "admin" ? "/admin" : "/student/attendance"} replace /> : <Login />} />
      <Route path="/teacher" element={<Protected role="teacher"><TeacherDashboard /></Protected>} />
      <Route path="/teacher/classes/:id/take" element={<Protected role="teacher"><TakeAttendance /></Protected>} />
      <Route path="/teacher/classes/:id/attendance" element={<Protected role="teacher"><ClassAttendance /></Protected>} />
      <Route path="/student/profile" element={<Protected role="student"><StudentProfile /></Protected>} />
      <Route path="/student/attendance" element={<Protected role="student"><StudentAttendance /></Protected>} />
      <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
      <Route path="/admin/students/:id" element={<Protected role="admin"><AdminStudent /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
