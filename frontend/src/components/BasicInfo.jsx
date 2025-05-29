import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Banner from './Banner';
const CitizenForm = () => {
  const [formData, setFormData] = useState({
    hoVaTen: '',
    soCCCD: '',
    noiCapCCCD: '',
    ngayCapCCCD: '',
    ngaySinh: '',
    gioiTinh: 'Nam',
    queQuan: '',
    noiThuongTru: '',
  });

  const [selectedFiles, setSelectedFiles] = useState({
    hinhAnhCCCDTruoc: null,
    hinhAnhCCCDSau: null
  });
  
  const [previewUrls, setPreviewUrls] = useState({
    hinhAnhCCCDTruoc: '',
    hinhAnhCCCDSau: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      // Update selected file
      setSelectedFiles({
        ...selectedFiles,
        [name]: files[0]
      });
      
      // Create preview
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrls({
          ...previewUrls,
          [name]: fileReader.result
        });
      };
      fileReader.readAsDataURL(files[0]);
    }
  };

  const handleFormClick = (e) => {
    e.preventDefault();
    
    // Validate both images are selected
    if (!selectedFiles.hinhAnhCCCDTruoc || !selectedFiles.hinhAnhCCCDSau) {
      setSubmitStatus({
        type: 'error',
        message: 'Vui lòng tải lên cả hai mặt của CCCD',
      });
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const confirmSubmission = async (e) => {
    e.preventDefault();
    
    // Validate both images are selected
    if (!selectedFiles.hinhAnhCCCDTruoc || !selectedFiles.hinhAnhCCCDSau) {
      setSubmitStatus({
        type: 'error',
        message: 'Vui lòng tải lên cả hai mặt của CCCD',
      });
      return;
    }

    // Validate token is provided


    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Append both image files
      formDataToSend.append('hinhAnhCCCDTruoc', selectedFiles.hinhAnhCCCDTruoc);
      formDataToSend.append('hinhAnhCCCDSau', selectedFiles.hinhAnhCCCDSau);

      const response = await axios.post('/api/citizens', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmitStatus({
        type: 'success',
        message: 'Thông tin công dân đã được lưu thành công!',
      });
      
      // Reset form after successful submission
      setFormData({
        hoVaTen: '',
        soCCCD: '',
        noiCapCCCD: '',
        ngayCapCCCD: '',
        ngaySinh: '',
        gioiTinh: 'Nam',
        queQuan: '',
        noiThuongTru: '',
      });
      setSelectedFiles({
        hinhAnhCCCDTruoc: null,
        hinhAnhCCCDSau: null
      });
      setPreviewUrls({
        hinhAnhCCCDTruoc: '',
        hinhAnhCCCDSau: ''
      });
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        type: 'error',
        message: `Lỗi: ${error.response?.data?.msg || 'Không thể kết nối đến máy chủ'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Banner></Banner>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
            Cổng Thông Tin Dịch Vụ Công Dân
          </h1>
          
          {submitStatus.message && (
            <div 
              className={`mb-4 p-4 rounded-md ${
                submitStatus.type === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {submitStatus.message}
            </div>
          )}
          
          <form onSubmit={handleFormClick} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Họ và Tên */}
              <div>
                <label htmlFor="hoVaTen" className="block text-sm font-medium text-gray-700 mb-1">
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
              
              {/* Số CCCD */}
              <div>
                <label htmlFor="soCCCD" className="block text-sm font-medium text-gray-700 mb-1">
                  Số căn cước công dân (CCCD) <span className="text-red-500">*</span>
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
                <label htmlFor="noiCapCCCD" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="ngayCapCCCD" className="block text-sm font-medium text-gray-700 mb-1">
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
              
              {/* Ngày sinh */}
              <div>
                <label htmlFor="ngaySinh" className="block text-sm font-medium text-gray-700 mb-1">
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
              
              {/* Giới tính */}
              <div>
                <label htmlFor="gioiTinh" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="queQuan" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="noiThuongTru" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="hinhAnhCCCDTruoc" className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh CCCD - Mặt trước <span className="text-red-500">*</span>
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
                  <p className="text-sm text-gray-500 mb-1">Xem trước mặt trước:</p>
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
              <label htmlFor="hinhAnhCCCDSau" className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh CCCD - Mặt sau <span className="text-red-500">*</span>
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
                  <p className="text-sm text-gray-500 mb-1">Xem trước mặt sau:</p>
                  <img 
                    src={previewUrls.hinhAnhCCCDSau} 
                    alt="CCCD Mặt sau Preview" 
                    className="max-h-40 border rounded-md"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Gửi thông tin'}
              </button>
            </div>
          </form>
        </div>
      </div>
        {showConfirmation && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Xác nhận thông tin</h2>
              <p className="text-gray-700 mb-4">Vui lòng kiểm tra lại thông tin trước khi gửi.</p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li><strong>Họ và tên:</strong> {formData.hoVaTen}</li>
                <li><strong>Số CCCD:</strong> {formData.soCCCD}</li>
                <li><strong>Nơi cấp:</strong> {formData.noiCapCCCD}</li>
                <li><strong>Ngày cấp:</strong> {formData.ngayCapCCCD}</li>
                <li><strong>Ngày sinh:</strong> {formData.ngaySinh}</li>
                <li><strong>Giới tính:</strong> {formData.gioiTinh}</li>
                <li><strong>Quê quán:</strong> {formData.queQuan}</li>
                <li><strong>Nơi thường trú:</strong> {formData.noiThuongTru}</li>
              </ul>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Quay lại
                </button>
                <button
                  onClick={confirmSubmission}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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

export default CitizenForm;
