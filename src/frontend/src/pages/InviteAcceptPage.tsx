import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAcceptInvite } from '../hooks/useCollaboration';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

type PageState = 'loading' | 'success' | 'error';

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { mutate: acceptInvite } = useAcceptInvite();

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('Invalid invite link. No token found.');
      return;
    }

    const isLoggedIn = Boolean(localStorage.getItem('oav_token'));
    if (!isLoggedIn) {
      // Redirect to login with invite token in state
      navigate(`/login?invite=${token}`, { replace: true });
      return;
    }

    acceptInvite(token, {
      onSuccess: () => {
        setState('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
      },
      onError: (err: unknown) => {
        setState('error');
        if (err && typeof err === 'object' && 'response' in err) {
          const resp = (err as { response?: { data?: { detail?: string } } }).response;
          setErrorMessage(resp?.data?.detail ?? 'Failed to accept invite. The link may have expired.');
        } else {
          setErrorMessage('Failed to accept invite. The link may have expired.');
        }
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-oav-bg flex items-center justify-center p-6">
      <div className="bg-oav-surface border border-oav-border rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center space-y-5">
        {state === 'loading' && (
          <>
            <LoadingSpinner size="lg" />
            <p className="text-sm text-oav-muted">Accepting invite...</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-oav-success/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-oav-success" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-oav-text">You're in!</h1>
              <p className="text-sm text-oav-muted mt-2">
                You've joined the workspace. Redirecting to dashboard...
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-oav-accent hover:bg-oav-accent/80 transition-colors min-h-[44px]"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-oav-error/20 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-oav-error" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-oav-text">Invite failed</h1>
              <p className="text-sm text-oav-muted mt-2">{errorMessage}</p>
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-oav-accent hover:bg-oav-accent/80 transition-colors min-h-[44px]"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
