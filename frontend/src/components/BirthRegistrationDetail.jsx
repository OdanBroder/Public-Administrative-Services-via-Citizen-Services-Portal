import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const BirthRegistrationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signature, setSignature] = useState(null);
  const { api, role } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const [issuerSignature, setIssuerSignature] = useState(null);
  const [qrIssuerUrl, setQrIssuerUrl] = useState(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    if (signature) {
      const sigString = typeof signature === "string" ? signature : signature?.signature || "";
      QRCode.toDataURL(sigString)
        .then(url => setQrCodeUrl(url))
        .catch(err => setQrCodeUrl(null));
    }
  }, [signature]);

  useEffect(() => {
    if (issuerSignature) {
      const issuerSigString = typeof issuerSignature === "string" ? issuerSignature : issuerSignature?.signature || "";
      QRCode.toDataURL(issuerSigString)
        .then(url => setQrIssuerUrl(url))
        .catch(err => setQrIssuerUrl(null));
    }
  }, [issuerSignature]);

  useEffect(() => {
    fetchRegistrationDetails();
  }, [id]);

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    
    try {
      const element = pdfRef.current;
      
      // Use html2canvas to render the DOM node to a canvas
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });
      
      // Calculate width/height to fit A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`giay-khai-sinh-${registration?.id || ""}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Có lỗi xảy ra khi tạo PDF. Vui lòng thử lại.");
    }
  };

  const fetchRegistrationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/birth-registration/${id}`);
      const data = response.data;
      
      const response1 = await api.get(`/birth-registration/${id}/signature`);
      const signatureData = response1.data;
      
      // Try to fetch issuer signature if available
      try {
        const issuerResponse = await api.get(`/birth-registration/${id}/issuer-signature`);
        if (issuerResponse.data.success) {
          setIssuerSignature(issuerResponse.data.data);
        }
      } catch (issuerErr) {
        console.log("No issuer signature found");
      }

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
            <button
              onClick={handleExportPDF}
              className="mb-4 ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Xuất PDF
            </button>
          </div>
        </div>

        {/* Hidden PDF Content */}
        <div 
          ref={pdfRef} 
          className="fixed -left-[9999px] top-0 w-[794px] bg-white"
          style={{ 
            fontFamily: 'Times, "Times New Roman", serif',
            fontSize: '14px',
            lineHeight: '1.1',
            color: '#000'
          }}
        >
          {/* PDF Document Content */}
          <div className="p-12 min-h-[1123px] relative">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-sm font-bold mb-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="text-sm mb-4">Độc lập - Tự do - Hạnh phúc</div>
              <div className="text-right text-sm mb-8">Số: ___________</div>
              
              <div className="text-xl font-bold mb-8">GIẤY KHAI SINH</div>
            </div>

            {/* Form Content */}
            <div className="space-y-2 text-sm">
              {/* Person being registered */}
              <div className="flex">
                <span className="w-48">Họ, chữ đệm, tên:</span>
                <span className="flex-1 border-b border-black pb-1">{registration.registrantName}</span>
              </div>
              
              <div className="flex">
                <span className="w-48">Ngày, tháng, năm sinh:</span>
                <span className="flex-1 border-b border-black pb-1">{formatDate(registration.registrantDob)}</span>
              </div>
              
              <div className="flex">
                <span className="w-48"></span>
                <span className="flex-1 border-b border-black pb-1">bằng chữ: {registration.registrantDobInWords}</span>
              </div>
              
              <div className="flex">
                <span className="w-48">Giới tính:</span>
                <span className="w-32 border-b border-black pb-1">{registration.registrantGender === "male" ? "Nam" : "Nữ"}</span>
                <span className="w-24 ml-8">Dân tộc:</span>
                <span className="flex-1 border-b border-black pb-1">{registration.registrantEthnicity}</span>
              </div>
              
              <div className="flex">
                <span className="w-48">Nơi sinh:</span>
                <span className="flex-1 border-b border-black pb-1">{registration.registrantBirthPlace}</span>
              </div>
              
              <div className="flex">
                <span className="w-48">Quê quán:</span>
                <span className="flex-1 border-b border-black pb-1">{registration.registrantHometown}</span>
              </div>

              <div className="mt-4">
                <div className="flex">
                  <span className="w-48">Số định danh cá nhân:</span>
                  <span className="flex-1 border-b border-black pb-1"></span>
                </div>
              </div>

              {/* Mother information */}
              <div className="mt-4">
                <div className="flex">
                  <span className="w-48">Họ, chữ đệm, tên của người mẹ:</span>
                  <span className="flex-1 border-b border-black pb-1">{registration.motherName}</span>
                </div>
                
                <div className="flex mt-4">
                  <span className="w-48">Năm sinh:</span>
                  <span className="w-32 border-b border-black pb-1">{formatDate(registration.motherDob)?.split('/')[2] || ""}</span>
                  <span className="w-16 ml-2">Dân tộc:</span>
                  <span className="w-24 border-b border-black pb-1">{registration.motherEthnicity}</span>
                  <span className="w-16 ml-2">Quốc tịch:</span>
                  <span className="flex-1 border-b border-black pb-1">{registration.motherNationality}</span>
                </div>
                
                <div className="flex mt-4">
                  <span className="w-48">Nơi cư trú:</span>
                  <span className="flex-1 border-b border-black pb-1">{registration.motherAddress}</span>
                </div>
              </div>

              {/* Father information */}
              <div className="mt-4">
                <div className="flex">
                  <span className="w-48">Họ, chữ đệm, tên của người cha:</span>
                  <span className="flex-1 border-b border-black pb-1">{registration.fatherName}</span>
                </div>
                
                <div className="flex mt-4">
                  <span className="w-48">Năm sinh:</span>
                  <span className="w-32 border-b border-black pb-1">{formatDate(registration.fatherDob)?.split('/')[2] || ""}</span>
                  <span className="w-16 ml-2">Dân tộc:</span>
                  <span className="w-24 border-b border-black pb-1">{registration.fatherEthnicity}</span>
                  <span className="w-16 ml-2">Quốc tịch:</span>
                  <span className="flex-1 border-b border-black pb-1">{registration.fatherNationality}</span>
                </div>
                
                <div className="flex mt-4">
                  <span className="w-48">Nơi cư trú:</span>
                  <span className="flex-1 border-b border-black pb-1">{registration.fatherAddress}</span>
                </div>
              </div>

              {/* Applicant information */}
              <div className="mt-4">
                <div className="flex">
                  <span className="w-48">Họ, chữ đệm, tên của người khai sinh:</span>
                  <span className="flex-1 border-b border-black pb-1">{registration.applicantName}</span>
                </div>
                
                <div className="flex mt-4">
                  <span className="w-48">Giấy tờ tùy thân:</span>
                  <span className="flex-1 border-b border-black pb-1">CCCD số: {registration.applicantCccd}</span>
                </div>
              </div>

              {/* Registration details */}
              <div className="mt-4">
                <div className="flex">
                  <span className="w-48">Nơi đăng ký khai sinh:</span>
                  <span className="flex-1 border-b border-black pb-1"></span>
                </div>
                
                <div className="flex mt-4">
                  <span className="w-48">Ngày, tháng, năm đăng ký:</span>
                  <span className="flex-1 border-b border-black pb-1">{formatDate(registration.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Signature section */}
            <div className="absolute bottom-12 left-12 right-12">
              <div className="flex justify-between items-end">
                {/* Left side - Người thực hiện */}
                <div className="text-center">
                  <div className="font-bold mb-4">NGƯỜI THỰC HIỆN</div>
                  {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="QR code for signature" className="w-24 h-24 mx-auto" />
                  )}
                </div>

                {/* Right side - Người ký giấy khai sinh */}
                <div className="text-center">
                  <div className="font-bold mb-4">NGƯỜI KÝ GIẤY KHAI SINH</div>
                  {qrIssuerUrl && (
                    <img src={qrIssuerUrl} alt="QR code for issuer signature" className="w-24 h-24 mx-auto" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regular UI Content */}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Người thực hiện */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg flex flex-col items-center py-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
              Người thực hiện
            </h3>
            {signature && qrCodeUrl && (            
              <img src={qrCodeUrl} alt="QR code for signature" className="mb-2" />
            )}
          </div>
          {/* Người ký giấy khai sinh (issuer) */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg flex flex-col items-center py-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
              Người ký giấy khai sinh
            </h3>
              {issuerSignature && qrIssuerUrl && (            
              <img src={qrIssuerUrl} alt="QR code for signature" className="mb-2" />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BirthRegistrationDetail;

