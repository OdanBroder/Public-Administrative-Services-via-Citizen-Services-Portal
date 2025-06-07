import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Assuming you have an AuthContext for API calls
const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {api, user} = useAuth(); // Assuming useAuth provides api instance
  // Fetch all offices for filter dropdown
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await api.get('/services/offices');
        if (response.data.success) {
          setOffices(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching offices:', err);
        setError('Không thể tải danh sách văn phòng');
      }
    };

    fetchOffices();
  }, []);

  // Fetch services with optional office filter
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        let url = '/services';
        if (selectedOffice) {
          url += `?officeId=${selectedOffice}`;
        }
        
        const response = await api.get(url);
        if (response.data.success) {
          setServices(response.data.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Không thể tải danh sách dịch vụ');
        setLoading(false);
      }
    };

    fetchServices();
  }, [selectedOffice]);

  // Handle office filter change
  const handleOfficeChange = (e) => {
    setSelectedOffice(e.target.value);
  };

  // Reset filter
  const handleResetFilter = () => {
    setSelectedOffice('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl w-[80%] mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
          Danh sách dịch vụ
        </h1>

        {/* Filter Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Bộ lọc</h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="officeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Văn phòng
              </label>
              <select
                id="officeFilter"
                value={selectedOffice}
                onChange={handleOfficeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả văn phòng</option>
                {offices.map(office => (
                  <option key={office.id} value={office.id}>
                    {office.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleResetFilter}
              className="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Đặt lại
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          /* Services List */
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            {services.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Tên dịch vụ
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Mô tả
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Cơ quan 
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Đăng kí
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {services.map(service => (
                    <tr key={service.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {service.name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {service.description || 'Không có mô tả'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {service.office?.name || 'Không xác định'}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <a href="/ubnd/dang-ky-khai-sinh">
                        <button className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          service.application_url === null || service.application_url === '' 
                            ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.application_url === null || service.application_url === '' 
                            ? 'Chưa thực hiện' 
                            : 'Đăng ký'}
                        </button>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy dịch vụ nào
                {selectedOffice && ' cho văn phòng đã chọn'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceList;