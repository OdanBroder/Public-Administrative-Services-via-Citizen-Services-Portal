// src/components/Banner.jsx
export default function Banner() {
  return (
    <div
      className="w-full h-32 bg-cover bg-center flex items-center"
      style={{
        backgroundImage: `url('https://gitiho.com/caches/p_medium_large//uploads/338054/images/image_32-hinh-nen-powerpoint-trong-dong.jpg')`,
      }}
    >
      <div className="ml-4 text-red-600 text-3xl font-bold">
        Cổng dịch vụ công trực tuyến
      </div>
    </div>
  );
}
