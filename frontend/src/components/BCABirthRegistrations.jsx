import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import axios from 'axios';

const BCAPendingBirthRegistrations = () => {
    const { api } = useAuth();
    const [birthRegistrations, setBirthRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPendingBirthRegistrations();
    }, []);

    const fetchPendingBirthRegistrations = async () => {
        try {
            const response = await api.get('/bca/birthRegistrations');
            if (response.data.success) {
                setBirthRegistrations(response.data.data);
            } else {
                setError(response.data.message || 'Không thể tải danh sách đăng ký khai sinh');
            }
            setLoading(false);
        } catch (err) {
            setError('Không thể tải danh sách đăng ký khai sinh');
            setLoading(false);
        }
    };

    const handleViewDetails = (birthRegistrationId) => {
        navigate(`/bca/birth-registration/${birthRegistrationId}`);
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Lỗi: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            </div>
        );
    }

    if (birthRegistrations.length === 0) {
        return (
            <div className="text-center p-4">
                <h2 className="text-lg font-semibold">Không có đơn đăng ký khai sinh nào đang chờ xử lý</h2>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">Danh Sách Đăng Ký Khai Sinh Đang Chờ</h1>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Đăng Ký</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Khai Sinh</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Sinh</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Người Nộp Đơn</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {birthRegistrations.map((registration) => (
                            <tr key={registration.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-center whitespace-nowrap">{registration.id}</td>
                                <td className="px-6 py-3 text-center whitespace-nowrap">{registration.registrantName}</td>
                                <td className="px-6 py-3 text-center whitespace-nowrap">
                                    {new Date(registration.registrantDob).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-3 text-center whitespace-nowrap">
                                    {registration.applicant.username ? `${registration.applicant.username}` : 'N/A'}
                                </td>
                                <td className="px-6 py-3 text-center whitespace-nowrap">
                                    <span className={`px-3 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        registration.status === 'awaiting_signature' ? 'bg-yellow-100 text-yellow-800' :
                                        registration.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                        registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {getStatusText(registration.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-center whitespace-nowrap">
                                    <button
                                        onClick={() => handleViewDetails(registration.id)}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
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

export default BCAPendingBirthRegistrations;