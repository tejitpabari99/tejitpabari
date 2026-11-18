import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInGate } from '../auth/SignInGate';
import { useAuth } from '../auth/useAuth';

export default function Login() {
  const { role } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (role === 'admin') navigate('/', { replace: true });
  }, [role, navigate]);
  return <SignInGate />;
}
