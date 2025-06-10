import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BCAApplicationDetail = () => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { applicationId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplicationDetails();
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      const response = await axios.get(`/api/bca/applications/${applicationId}`);
      if (response.data.success) {
        setApplication(response.data.data);
      } else {
        setError(response.data.message || 'Không thể tải thông tin đơn đăng ký');
      }
      setLoading(false);
    } catch (err) {
      setError('Không thể tải thông tin đơn đăng ký');
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await axios.post(`/api/bca/applications/${applicationId}/approve`);
      if (response.data.success) {
        navigate('/bca/applications/pending');
      } else {
        setError(response.data.message || 'Không thể phê duyệt đơn đăng ký');
      }
    } catch (err) {
      setError('Không thể phê duyệt đơn đăng ký');
    }
  };

  const handleReject = async () => {
    try {
      const response = await axios.post(`/api/bca/applications/${applicationId}/reject`);
      if (response.data.success) {
        navigate('/bca/applications/pending');
      } else {
        setError(response.data.message || 'Không thể từ chối đơn đăng ký');
      }
    } catch (err) {
      setError('Không thể từ chối đơn đăng ký');
    }
  };

  if (loading) return <div className="text-center p-4">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;
  if (!application) return <div className="text-center p-4">Không tìm thấy đơn đăng ký</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chi Tiết Đơn Đăng Ký Khai Sinh</h1>
        <button
          onClick={() => navigate('/bca/applications/pending')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Quay Lại Danh Sách
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Thông Tin Người Được Đăng Ký</h2>
            <div className="space-y-3">
              <p><span className="font-medium">Họ và tên:</span> {application.registrant_name}</p>
              <p><span className="font-medium">Ngày sinh:</span> {new Date(application.registrant_dob).toLocaleDateString()}</p>
              <p><span className="font-medium">Ngày sinh bằng chữ:</span> {application.registrant_dob_in_words}</p>
              <p><span className="font-medium">Giới tính:</span> {application.registrant_gender}</p>
              <p><span className="font-medium">Dân tộc:</span> {application.registrant_ethnicity}</p>
              <p><span className="font-medium">Quốc tịch:</span> {application.registrant_nationality}</p>
              <p><span className="font-medium">Nơi sinh:</span> {application.registrant_birth_place}</p>
              <p><span className="font-medium">Tỉnh/Thành phố:</span> {application.registrant_province}</p>
              <p><span className="font-medium">Quê quán:</span> {application.registrant_hometown}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Thông Tin Người Nộp Đơn</h2>
            <div className="space-y-3">
              <p><span className="font-medium">Họ và tên:</span> {application.applicant_name}</p>
              <p><span className="font-medium">Ngày sinh:</span> {new Date(application.applicant_dob).toLocaleDateString()}</p>
              <p><span className="font-medium">Số điện thoại:</span> {application.applicant_phone}</p>
              <p><span className="font-medium">Số CCCD:</span> {application.applicant_cccd}</p>
              <p><span className="font-medium">Ngày cấp CCCD:</span> {new Date(application.applicant_cccd_issue_date).toLocaleDateString()}</p>
              <p><span className="font-medium">Nơi cấp CCCD:</span> {application.applicant_cccd_issue_place}</p>
              <p><span className="font-medium">Địa chỉ:</span> {application.applicant_address}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Thông Tin Cha</h2>
            <div className="space-y-3">
              <p><span className="font-medium">Họ và tên:</span> {application.father_name}</p>
              <p><span className="font-medium">Ngày sinh:</span> {new Date(application.father_dob).toLocaleDateString()}</p>
              <p><span className="font-medium">Dân tộc:</span> {application.father_ethnicity}</p>
              <p><span className="font-medium">Quốc tịch:</span> {application.father_nationality}</p>
              <p><span className="font-medium">Loại cư trú:</span> {application.father_residence_type}</p>
              <p><span className="font-medium">Địa chỉ:</span> {application.father_address}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Thông Tin Mẹ</h2>
            <div className="space-y-3">
              <p><span className="font-medium">Họ và tên:</span> {application.mother_name}</p>
              <p><span className="font-medium">Ngày sinh:</span> {new Date(application.mother_dob).toLocaleDateString()}</p>
              <p><span className="font-medium">Dân tộc:</span> {application.mother_ethnicity}</p>
              <p><span className="font-medium">Quốc tịch:</span> {application.mother_nationality}</p>
              <p><span className="font-medium">Loại cư trú:</span> {application.mother_residence_type}</p>
              <p><span className="font-medium">Địa chỉ:</span> {application.mother_address}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Thông Tin Tài Khoản</h2>
          <div className="space-y-3">
            <p><span className="font-medium">Tên đăng nhập:</span> {application.applicant?.username || 'N/A'}</p>
            <p><span className="font-medium">Email:</span> {application.applicant?.email || 'N/A'}</p>
            <p><span className="font-medium">Họ và tên:</span> {application.applicant ? `${application.applicant.last_name} ${application.applicant.first_name}` : 'N/A'}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Thông Tin Khác</h2>
          <div className="space-y-3">
            <p><span className="font-medium">Trạng thái:</span> {application.status === 'awaiting_signature' ? 'Đang chờ ký' : application.status}</p>
            <p><span className="font-medium">Ngày tạo:</span> {new Date(application.created_at).toLocaleString()}</p>
            <p><span className="font-medium">Ngày cập nhật:</span> {new Date(application.updated_at).toLocaleString()}</p>
            {/* <p><span className="font-medium">Đường dẫn file:</span> {application.file_path}</p> */}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Từ Chối Đơn
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Phê Duyệt Đơn
          </button>
        </div>
      </div>
    </div>
  );
};

export default BCAApplicationDetail; 