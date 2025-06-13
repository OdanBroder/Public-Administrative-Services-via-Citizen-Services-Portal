import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Key, FileText, ArrowLeft, AlertTriangle, User } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import Mldsa_wrapper from '../utils/crypto/MLDSAWrapper';

const convertPEMToDER = (pemKey) => {
    // Remove the PEM headers and footers
    const base64Key = pemKey
        .replace(/-----BEGIN [^-]+-----/, "") // Remove the BEGIN header
        .replace(/-----END [^-]+-----/, "")   // Remove the END footer
        .replace(/\n/g, "");                  // Remove newlines

    // Decode the Base64 content
    const binaryString = atob(base64Key);

    // Convert the binary string to a Uint8Array
    const derData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        derData[i] = binaryString.charCodeAt(i);
    }

    return derData;
};

const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

const VerifyUserPage = () => {
    const { api } = useAuth();
    const { userId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [user, setUser] = useState(null);
    const [csrContent, setCsrContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [privateKeyFile, setPrivateKeyFile] = useState(null);
    const [certificateFile, setCertificateFile] = useState(null);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/police/unverified-users/${userId}`);
                const success = response.data.success;
                const userData = response.data.data;

                if (success && userData.length > 0) {
                    const userInfo = userData[0];
                    setUser(userInfo);
                    setCsrContent(userInfo.csr_content || '');
                } else {
                    setError('User not found or no CSR available');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(`Error loading user data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserData();
        }
    }, [userId, api]);

    const handleFileChange = (setter) => (e) => {
        setter(e.target.files[0]);
    };

    const handleVerifyUser = async () => {
        if (!certificateFile) {
            showToast('Please select certificate file', 'error');
            return;
        }

        if (!privateKeyFile) {
            showToast('Please select private key file', 'error');
            return;
        }

        try {
            setVerifying(true);

            // Read file contents as text
            const certificateContent = await readFileAsText(certificateFile);
            const privateKeyContent = await readFileAsText(privateKeyFile);

            // Convert PEM to DER
            const certificatePolice = convertPEMToDER(certificateContent);
            const privateKeyPolice = convertPEMToDER(privateKeyContent);
            const csrData = convertPEMToDER(csrContent);

            const signedCertificate = await Mldsa_wrapper.signCertificate(privateKeyPolice, csrData, certificatePolice);

            if (!signedCertificate) {
                showToast('Lỗi khi ký chứng chỉ', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('userCert', new Blob([signedCertificate], { type: 'application/x-x509-ca-cert' }));
            const response = await api.post(`/police/sign-certificate/${userId}`, formData);

            if (response.data.success) {
                showToast(`Successfully verified user`, 'success');
                navigate('/police/unverified-users');
            } else {
                throw new Error(response.data.message || 'Failed to verify user');
            }
        } catch (error) {
            console.error('Error verifying user:', error);
            showToast(`Failed to verify user: ${error.message}`, 'error');
        } finally {
            setVerifying(false);
        }
    };

    const handleBack = () => {
        navigate('/police/unverified-users');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <LoadingSpinner size="lg" className="mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading user data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Error Loading User</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Users
                    </button>
                </div>
            </div>
        );
    }

    const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : '';

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Users
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-primary" />
                        Verify User Certificate
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Review and sign certificate for: <span className="font-medium">{fullName}</span>
                    </p>
                </div>
            </div>

            {/* User Information Card */}
            {user && (
                <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        User Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">User ID</label>
                            <p className="text-gray-900 font-mono">{user.id}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Full Name</label>
                            <p className="text-gray-900">{fullName || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="text-gray-900">{user.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Username</label>
                            <p className="text-gray-900">{user.username}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* CSR File Path */}
            {user.FilePath && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">CSR File Path</label>
                            <p className="text-gray-900 font-mono text-sm">{user.FilePath.csr}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Certificate Status</label>
                            <p className="text-gray-900">
                                {user.FilePath.certificate ? (
                                    <span className="text-green-600 font-medium">✓ Has Certificate</span>
                                ) : (
                                    <span className="text-yellow-600 font-medium">⏳ Pending Verification</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* CSR Content */}
            <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Signing Request (CSR)</h3>
                {csrContent ? (
                    <textarea
                        readOnly
                        value={csrContent}
                        className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50 resize-none"
                        placeholder="CSR content will appear here..."
                    />
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <p className="text-yellow-800">No CSR content available for this user.</p>
                    </div>
                )}
            </div>

            {/* File Upload Section */}
            <div className="bg-white border rounded-lg p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Certificate Verification</h3>
                    <p className="text-blue-700 text-sm">
                        Upload the private key and signed certificate files to complete the verification process.
                    </p>
                </div>

                {/* Private Key Upload */}
                <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700">
                        <Key className="w-4 h-4" />
                        Private Key (.key, .pem)
                    </label>
                    <input
                        type="file"
                        accept=".key,.pem"
                        onChange={handleFileChange(setPrivateKeyFile)}
                        className="block w-full text-sm text-gray-600
              file:mr-4 file:py-3 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer border border-gray-300 rounded-md
              bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {privateKeyFile && (
                        <div className="mt-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-green-600 font-medium">
                                Selected: {privateKeyFile.name}
                            </p>
                        </div>
                    )}
                </div>

                {/* Certificate Upload */}
                <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700">
                        <FileText className="w-4 h-4" />
                        Signed Certificate (.pem, .crt)
                    </label>
                    <input
                        type="file"
                        accept=".pem,.crt"
                        onChange={handleFileChange(setCertificateFile)}
                        className="block w-full text-sm text-gray-600
              file:mr-4 file:py-3 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer border border-gray-300 rounded-md
              bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {certificateFile && (
                        <div className="mt-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-green-600 font-medium">
                                Selected: {certificateFile.name}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <Button
                        variant="default"
                        size="lg"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleVerifyUser}
                        disabled={!certificateFile || !privateKeyFile || verifying}
                    >
                        {verifying ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Sign & Verify Certificate
                            </>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                        onClick={handleBack}
                        disabled={verifying}
                    >
                        Cancel
                    </Button>
                </div>

                {/* Requirements Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-amber-800 mb-2">Requirements:</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                        <li>• Private key file must be in .key or .pem format</li>
                        <li>• Certificate file must be in .pem or .crt format</li>
                        <li>• Both files must be properly signed and valid</li>
                        <li>• The certificate should correspond to the CSR shown above</li>
                        <li>• Verification process may take a few moments</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default VerifyUserPage;