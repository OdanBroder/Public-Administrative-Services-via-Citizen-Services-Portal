import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Mldsa_wrapper from '../utils/crypto/MLDSAWrapper.js';

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

const Profile = () => {
  const { api } = useAuth();
  const [formData, setFormData] = useState({
    hoVaTen: "",
    soCCCD: "",
    noiCapCCCD: "",
    ngayCapCCCD: "",
    ngaySinh: "",
    gioiTinh: "Nam",
    queQuan: "",
    noiThuongTru: "",
  });

  const [selectedFiles, setSelectedFiles] = useState({
    hinhAnhCCCDTruoc: null,
    hinhAnhCCCDSau: null,
    privateKey: null,
    publicKey: null,
  });

  const [previewUrls, setPreviewUrls] = useState({
    hinhAnhCCCDTruoc: "",
    hinhAnhCCCDSau: "",
    privateKey: "",
    publicKey: "",
  });
  const initializeMldsa = async () => {
    await Mldsa_wrapper.initialize();
  };
  useEffect( () => {initializeMldsa()}, []);

  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const renderListItem = (label, value) => (
    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-gray-200 last:border-b-0">
      <dt className="text-sm font-medium text-gray-600">{label}:</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        {value || <span className="text-gray-400 italic">Chưa cung cấp</span>}
      </dd>
    </div>
  );

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setSelectedFiles({
        ...selectedFiles,
        [name]: files[0],
      });

      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrls({
          ...previewUrls,
          [name]: fileReader.result, // Store the file content
        });
      };

      // Use readAsText for .key files and readAsDataURL for images
      if (name === "hinhAnhCCCDTruoc" || name === "hinhAnhCCCDSau") {
        fileReader.readAsDataURL(files[0]); // For image files
      } else if (name === "privateKey" || name === "publicKey") {
        fileReader.readAsText(files[0]); // For .key files
      }
    }
  };

  const confirmSubmission = async (e) => {
    e.preventDefault();

    // Validate both images and keys are selected
    if (!selectedFiles.hinhAnhCCCDTruoc || !selectedFiles.hinhAnhCCCDSau) {
      setSubmitStatus({
        type: "error",
        message: "Vui lòng tải lên cả hai mặt của CCCD",
      });
      return;
    }

    if (!previewUrls.privateKey || !previewUrls.publicKey) {
      setSubmitStatus({
        type: "error",
        message: "Vui lòng tải lên cả Private Key và Public Key",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: "", message: "" });

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Convert PEM to Uint8Array
      const privateKey = convertPEMToDER(previewUrls.privateKey);
      const publicKey = convertPEMToDER(previewUrls.publicKey);

      // Prepare subject information
      const subjectInfo = ["C=VN", `L=${formData.noiThuongTru}`, `CN=${formData.hoVaTen}`];

      // Generate CSR using Uint8Array keys and subjectInfo
      const csrGenerated = await Mldsa_wrapper.generateCSR(privateKey, publicKey, subjectInfo);
      if (!csrGenerated) {
        throw new Error("Failed to generate CSR");
      }
      
      // Create a proper File object for CSR with text content
      const csrFile = new File([csrGenerated], 'request.csr', {
        type: 'text/plain'
      });
      formDataToSend.append("csr", csrFile);

      // Append both image files
      formDataToSend.append("hinhAnhCCCDTruoc", selectedFiles.hinhAnhCCCDTruoc);
      formDataToSend.append("hinhAnhCCCDSau", selectedFiles.hinhAnhCCCDSau);

      const response = await api.post("/citizen", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.msg || "Lỗi không xác định");
      }

      setSubmitStatus({
        type: "success",
        message: "Thông tin công dân đã được lưu thành công!",
      });

      setShowConfirmation(false);

      // Reset form after successful submission
      setFormData({
        hoVaTen: "",
        soCCCD: "",
        noiCapCCCD: "",
        ngayCapCCCD: "",
        ngaySinh: "",
        gioiTinh: "Nam",
        queQuan: "",
        noiThuongTru: "",
      });
      setSelectedFiles({
        hinhAnhCCCDTruoc: null,
        hinhAnhCCCDSau: null,
        privateKey: null,
        publicKey: null,
      });
      setPreviewUrls({
        hinhAnhCCCDTruoc: "",
        hinhAnhCCCDSau: "",
        privateKey: "",
        publicKey: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus({
        type: "error",
        message: `Lỗi: ${error.response?.data?.msg || "Không thể kết nối đến máy chủ"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-h-full">
      <div className="min-h-screen bg-gray-50 py-8 flex item-center justify-center">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
            Cổng Thông Tin Dịch Vụ Công Dân
          </h1>
          <p className="text-md"> Vui lòng điền thông tin trước khi tiếp tục</p>

          {submitStatus.message && (
            <div
              className={`mb-4 p-4 rounded-md ${submitStatus.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
                }`}
            >
              {submitStatus.message}
            </div>
          )}

          <form onSubmit={confirmSubmission} className="space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Họ và Tên */}
              <div>
                <label
                  htmlFor="hoVaTen"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Họ và Tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="hoVaTen"
                  name="hoVaTen"
                  value={formData.hoVaTen}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ngày sinh */}
              <div>
                <label
                  htmlFor="ngaySinh"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Ngày sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="ngaySinh"
                  name="ngaySinh"
                  value={formData.ngaySinh}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Số CCCD */}
              <div>
                <label
                  htmlFor="soCCCD"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Số căn cước công dân (CCCD){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="soCCCD"
                  name="soCCCD"
                  value={formData.soCCCD}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Nơi cấp CCCD */}
              <div>
                <label
                  htmlFor="noiCapCCCD"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nơi cấp CCCD <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="noiCapCCCD"
                  name="noiCapCCCD"
                  value={formData.noiCapCCCD}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ngày cấp CCCD */}
              <div>
                <label
                  htmlFor="ngayCapCCCD"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Ngày cấp CCCD <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="ngayCapCCCD"
                  name="ngayCapCCCD"
                  value={formData.ngayCapCCCD}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>


              {/* Giới tính */}
              <div>
                <label
                  htmlFor="gioiTinh"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Giới tính <span className="text-red-500">*</span>
                </label>
                <select
                  id="gioiTinh"
                  name="gioiTinh"
                  value={formData.gioiTinh}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              {/* Quê quán */}
              <div>
                <label
                  htmlFor="queQuan"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quê quán <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="queQuan"
                  name="queQuan"
                  value={formData.queQuan}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Nơi thường trú */}
              <div>
                <label
                  htmlFor="noiThuongTru"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nơi thường trú <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="noiThuongTru"
                  name="noiThuongTru"
                  value={formData.noiThuongTru}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Hình ảnh CCCD - Mặt trước */}
            <div>
              <label
                htmlFor="hinhAnhCCCDTruoc"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Hình ảnh CCCD - Mặt trước{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="hinhAnhCCCDTruoc"
                name="hinhAnhCCCDTruoc"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {previewUrls.hinhAnhCCCDTruoc && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">
                    Xem trước mặt trước:
                  </p>
                  <img
                    src={previewUrls.hinhAnhCCCDTruoc}
                    alt="CCCD Mặt trước Preview"
                    className="max-h-40 border rounded-md"
                  />
                </div>
              )}
            </div>

            {/* Hình ảnh CCCD - Mặt sau */}
            <div>
              <label
                htmlFor="hinhAnhCCCDSau"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Hình ảnh CCCD - Mặt sau{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="hinhAnhCCCDSau"
                name="hinhAnhCCCDSau"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {previewUrls.hinhAnhCCCDSau && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">
                    Xem trước mặt sau:
                  </p>
                  <img
                    src={previewUrls.hinhAnhCCCDSau}
                    alt="CCCD Mặt sau Preview"
                    className="max-h-40 border rounded-md"
                  />
                </div>
              )}
            </div>

            {/* Load Private Key */}
            <div className="mb-4">
              <label
                htmlFor="privateKey"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tải lên Private Key:
              </label>
              <input
                type="file"
                id="privateKey"
                name="privateKey"
                accept=".key"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {previewUrls.privateKey && (
                <textarea
                  readOnly
                  value={previewUrls.privateKey}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono resize-none"
                  rows={6}
                ></textarea>
              )}
            </div>

            {/* Load Public Key */}
            <div className="mb-4">
              <label
                htmlFor="publicKey"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tải lên Public Key:
              </label>
              <input
                type="file"
                id="publicKey"
                name="publicKey"
                accept=".key"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {previewUrls.publicKey && (
                <textarea
                  readOnly
                  value={previewUrls.publicKey}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono resize-none"
                  rows={6}
                ></textarea>
              )}
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
              >
                {isSubmitting ? "Đang xử lý..." : "Gửi thông tin"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {showConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full transform transition-all duration-300 ease-out scale-95">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Xác nhận thông tin
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Vui lòng kiểm tra kỹ các thông tin dưới đây trước khi gửi.
              </p>
            </div>

            {/* Data List with improved structure for readability */}
            <div className="border-t border-b border-gray-200 divide-y divide-gray-200 mb-6">
              <dl className="divide-y divide-gray-200">
                {renderListItem("Họ và tên", formData.hoVaTen)}
                {renderListItem("Số CCCD", formData.soCCCD)}
                {renderListItem("Nơi cấp", formData.noiCapCCCD)}
                {renderListItem("Ngày cấp", formData.ngayCapCCCD)}
                {renderListItem("Ngày sinh", formData.ngaySinh)}
                {renderListItem("Giới tính", formData.gioiTinh)}
                {renderListItem("Quê quán", formData.queQuan)}
                {renderListItem("Nơi thường trú", formData.noiThuongTru)}
              </dl>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={confirmSubmission}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Xác nhận & Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

