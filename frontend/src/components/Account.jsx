import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Download, FileText, Key } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, logout, api } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [citizenData, setCitizenData] = useState(null);
  const [citizenLoading, setCitizenLoading] = useState(false);
  const [citizenError, setCitizenError] = useState('');

  // New states for CSR and Certificate
  const [csrData, setCsrData] = useState(null);
  const [certData, setCertData] = useState(null);
  const [csrLoading, setCsrLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [csrError, setCsrError] = useState('');
  const [certError, setCertError] = useState('');

  if (!user) {
    navigate('/login');
  }

  useEffect(() => {
    const fetchCitizenData = async () => {
      if (user && user.id) {
        setCitizenLoading(true);
        setCitizenError('');
        try {
          const response = await api.get(`/citizen/${user.id}`);
          const result = await response.data;

          if (result.success) {
            setCitizenData(result.data);
          } else {
            setCitizenError(result.message || 'Failed to fetch citizen data');
          }
        } catch (err) {
          setCitizenError('Error fetching citizen data. Please try again later.');
          console.error('Error fetching citizen data:', err);
        } finally {
          setCitizenLoading(false);
        }
      }
    };

    fetchCitizenData();
  }, [user]);

  // Fetch CSR data
  const fetchCSR = async () => {
    setCsrLoading(true);
    setCsrError('');
    try {
      const response = await api.get('/citizen/my-csr');
      console.log('CSR response:', response.data);
      if (response.data.success) {
        // Convert array buffer to string using TextDecoder
        let csrContent;
        if (response.data.csr && response.data.csr.data) {
          const uint8Array = new Uint8Array(response.data.csr.data);
          const decoder = new TextDecoder('utf-8');
          csrContent = decoder.decode(uint8Array);
        } else {
          csrContent = response.data.data?.content || response.data.csr || 'No CSR content found';
        }

        setCsrData({
          content: csrContent,
          filename: 'certificate_request.csr'
        });
      } else {
        setCsrError(response.data.message || 'Failed to fetch CSR');
      }
    } catch (err) {
      setCsrError('CSR not found or error fetching CSR');
      console.error('Error fetching CSR:', err);
    } finally {
      setCsrLoading(false);
    }
  };

  // Fetch Certificate data
  const fetchCertificate = async () => {
    setCertLoading(true);
    setCertError('');
    try {
      const response = await api.get('/citizen/my-certificate');
      console.log('Certificate response:', response.data);
      if (response.data.success) {
        // Convert array buffer to string using TextDecoder
        let certContent;
        if (response.data.certificate && response.data.certificate.data) {
          const uint8Array = new Uint8Array(response.data.certificate.data);
          const decoder = new TextDecoder('utf-8');
          certContent = decoder.decode(uint8Array);
        } else {
          certContent = response.data.data?.content || response.data.certificate || 'No certificate content found';
        }

        setCertData({
          content: certContent,
          filename: 'certificate.crt'
        });
      } else {
        setCertError(response.data.message || 'Failed to fetch certificate');
      }
    } catch (err) {
      setCertError('Certificate not found or error fetching certificate');
      console.error('Error fetching certificate:', err);
    } finally {
      setCertLoading(false);
    }
  };

  // Download function
  const downloadFile = (content, filename, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const updates = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      };

      if (formData.password) {
        updates.password = formData.password;
      }

      const result = await updateProfile(updates);

      if (result.success) {
        setSuccess('Profile updated successfully');
        setIsEditing(false);
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  // Helper function to display citizen data with fallback
  const displayCitizenField = (field, label) => {
    const value = citizenData && citizenData[field] ? citizenData[field] : 'Chưa được cung cấp';
    return (
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value}</dd>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Profile Information
            </h3>

            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{success}</span>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="mt-5 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Tên đăng nhập</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Tên</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.firstName}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Họ</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.lastName}</dd>
                  </div>
                </dl>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Logout
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-white shadow sm:rounded-lg mt-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Thông tin cá nhân
            </h3>

            {citizenError && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{citizenError}</span>
              </div>
            )}

            {citizenLoading ? (
              <div className="mt-4 text-center py-4">
                <p className="text-gray-500">Đang tải thông tin cá nhân...</p>
              </div>
            ) : (
              <div className="mt-5">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  {displayCitizenField('hoVaTen', 'Họ và Tên')}
                  {displayCitizenField('soCCCD', 'Số CCCD')}
                  {displayCitizenField('noiCapCCCD', 'Nơi Cấp CCCD')}
                  {displayCitizenField('ngayCapCCCD', 'Ngày Cấp CCCD')}
                  {displayCitizenField('ngaySinh', 'Ngày Sinh')}
                  {displayCitizenField('gioiTinh', 'Giới Tính')}
                  {displayCitizenField('queQuan', 'Quê Quán')}
                  {displayCitizenField('noiThuongTru', 'Nơi Thường Trú')}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* CSR and Certificate Section */}
        <div className="bg-white shadow sm:rounded-lg mt-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Chứng chỉ và CSR
            </h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* CSR Section */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Key className="w-5 h-5 text-blue-500 mr-2" />
                    <h4 className="text-md font-medium text-gray-900">Certificate Signing Request</h4>
                  </div>
                  <button
                    onClick={fetchCSR}
                    disabled={csrLoading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {csrLoading ? 'Loading...' : 'Load CSR'}
                  </button>
                </div>

                {csrError && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                    {csrError}
                  </div>
                )}

                {csrData && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-sm text-gray-600 mb-2">File: {csrData.filename}</p>
                      <textarea
                        readOnly
                        value={csrData.content}
                        className="w-full h-32 text-xs font-mono bg-white border rounded p-2 resize-none"
                      />
                    </div>
                    <button
                      onClick={() => downloadFile(csrData.content, csrData.filename)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download CSR
                    </button>
                  </div>
                )}
              </div>

              {/* Certificate Section */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-green-500 mr-2" />
                    <h4 className="text-md font-medium text-gray-900">Certificate</h4>
                  </div>
                  <button
                    onClick={fetchCertificate}
                    disabled={certLoading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {certLoading ? 'Loading...' : 'Load Certificate'}
                  </button>
                </div>

                {certError && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                    {certError}
                  </div>
                )}

                {certData && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-sm text-gray-600 mb-2">File: {certData.filename}</p>
                      <textarea
                        readOnly
                        value={certData.content}
                        className="w-full h-32 text-xs font-mono bg-white border rounded p-2 resize-none"
                      />
                    </div>
                    <button
                      onClick={() => downloadFile(certData.content, certData.filename)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Certificate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

