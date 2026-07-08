import AdminPage from "./pages/AdminPage";
import BoardPage from "./pages/BoardPage";

export default function App() {
  if (window.location.pathname === "/admin") {
    return <AdminPage />;
  }
  return <BoardPage />;
}
