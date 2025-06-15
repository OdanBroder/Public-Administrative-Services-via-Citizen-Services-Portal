import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Key, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/Toast';
import Mldsa_wrapper from '../utils/crypto/MLDSAWrapper';

const formatKeyToPEM = (keyData, keyType) => {
  const base64Key = btoa(String.fromCharCode(...keyData));
  const formattedKey = `-----BEGIN ${keyType}-----\n${base64Key.match(/.{1,64}/g).join('\n')}\n-----END ${keyType}-----`;
  return formattedKey;
};

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

const BirthRegistrationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [privateKeyFile, setPrivateKeyFile] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api, role } = useAuth();
  const { showToast } = useToast();

  if (!role || role !== "BCA") {
    navigate("/unauthorized");
  }

  useEffect(() => {
    fetchRegistrationDetails();
    fetchSignature();
  }, [id]);

  const fetchSignature = async () => {
    try {
      const response = await api.get(`/bca/birthRegistrations/${id}/signature`);
      const responseData = response.data;
      if (!responseData.success) {
        console.error(responseData.message || "Failed to fetch signature");
      }

      const data = responseData.data;
      const parsedData = JSON.parse(data);
      const msg = {
        ...JSON.parse(parsedData.message),
        time: Date.now()
      }; 
      setMessage(JSON.stringify(msg));
    } catch (error) {
      console.error("Error reading signature file:", error);
      setError("Không thể đọc tệp chữ ký. Vui lòng thử lại.");
    }
  };

  const fetchRegistrationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/birth-registration/${id}`);

      const data = response.data;

      if (data.success) {
        setRegistration(data.data);
      } else {
        setError(data.message || "Failed to fetch registration details");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Error fetching registration details. Please try again later."
      );
      console.error("Error fetching registration details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const formData = new FormData();

      const privateKeyContent = await readFileAsText(privateKeyFile);
      if (!privateKeyContent) {
        showToast('Please select a valid private key file', 'error');
        return;
      }

      if(!message) {
        showToast('No message to sign. Please fetch the registration details first.', 'error');
        return;
      }

      const privateKeyDER = convertPEMToDER(privateKeyContent);

      const signedMessage = await Mldsa_wrapper.sign(privateKeyDER, message);
      if (!signedMessage) {
        showToast('Failed to sign the message. Please check your private key.', 'error');
        return;
      }
      const signCert = formatKeyToPEM(signedMessage, 'SIGNATURE');
      showToast('Message signed successfully', 'success');
      console.log('Signed message:', signCert);
      formData.append('bcaSignMessage', new Blob([signCert], { type: 'application/x-x509-ca-cert' }));

      const response = await api.post(`/bca/birthRegistrations/${id}/approve`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        navigate('/bca/birth-registrations');
      } else {
        setError(response.data.message || 'Không thể phê duyệt đơn đăng ký');
      }
    } catch (err) {
      setError('Không thể phê duyệt đơn đăng ký');
    }
  };

  const handleReject = async () => {
    try {
      const response = await api.post(`/bca/birthRegistrations/${id}/reject`);
      if (response.data.success) {
        navigate('/bca/birth-registrations');
      } else {
        setError(response.data.message || 'Không thể từ chối đơn đăng ký');
      }
    } catch (err) {
      setError('Không thể từ chối đơn đăng ký');
    }
  };


  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleBack = () => {
    navigate("/bca/birth-registrations");
  };

  const handleFileChange = (e) => {
    setPrivateKeyFile(e.target.files[0]);
  };

  const handleLoadPrivateKey = async () => {
    if (!privateKeyFile) {
      showToast('Please select a private key file', 'error');
      return;
    }

    try {
      setLoading(true);

      // Read file contents as text
      const privateKeyContent = await readFileAsText(privateKeyFile);

      // Convert PEM to DER
      const privateKeyDER = convertPEMToDER(privateKeyContent);

      // Store the processed key data (you can add your logic here)
      console.log('Private key loaded:', {
        file: privateKeyFile,
        content: privateKeyContent,
        der: privateKeyDER
      });

      showToast('Private key loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading private key:', error);
      showToast(`Failed to load private key: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <button
          onClick={handleBack}
          className="flex items-center mb-4 text-md font-medium text-blue-600 hover:text-blue-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Quay lại
        </button>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="container mx-auto py-6">
        <button
          onClick={handleBack}
          className="flex items-center mb-4 text-md font-medium text-blue-600 hover:text-blue-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Quay lại
        </button>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <p className="text-gray-500">Không tìm thấy thông tin đăng ký</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <button
        onClick={handleBack}
        className="flex items-center mb-4 text-md font-medium text-blue-600 hover:text-blue-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Quay lại
      </button>

      <div className="grid grid-cols-1 gap-6">
        {/* Status Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Đơn đăng ký khai sinh #{registration.id}
              </h3>
              <p className="mt-1 max-w-2xl text-md text-gray-500">
                Ngày tạo: {formatDate(registration.createdAt)}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-md font-medium ${registration.status === "approved"
                ? "bg-green-100 text-green-800"
                : registration.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
                }`}
            >
              {registration.status === "approved"
                ? "Đã duyệt"
                : registration.status === "rejected"
                  ? "Từ chối"
                  : "Đang xử lý"}
            </span>
          </div>
        </div>

        {/* Applicant Information */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Thông tin người nộp đơn
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Họ và tên</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.applicantName}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Ngày sinh</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {formatDate(registration.applicantDob)}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">
                  Số điện thoại
                </dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.applicantPhone}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Số CCCD</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.applicantCccd}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">
                  Ngày cấp CCCD
                </dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {formatDate(registration.applicantCccdIssueDate)}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">
                  Nơi cấp CCCD
                </dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.applicantCccdIssuePlace}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Địa chỉ</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.applicantAddress}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Registrant Information */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Thông tin người được khai sinh
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Họ và tên</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.registrantName}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Giới tính</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.registrantGender === "male" ? "Nam" : "Nữ"}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Dân tộc</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.registrantEthnicity}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Quốc tịch</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.registrantNationality}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Ngày sinh</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {formatDate(registration.registrantDob)}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">
                  Ngày sinh bằng chữ
                </dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.registrantDobInWords}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Nơi sinh</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.registrantBirthPlace}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">
                  Tỉnh/Thành phố
                </dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.registrantProvince}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Quê quán</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.registrantHometown}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Father Information */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Thông tin cha
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Họ và tên</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.fatherName}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Ngày sinh</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {formatDate(registration.fatherDob)}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Dân tộc</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.fatherEthnicity}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Quốc tịch</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.fatherNationality}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">
                  Loại cư trú
                </dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.fatherResidenceType}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Địa chỉ</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.fatherAddress}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Mother Information */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Thông tin mẹ
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Họ và tên</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.motherName}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Ngày sinh</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {formatDate(registration.motherDob)}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Dân tộc</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.motherEthnicity}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Quốc tịch</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.motherNationality}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">
                  Loại cư trú
                </dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.motherResidenceType}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                <dt className="text-md font-medium text-gray-500">Địa chỉ</dt>
                <dd className="mt-1 text-md text-gray-900 sm:mt-0">
                  {registration.motherAddress}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        {role === "Head" || role === "Staff" || role === "BCA" && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg flex justify-center p-6 space-x-4">
            <button
              type="button"
              className="text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-md px-6 py-3 transition duration-200 ease-in-out"
              onClick={handleReject}
            >
              Hủy thủ tục
            </button>
            <button
              type="button"
              className="text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-md px-6 py-3 transition duration-200 ease-in-out"
              onClick={handleApprove}
            >
              Phê duyệt thủ tục
            </button>
          </div>


        )}
        {/* Add hộ t button ký nếu application đã được duyệt */}
        <div className="space-y-4">
          {/* Private Key Upload */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700">
              <Key className="w-4 h-4" />
              Private Key (.key, .pem)
            </label>
            <input
              type="file"
              accept=".key,.pem"
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full text-sm text-gray-600
                        file:mr-4 file:py-3 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        cursor-pointer border border-gray-300 rounded-md
                        bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Load Button */}
          <Button
            variant="default"
            size="default"
            onClick={handleLoadPrivateKey}
            disabled={!privateKeyFile || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Load Private Key
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BirthRegistrationDetail;
