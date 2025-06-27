import trongDongImage from '../assets/trong_dong.jpg';

export default function Banner() {
  return (
    <div
      className="w-full h-32 bg-cover bg-center flex items-center"
      style={{ backgroundImage: `url(${trongDongImage})` }}
    >
      <div className="ml-4 text-red-600 text-3xl font-bold">
        <div>Cổng dịch vụ công trực tuyến</div>
        <div className='text-xl'>Cổng chính phủ</div>
      </div>

    </div>
  );
}