import React, { useState } from 'react';
import { Upload, FileCheck, AlertCircle, CheckCircle2, X } from 'lucide-react';

const VerifySignature = () => {
    const [certificateSignature, setCertificateSignature] = useState(null);
    const [personSignature, setPersonSignature] = useState(null);
    const [certificatePreview, setCertificatePreview] = useState(null);
    const [personPreview, setPersonPreview] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCertificateUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCertificateSignature(file);
            const reader = new FileReader();
            reader.onload = (e) => setCertificatePreview(e.target.result);
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const handlePersonUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPersonSignature(file);
            const reader = new FileReader();
            reader.onload = (e) => setPersonPreview(e.target.result);
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const removeCertificateFile = () => {
        setCertificateSignature(null);
        setCertificatePreview(null);
    };

    const removePersonFile = () => {
        setPersonSignature(null);
        setPersonPreview(null);
    };

    const handleSubmit = async () => {
        setError('');
        setSuccessMessage('');

        if (!certificateSignature || !personSignature) {
            setError('Vui lòng tải lên cả hai tệp hình ảnh.');
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('certificateSignature', certificateSignature);
        formData.append('personSignature', personSignature);

        try {
            // Simulated API call - replace with actual API
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock response - replace with actual API call
            const mockSuccess = Math.random() > 0.3;

            if (mockSuccess) {
                setSuccessMessage('Xác minh thành công! Chữ ký khớp với nhau.');
            } else {
                setError('Xác minh thất bại. Chữ ký không khớp.');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi xác minh. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const FileUploadArea = ({
        label,
        file,
        preview,
        onUpload,
        onRemove,
        id,
        description
    }) => (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
                {label}
            </label>
            <p className="text-xs text-gray-500 mb-2">{description}</p>

            {!file ? (
                <div className="relative">
                    <input
                        type="file"
                        id={id}
                        accept="image/*"
                        onChange={onUpload}
                        className="hidden"
                    />
                    <label
                        htmlFor={id}
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all duration-200"
                    >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium">
                            Nhấp để tải lên
                        </span>
                        <span className="text-xs text-gray-500">
                            PNG, JPG, JPEG (tối đa 5MB)
                        </span>
                    </label>
                </div>
            ) : (
                <div className="relative bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                            <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <FileCheck className="w-6 h-6 text-green-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onRemove}
                            className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileCheck className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Xác minh Chữ ký
                    </h1>
                    <p className="text-gray-600">
                        Tải lên hai hình ảnh chữ ký để so sánh và xác minh
                    </p>
                </div>

                {/* Main Form */}
                <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <span className="text-red-800 text-sm">{error}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-4">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-green-800 text-sm">{successMessage}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Certificate Signature Upload */}
                        <FileUploadArea
                            label="Chữ ký trên chứng chỉ"
                            description="Tải lên hình ảnh chữ ký từ chứng chỉ gốc"
                            file={certificateSignature}
                            preview={certificatePreview}
                            onUpload={handleCertificateUpload}
                            onRemove={removeCertificateFile}
                            id="certificateSignature"
                        />

                        {/* Person Signature Upload */}
                        <FileUploadArea
                            label="Chữ ký của người ký"
                            description="Tải lên hình ảnh chữ ký cần xác minh"
                            file={personSignature}
                            preview={personPreview}
                            onUpload={handlePersonUpload}
                            onRemove={removePersonFile}
                            id="personSignature"
                        />

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!certificateSignature || !personSignature || isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Đang xử lý...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center space-x-2">
                                    <FileCheck className="w-5 h-5" />
                                    <span>Xác minh chữ ký</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-xs text-gray-500">
                        Hệ thống xác minh chữ ký
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifySignature;