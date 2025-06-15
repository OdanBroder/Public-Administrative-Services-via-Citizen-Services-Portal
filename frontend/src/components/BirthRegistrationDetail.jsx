import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QRCode from "qrcode";
import pako from "pako";

const BirthRegistrationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signature, setSignature] = useState(null);
  const { api, role } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    if (signature) {
      // Prepare the string to compress
      const sigString = typeof signature === "string" ? signature : signature?.signature || "";
      // Compress and encode to base64
      try {
        const compressed = pako.deflate(sigString, { to: 'string' });
        const compressedBase64 = btoa(
          typeof compressed === "string"
            ? compressed
            : String.fromCharCode(...compressed)
        );        
        console.log(compressed);
        console.log("Compressed Base64 Signature:", compressedBase64.length, sigString.length, compressed.length);
        QRCode.toDataURL(compressedBase64)
          .then(url => setQrCodeUrl(url))
          .catch(err => {
            setQrCodeUrl(null);
            setError(`Failed to generate QR code: ${err.message}`);
          });
      } catch (err) {
        setQrCodeUrl(null);
        setError(`Compression failed: ${err.message}`);
      }
    }
  }, [signature]);

  useEffect(() => {
    fetchRegistrationDetails();
  }, [id]);

  const fetchRegistrationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/birth-registration/${id}`);

      const data = response.data;
      const response1 = await api.get(`/birth-registration/${id}/signature`);
      const signatureData = response1.data;
      // console.log("Signature Data:", signatureData.data);
      if (data.success || response1.data.success) {
        setRegistration(data.data);
        setSignature(signatureData.data);
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
        {signature && qrCodeUrl && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg flex flex-col items-center py-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
              Chữ ký số
            </h3>
            <img src={qrCodeUrl} alt="QR code for signature" className="mb-2" ref={qrCanvasRef} />
            <div className="text-xs break-all text-gray-500 max-w-xs text-center">
              {typeof signature === "string" ? signature : signature?.signature}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BirthRegistrationDetail;