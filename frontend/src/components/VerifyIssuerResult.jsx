import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Mldsa_wrapper from "../utils/crypto/MLDSAWrapper.js";
const labelClass = "font-semibold text-gray-700";
const valueClass = "text-gray-900";

const VerifyIssuerResult = () => {
  const { uuid } = useParams();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signatureData, setSignatureData] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [issuerCert, setIssuerCert] = useState(null);
  const [caCert, setCaCert] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [signatureVerified, setSignatureVerified] = useState(false);
  const [issuerCertificateInfo, setIssuerCertificateInfo] = useState(null);
  const [caCertificateInfo, setCaCertificateInfo] = useState(null);
  useEffect(() => {
    const fetchSignatureAndRegistration = async () => {
      await Mldsa_wrapper.initialize();
      setLoading(true);
      setError("");
      try {
        const sigRes = await api.get(`/qr/signature/issuer/${uuid}`);
        if (!sigRes.data || !sigRes.data.success) {
          setError("Không tìm thấy dữ liệu chữ ký.");
          setLoading(false);
          return;
        }
        setSignatureData(sigRes.data.signature);
        setIssuerCert(sigRes.data.cert);
        setCaCert(sigRes.data.caCert);

        if (!sigRes.data.birthRegId) {
          setError("Không tìm thấy mã đăng ký khai sinh trong dữ liệu chữ ký.");
          setLoading(false);
          return;
        }

        // const regRes = await api.get(`/birth-registration/${sigRes.data.birthRegId}`);
        // if (!regRes.data || !regRes.data.success) {
        //   setError("Không tìm thấy thông tin đăng ký khai sinh.");
        //   setLoading(false);
        //   return;
        // }
        // setRegistration(regRes.data.data);
      } catch (err) {
        setError("Lỗi truy vấn dữ liệu: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (uuid) fetchSignatureAndRegistration();
  }, [uuid, api]);

  const verifyCertIssuedByCA = async () => {
    const result = await Mldsa_wrapper.verifyCertificateIssuedByCA(
      issuerCert,
      caCert
    );
    setAuthenticated(result);
  };
  const verifySignature = async () => {
    if (!signatureData || !issuerCert) {
      setError("Dữ liệu chữ ký hoặc chứng chỉ không hợp lệ.");
      return;
    }
    try {
      const parsed = JSON.parse(signatureData);
      const message = parsed.message;
      const signatureBase64 = parsed.signature;
      const binaryString = atob(signatureBase64);
      const signature = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        signature[i] = binaryString.charCodeAt(i);
      }
      const result = await Mldsa_wrapper.verifyWithCertificate(
        issuerCert,
        signature,
        message
      );
      setSignatureVerified(result);
    } catch (err) {
      setError("Lỗi xác minh chữ ký: " + err.message);
    }
  };

  useEffect(() => {
    verifyCertIssuedByCA();
    verifySignature();
  }, [issuerCert, caCert, signatureData]);

  useEffect(() => {
    const setCertsInfo = async () => {
      await getIssuerCertificateInfo(issuerCert);
      await getCACertificateInfo(caCert);
    }
    setCertsInfo();
  }, [issuerCert, caCert]); 
  const handleDownload = (content, filename) => {
    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getIssuerCertificateInfo = async (cert) => {
    if (!cert) return "Chưa có thông tin chứng chỉ.";
    try {
      const certObj = await Mldsa_wrapper.extractSubjectInfoFromCert(cert);
      setIssuerCertificateInfo(certObj);
    }
    catch (err) {
      setError("Lỗi phân tích chứng chỉ: " + err.message);
      return "Lỗi phân tích chứng chỉ.";
    }
  }

  const getCACertificateInfo = async (cert) => {
    if (!cert) return "Chưa có thông tin chứng chỉ CA.";
    try {
      const certObj = await Mldsa_wrapper.extractSubjectInfoFromCert(cert);
      setCaCertificateInfo(certObj);
    }
    catch (err) {
      setError("Lỗi phân tích chứng chỉ CA: " + err.message);
      return "Lỗi phân tích chứng chỉ CA.";
    }
  }

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
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 bg-gray-50 min-h-screen">
      <div className="mx-auto w-full max-w-6xl bg-white p-0">
        <h1 className="text-2xl font-bold mb-4 text-blue-900 uppercase tracking-wide text-left">
          Kết Quả Xác Minh Chữ Ký Số (Cơ Quan Cấp)
        </h1>
        <hr className="mb-4" />
        {/* Authenticated status */}
        <div className="mb-2 text-left">
          <span className="font-semibold">Xác thực chứng chỉ người ký:&nbsp;</span>
          <span className={authenticated ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
            {authenticated ? "Đã xác thực (Certificate is valid and issued by CA)" : "Chưa xác thực"}
          </span>
        </div>
        {/* Signature verified status */}
        <div className="mb-4 text-left">
          <span className="font-semibold">Xác minh chữ ký:&nbsp;</span>
          <span className={signatureVerified ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
            {signatureVerified ? "Chữ ký hợp lệ (Signature is valid)" : "Chữ ký không hợp lệ"}
          </span>
        </div>
        {/* Issuer Certificate */}
        {issuerCert && (
          <div className="mb-4 text-left">
            <div className="flex items-center">
              <span className="font-semibold">Chứng chỉ người ký:</span>
              <button
                className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-md"
                onClick={() => handleDownload(issuerCert, "issuer-cert.pem")}
              >
                Tải xuống
              </button>
            </div>
            <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-x-auto max-h-40 text-left">{issuerCert}</pre>
            {/* Certificate Info Rendering */}
            <div className="mt-2">
              <span className="font-semibold">Thông tin chứng chỉ người ký:</span>
              {issuerCertificateInfo && typeof issuerCertificateInfo === "object" ? (
                <div className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-x-auto max-h-40 text-left border">
                  {Object.entries(issuerCertificateInfo).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-semibold">{key}: </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-x-auto max-h-40 text-left border">
                  {issuerCertificateInfo}
                </div>
              )}
            </div>
          </div>
        )}
        {/* CA Certificate */}
        {caCert && (
          <div className="mb-4 text-left">
            <div className="flex items-center">
              <span className="font-semibold">Chứng chỉ CA:</span>
              <button
                className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-md"
                onClick={() => handleDownload(caCert, "ca-cert.pem")}
              >
                Tải xuống
              </button>
            </div>
            <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-x-auto max-h-40 text-left">{caCert}</pre>
                      <div className="mt-2">
              <span className="font-semibold">Thông tin chứng chỉ người ký:</span>
              {caCertificateInfo && typeof caCertificateInfo === "object" ? (
                <div className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-x-auto max-h-40 text-left border">
                  {Object.entries(caCertificateInfo).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-semibold">{key}: </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-x-auto max-h-40 text-left border">
                  {caCertificateInfo}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Signature */}
        {signatureData && (
          <div className="mb-4 text-left">
            <div className="flex items-center">
              <span className="font-semibold">Chữ ký số:</span>
              <button
                className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-md"
                onClick={() => handleDownload(signatureData, "signature.json")}
              >
                Tải xuống
              </button>
            </div>
            <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-x-auto max-h-40 text-left">{signatureData}</pre>
          </div>
        )}
        {/* Registration Info */}
        {registration && (
          <section className="mb-4 text-left">
            <h2 className="text-lg font-semibold mb-2 text-blue-800">Thông Tin Đăng Ký Khai Sinh</h2>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <span className={labelClass}>Họ tên người nộp: </span>
                <span className={valueClass}>{registration.applicantName}</span>
              </div>
              <div>
                <span className={labelClass}>Ngày sinh người nộp: </span>
                <span className={valueClass}>{registration.applicantDob}</span>
              </div>
              <div>
                <span className={labelClass}>Người được khai sinh: </span>
                <span className={valueClass}>{registration.registrantName}</span>
              </div>
              <div>
                <span className={labelClass}>Ngày tạo đơn: </span>
                <span className={valueClass}>{registration.createdAt}</span>
              </div>
              {/* Add more fields as needed */}
            </div>
          </section>
        )}
        <hr className="my-6" />
        <div className="text-left text-gray-500 text-sm">
          <p>Đây là bản xác minh chữ ký số cho đơn đăng ký khai sinh (cơ quan cấp).</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyIssuerResult;
