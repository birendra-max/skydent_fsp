import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminRoutes from "./routes/Adminroutes";
import DesignerRoutes from "./routes/DesignerRoutes";
import UserRoutes from './routes/UserRoutes';
import { ThemeProvider } from "./Context/ThemeContext";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<UserRoutes />} />
          <Route path="/user/*" element={<UserRoutes />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/designer/*" element={<DesignerRoutes />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}