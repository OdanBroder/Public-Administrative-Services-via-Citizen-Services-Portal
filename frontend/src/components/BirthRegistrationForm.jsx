import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
const BirthRegistrationForm = () => {
  const { user, api, role } = useAuth();
  const [confirm, setConfirm] = useState(false);
  // State for form data with all four sections
  const [formData, setFormData] = useState({
    // Applicant Information
    applicantId: "",
    applicantName: "",
    applicantDob: "",
    applicantPhone: "",
    applicantCccd: "",
    applicantCccdIssueDate: "",
    applicantCccdIssuePlace: "",
    applicantAddress: "",

    // Birth Registrant Information
    registrantName: "",
    registrantGender: "Nam",
    registrantEthnicity: "",
    registrantNationality: "Việt Nam",
    registrantDob: "",
    registrantDobInWords: "",
    registrantBirthPlace: "",
    registrantProvince: "",
    registrantHometown: "",

    // Father Information
    fatherName: "",
    fatherDob: "",
    fatherEthnicity: "",
    fatherNationality: "Việt Nam",
    fatherResidenceType: "thường trú",
    fatherAddress: "",

    // Mother Information
    motherName: "",
    motherDob: "",
    motherEthnicity: "",
    motherNationality: "Việt Nam",
    motherResidenceType: "thường trú",
    motherAddress: "",
  });

  // State for citizen ID input (for auto-fill)
  const [citizenId, setCitizenId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    fetchCitizenData(user.id);

  }, [])
  // Handle input change for all form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle citizen ID input change
  const handleCitizenIdChange = (e) => {
    setCitizenId(e.target.value);
  };

  // Fetch citizen data for auto-fill
  const fetchCitizenData = async (cID) => {
    if (!cID) {
      setSubmitStatus({
        type: "error",
        message: "Vui lòng nhập ID công dân",
      });
      return;
    }

    setIsLoading(true);
    setSubmitStatus({ type: "", message: "" });

    try {
      const response = await api.get(`/citizen/${cID}`);

      if (response.data.success) {
        const citizen = response.data.data;

        // Auto-fill applicant information
        setFormData({
          ...formData,
          applicantId: citizen.id,
          applicantName: citizen.hoVaTen || "",
          applicantDob: citizen.ngaySinh || "",
          applicantCccd: citizen.soCCCD || "",
          applicantCccdIssueDate: citizen.ngayCapCCCD || "",
          applicantCccdIssuePlace: citizen.noiCapCCCD || "",
          applicantAddress: citizen.noiThuongTru || "",
        });

        setSubmitStatus({
          type: "success",
          message: "Đã tải thông tin công dân thành công",
        });
      }
    } catch (error) {
      console.error("Error fetching citizen data:", error);
      setSubmitStatus({
        type: "error",
        message: `Lỗi: ${
          error.response?.data?.message || "Không thể tải thông tin công dân"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy applicant information to father
  const copyToFather = () => {
    setFormData({
      ...formData,
      fatherName: formData.applicantName,
      fatherDob: formData.applicantDob,
      fatherAddress: formData.applicantAddress,
    });
  };

  // Copy applicant information to mother
  const copyToMother = () => {
    setFormData({
      ...formData,
      motherName: formData.applicantName,
      motherDob: formData.applicantDob,
      motherAddress: formData.applicantAddress,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setSubmitStatus({ type: "", message: "" });

    try {
      const response = await api.post("/birth-registration", formData);

      if (response.data.success) {
        setSubmitStatus({
          type: "success",
          message: "Đăng ký khai sinh thành công",
        });

        // Reset form after successful submission
        setFormData({
          applicantId: "",
          applicantName: "",
          applicantDob: "",
          applicantPhone: "",
          applicantCccd: "",
          applicantCccdIssueDate: "",
          applicantCccdIssuePlace: "",
          applicantAddress: "",

          registrantName: "",
          registrantGender: "Nam",
          registrantEthnicity: "",
          registrantNationality: "Việt Nam",
          registrantDob: "",
          registrantDobInWords: "",
          registrantBirthPlace: "",
          registrantProvince: "",
          registrantHometown: "",

          fatherName: "",
          fatherDob: "",
          fatherEthnicity: "",
          fatherNationality: "Việt Nam",
          fatherResidenceType: "thường trú",
          fatherAddress: "",

          motherName: "",
          motherDob: "",
          motherEthnicity: "",
          motherNationality: "Việt Nam",
          motherResidenceType: "thường trú",
          motherAddress: "",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus({
        type: "error",
        message: `Lỗi: ${
          error.response?.data?.message || "Không thể gửi đơn đăng ký"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="flex items-center justify-center w-h-full">
      <div className="min-h-screen w-[82%] bg-gray-50 py-8">
        <div className="max-w-4xl  mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
            Dịch vụ: đăng kí khai sinh
          </h1>

          {submitStatus.message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                submitStatus.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {submitStatus.message}
            </div>
          )}



          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Applicant Information */}
            <div className="border border-gray-200 rounded-md p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Thông tin người nộp
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="applicantName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="applicantName"
                    name="applicantName"
                    value={formData.applicantName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="applicantDob"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="applicantDob"
                    name="applicantDob"
                    value={formData.applicantDob}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="applicantPhone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="applicantPhone"
                    name="applicantPhone"
                    value={formData.applicantPhone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="applicantCccd"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Số căn cước công dân <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="applicantCccd"
                    name="applicantCccd"
                    value={formData.applicantCccd}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="applicantCccdIssueDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ngày cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="applicantCccdIssueDate"
                    name="applicantCccdIssueDate"
                    value={formData.applicantCccdIssueDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="applicantCccdIssuePlace"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nơi cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="applicantCccdIssuePlace"
                    name="applicantCccdIssuePlace"
                    value={formData.applicantCccdIssuePlace}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="applicantAddress"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nơi thường trú <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="applicantAddress"
                    name="applicantAddress"
                    value={formData.applicantAddress}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Birth Registrant Information */}
            <div className="border border-gray-200 rounded-md p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Thông tin người được khai sinh
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="registrantName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registrantName"
                    name="registrantName"
                    value={formData.registrantName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="registrantGender"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="registrantGender"
                    name="registrantGender"
                    value={formData.registrantGender}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="registrantEthnicity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Dân tộc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registrantEthnicity"
                    name="registrantEthnicity"
                    value={formData.registrantEthnicity}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="registrantNationality"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quốc tịch <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registrantNationality"
                    name="registrantNationality"
                    value={formData.registrantNationality}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="registrantDob"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="registrantDob"
                    name="registrantDob"
                    value={formData.registrantDob}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="registrantDobInWords"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ngày tháng năm sinh ghi bằng chữ{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registrantDobInWords"
                    name="registrantDobInWords"
                    value={formData.registrantDobInWords}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="registrantBirthPlace"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nơi sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registrantBirthPlace"
                    name="registrantBirthPlace"
                    value={formData.registrantBirthPlace}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="registrantProvince"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registrantProvince"
                    name="registrantProvince"
                    value={formData.registrantProvince}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="registrantHometown"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quê quán <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registrantHometown"
                    name="registrantHometown"
                    value={formData.registrantHometown}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Father Information */}
            <div className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Thông tin cha
                </h2>
                <button
                  type="button"
                  onClick={copyToFather}
                  className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Sao chép thông tin từ người nộp
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fatherName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fatherName"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fatherDob"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="fatherDob"
                    name="fatherDob"
                    value={formData.fatherDob}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fatherEthnicity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Dân tộc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fatherEthnicity"
                    name="fatherEthnicity"
                    value={formData.fatherEthnicity}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fatherNationality"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quốc tịch <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fatherNationality"
                    name="fatherNationality"
                    value={formData.fatherNationality}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fatherResidenceType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Loại cư trú <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="fatherResidenceType"
                    name="fatherResidenceType"
                    value={formData.fatherResidenceType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="thường trú">Thường trú</option>
                    <option value="tạm trú">Tạm trú</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="fatherAddress"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Địa chỉ cư trú <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fatherAddress"
                    name="fatherAddress"
                    value={formData.fatherAddress}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Mother Information */}
            <div className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Thông tin mẹ
                </h2>
                <button
                  type="button"
                  onClick={copyToMother}
                  className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Sao chép thông tin từ người nộp
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="motherName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="motherName"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="motherDob"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="motherDob"
                    name="motherDob"
                    value={formData.motherDob}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="motherEthnicity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Dân tộc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="motherEthnicity"
                    name="motherEthnicity"
                    value={formData.motherEthnicity}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="motherNationality"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quốc tịch <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="motherNationality"
                    name="motherNationality"
                    value={formData.motherNationality}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="motherResidenceType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Loại cư trú <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="motherResidenceType"
                    name="motherResidenceType"
                    value={formData.motherResidenceType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="thường trú">Thường trú</option>
                    <option value="tạm trú">Tạm trú</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="motherAddress"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Địa chỉ cư trú <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="motherAddress"
                    name="motherAddress"
                    value={formData.motherAddress}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-start"> 
              <input type="checkbox" name="confirm" id="confirm" onChange={(e) => setConfirm(e.target.checked)}/>
              <label
                htmlFor="confirm"
                className="inline-flex items-center text-md text-gray-700 mb-2"
              >
                Tôi xác nhận thông tin trên là đúng sự thật và chịu trách nhiệm về thông tin đã cung cấp.
              </label>
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading || !confirm}
                className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isLoading ? "bg-blue-600/60 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Đang xử lý..." : "Gửi đơn đăng ký khai sinh"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default BirthRegistrationForm;
