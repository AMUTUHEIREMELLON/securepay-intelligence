import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">SecurePay Intelligence</div>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        {['admin', 'business_manager', 'security_admin'].includes(user.role) && (
          <>
            <Link to="/transactions">Transactions</Link>
            <Link to="/nlp">Ask Assistant</Link>
          </>
        )}
        {['security_admin', 'admin'].includes(user.role) && <Link to="/security">Security</Link>}
      </div>
      <div className="navbar-user">
        <span>{user.name} · {user.role}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
