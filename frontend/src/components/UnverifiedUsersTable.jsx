import { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, RefreshCw, User } from 'lucide-react';
import { useUnverifiedUsers, useVerifyUser } from '../hooks/usePoliceAPI';
import { useToast } from '../components/ui/Toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const UnverifiedUsersTable = () => {
  const { users, loading, error, refetch } = useUnverifiedUsers();
  const { verifyUser, verifying } = useVerifyUser();
  const { showToast } = useToast();
  const [verifyingUserId, setVerifyingUserId] = useState(null);

  const handleVerifyUser = async (userId, fullName) => {
    try {
      setVerifyingUserId(userId);
      await verifyUser(userId);
      showToast(`Successfully verified ${fullName}`, 'success');
      refetch(); // Refresh the list
    } catch (error) {
      showToast(`Failed to verify ${fullName}: ${error.message}`, 'error');
    } finally {
      setVerifyingUserId(null);
    }
  };

  const handleRefresh = () => {
    refetch();
    showToast('Refreshing user list...', 'success', 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading unverified users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            User Verification System
          </h1>
          <p className="text-muted-foreground">
            Manage and verify unverified user certificates
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Total Unverified</span>
          </div>
          <p className="text-2xl font-bold mt-1">{users.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-muted-foreground">Ready to Verify</span>
          </div>
          <p className="text-2xl font-bold mt-1">{users.filter(user => !user.error).length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-muted-foreground">With Issues</span>
          </div>
          <p className="text-2xl font-bold mt-1">{users.filter(user => user.error).length}</p>
        </div>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Users Verified</h3>
          <p className="text-muted-foreground">There are no unverified users at the moment.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold">ID</th>
                  <th className="text-left p-4 font-semibold">Full Name</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Username</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const fullName = `${user.first_name} ${user.last_name}`.trim();
                  const isVerifying = verifyingUserId === user.id;
                  const hasError = !!user.error;
                  
                  return (
                    <tr 
                      key={user.id} 
                      className={`border-t ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/30 transition-colors`}
                    >
                      <td className="p-4 font-mono text-sm">{user.id}</td>
                      <td className="p-4 font-medium">{fullName || 'N/A'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="p-4 text-sm">{user.username}</td>
                      <td className="p-4">
                        {hasError ? (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-yellow-700">Issue</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-700">Ready</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {hasError ? (
                          <div className="text-sm text-muted-foreground" title={user.error}>
                            Cannot verify
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVerifyUser(user.id, fullName)}
                            disabled={isVerifying || verifying}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isVerifying ? (
                              <>
                                <LoadingSpinner size="sm" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Verify
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnverifiedUsersTable;

