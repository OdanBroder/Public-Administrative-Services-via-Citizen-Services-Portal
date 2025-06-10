import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import axios from 'axios';

const BCAPendingApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPendingApplications();
    }, []);

    const fetchPendingApplications = async () => {
        try {
            const response = await axios.get('/api/bca/applications/pending');
            if (response.data.success) {
                setApplications(response.data.data);
            } else {
                setError(response.data.message || 'Không thể tải danh sách đơn đăng ký');
            }
            setLoading(false);
        } catch (err) {
            setError('Không thể tải danh sách đơn đăng ký');
            setLoading(false);
        }
    };

    const handleViewDetails = (applicationId) => {
        navigate(`/bca/applications/${applicationId}`);
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'awaiting_signature':
                return 'Đang Chờ Ký';
            case 'pending':
                return 'Đang Chờ Xử Lý';
            case 'approved':
                return 'Đã Phê Duyệt';
            case 'rejected':
                return 'Đã Từ Chối';
            default:
                return status;
        }
    };

    if (loading) return <div className="text-center p-4">Đang tải...</div>;
    if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Danh Sách Đơn Đăng Ký Khai Sinh Đang Chờ</h1>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Đơn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Khai Sinh</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Sinh</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người Nộp Đơn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {applications.map((application) => (
                            <tr key={application.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">{application.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{application.registrant_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(application.date_of_birth).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {application.applicant_name ? `${application.applicant_name}` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        {getStatusText(application.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => handleViewDetails(application.id)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        Xem Chi Tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BCAPendingApplications; 