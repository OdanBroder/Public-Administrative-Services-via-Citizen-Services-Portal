import { useState } from 'react';
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

const SelfSignedCertificate = () => {
    const [selectedFiles, setSelectedFiles] = useState({
        privateKey: null,
        publicKey: null
    });

    const [previewUrls, setPreviewUrls] = useState({
        privateKey: '',
        publicKey: ''
    });

    const [csrData, setCsrData] = useState(null);
    const [certificateData, setCertificateData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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

            // Use readAsText for .key files
            if (name === "privateKey" || name === "publicKey") {
                fileReader.readAsText(files[0]); // For .key files
            }
        }
    };

    const generateCSRAndCertificate = async () => {
        if (!previewUrls.privateKey || !previewUrls.publicKey) {
            setError('Vui lòng tải lên cả private key và public key');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // Convert PEM to Uint8Array
            const privateKey = convertPEMToDER(previewUrls.privateKey);
            const publicKey = convertPEMToDER(previewUrls.publicKey);
            console.log('Private Key:', privateKey);
            console.log('Public Key:', publicKey);

            // Subject information for the certificate
            const subjectInfo = ["C=VN", "L=Hanoi", "O=Bo Cong An", "CN=Police Officer"];

            // Generate CSR
            setSuccessMessage('Đang tạo CSR...');
            const csr = await Mldsa_wrapper.generateCSR(privateKey, publicKey, subjectInfo);
            setCsrData(csr);

            // Generate self-signed certificate
            setSuccessMessage('Đang tạo chứng chỉ tự ký...');
            const certificate = await Mldsa_wrapper.generateSelfSignedCertificate(privateKey, csr, 365);
            setCertificateData(certificate);

            setSuccessMessage('Chứng chỉ tự ký đã được tạo thành công!');
        } catch (err) {
            console.error('Error generating certificate:', err);
            setError(`Lỗi tạo chứng chỉ: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadCertificate = () => {
        if (!certificateData) {
            setError('Không có chứng chỉ để tải xuống');
            return;
        }

        try {
            const blob = new Blob([certificateData], { type: 'application/x-x509-ca-cert' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'self_signed_certificate.crt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSuccessMessage('Chứng chỉ đã được tải xuống thành công!');
        } catch (err) {
            setError(`Lỗi tải xuống: ${err.message}`);
        }
    };

    const downloadCSR = () => {
        if (!csrData) {
            setError('Không có CSR để tải xuống');
            return;
        }

        try {
            const blob = new Blob([csrData], { type: 'application/pkcs10' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'certificate_request.csr';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSuccessMessage('CSR đã được tải xuống thành công!');
        } catch (err) {
            setError(`Lỗi tải xuống CSR: ${err.message}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Tạo Chứng Chỉ Tự Ký</h2>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            </div>

            {/* Subject Information Display */}
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Thông tin chủ thể chứng chỉ:</h3>
                <ul className="text-sm text-gray-600">
                    <li><strong>Quốc gia (C):</strong> VN</li>
                    <li><strong>Thành phố (L):</strong> Hanoi</li>
                    <li><strong>Tổ chức (O):</strong> Bo Cong An</li>
                    <li><strong>Tên chung (CN):</strong> Police Officer</li>
                </ul>
            </div>

            {/* Generate Certificate Button */}
            <div className="mb-6">
                <button
                    onClick={generateCSRAndCertificate}
                    disabled={isLoading || !previewUrls.privateKey || !previewUrls.publicKey}
                    className={`w-full px-6 py-3 rounded-md font-semibold ${isLoading || !previewUrls.privateKey || !previewUrls.publicKey
                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } transition duration-200`}
                >
                    {isLoading ? 'Đang tạo chứng chỉ...' : 'Tạo CSR và Chứng Chỉ Tự Ký'}
                </button>
            </div>

            {/* Download Buttons */}
            {(csrData || certificateData) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {csrData && (
                        <button
                            onClick={downloadCSR}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition duration-200"
                        >
                            📄 Tải xuống CSR
                        </button>
                    )}

                    {certificateData && (
                        <button
                            onClick={downloadCertificate}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold transition duration-200"
                        >
                            🏆 Tải xuống Chứng Chỉ
                        </button>
                    )}
                </div>
            )}

            {/* Certificate Info */}
            {certificateData && (
                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Thông tin chứng chỉ:</h3>
                    <p className="text-sm text-blue-700">
                        <strong>Kích thước:</strong> {certificateData.length} bytes<br />
                        <strong>Loại:</strong> Chứng chỉ tự ký X.509<br />
                        <strong>Thời hạn:</strong> 365 ngày<br />
                        <strong>Thuật toán:</strong> ML-DSA-65
                    </p>
                </div>
            )}
        </div>
    );
};

export default SelfSignedCertificate;