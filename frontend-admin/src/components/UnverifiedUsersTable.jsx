import { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, RefreshCw, User, Key, FileText } from 'lucide-react';
import { useUnverifiedUsers, useVerifyUser } from '../hooks/usePoliceAPI';
import { useToast } from '../components/ui/Toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

const UnverifiedUsersTable = () => {
  const { users, loading, error, refetch } = useUnverifiedUsers();
  const { verifyUser, verifying } = useVerifyUser();
  const { showToast } = useToast();
  const [verifyingUserId, setVerifyingUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [privateKeyFile, setPrivateKeyFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);

  const handleFileChange = (setter) => (e) => {
    setter(e.target.files[0]);
  };

  const handleVerifyClick = (userId, fullName) => {
    setSelectedUser({ id: userId, fullName });
    setIsDialogOpen(true);
  };

  const handleVerifyUser = async () => {
    if (!privateKeyFile || !certificateFile) {
      showToast('Please select both private key and certificate files', 'error');
      return;
    }

    try {
      setVerifyingUserId(selectedUser.id);
      setIsDialogOpen(false);

      // Create FormData to send files
      const formData = new FormData();
      formData.append('userId', selectedUser.id);
      formData.append('privateKey', privateKeyFile);
      formData.append('certificate', certificateFile);

      await verifyUser(formData);
      showToast(`Successfully verified ${selectedUser.fullName}`, 'success');
      refetch(); // Refresh the list
    } catch (error) {
      showToast(`Failed to verify ${selectedUser.fullName}: ${error.message}`, 'error');
    } finally {
      setVerifyingUserId(null);
      setPrivateKeyFile(null);
      setCertificateFile(null);
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
                  <th className="text-left p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const fullName = `${user.first_name} ${user.last_name}`.trim();
                  const isVerifying = verifyingUserId === user.id;

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
                        <button
                          onClick={() => handleVerifyClick(user.id, fullName)}
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog for file selection */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl max-w-md">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Verify User: {selectedUser?.fullName}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Please select the private key and signed certificate files for verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Key className="w-4 h-4" />
                Private Key (.key)
              </label>
              <input
                type="file"
                accept=".key"
                onChange={handleFileChange(setPrivateKeyFile)}
                className="block w-full text-sm text-gray-600 dark:text-gray-400
                  file:mr-4 file:py-3 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900 dark:file:text-blue-300
                  dark:hover:file:bg-blue-800
                  cursor-pointer border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-800"
              />
              {privateKeyFile && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ Selected: {privateKeyFile.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FileText className="w-4 h-4" />
                Signed Certificate (.pem)
              </label>
              <input
                type="file"
                accept=".pem,.crt"
                onChange={handleFileChange(setCertificateFile)}
                className="block w-full text-sm text-gray-600 dark:text-gray-400
                  file:mr-4 file:py-3 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900 dark:file:text-blue-300
                  dark:hover:file:bg-blue-800
                  cursor-pointer border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-800"
              />
              {certificateFile && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ Selected: {certificateFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              size="default"
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
              onClick={() => setIsDialogOpen(false)} 
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="default"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleVerifyUser}
              disabled={!privateKeyFile || !certificateFile || verifying}
            >
              {verifying ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnverifiedUsersTable;

