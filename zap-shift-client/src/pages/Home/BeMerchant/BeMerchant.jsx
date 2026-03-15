// MerchantBanner.jsx
import merchantIllustration from '../../../assets/location-merchant.png';
import logo from '../../../assets/be-a-merchant-bg.png'
import { Link } from 'react-router';

const BeMerchant = () => {
  return (
    <div
      className={`
    relative overflow-hidden 
    bg-gradient-to-br from-[#0f2c2a] to-[#0a3d2e] 
    rounded-2xl mx-4 mt-5 mb-10 md:mx-0
    h-[450px] md:h-[460px] lg:h-[480px]
    flex items-center justify-center
  `}
      data-aos="fade-down"
      style={{
        backgroundImage: `
      url(${logo}),
      linear-gradient(to bottom right, #0f2c2a, #0a3d2e)
    `,
        backgroundRepeat: "no-repeat, no-repeat",
      }}
    >

      {/* Glow overlays */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      {/* Main content – side by side on md+ */}
      <div className="
    relative z-10 
    w-full max-w-6xl mx-auto 
    px-6 md:px-10 lg:px-12 
    h-full
    flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 lg:gap-16
  ">

        {/* Left – Text */}
        <div className="text-center md:text-left w-full md:w-1/2 lg:w-5/12 flex flex-col justify-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-4 md:mb-6">
            Merchant and Customer Satisfaction
            <br />
            <span className="text-teal-300">is Our First Priority</span>
          </h2>

          <p className="text-base md:text-lg text-gray-200/90 mb-6 md:mb-8 leading-relaxed">
            We offer lowest delivery charge with the highest value along with
            <span className="font-semibold text-white"> 100% safety</span> of your product.
            Profast Courier delivers your parcels in every corner of Bangladesh right on time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">


            <button className="
          border-2 border-teal-400/70 text-teal-300 hover:text-white 
          hover:border-teal-300 
          font-semibold px-7 py-3.5 rounded-full 
          text-base md:text-lg 
          transition-all duration-300 
          hover:bg-teal-500/10 
        ">
              Become a Merchant
            </button>

            <div>
              <button className="
          bg-lime-500 hover:bg-lime-600 
          text-gray-900 font-semibold 
          px-7 py-3.5 rounded-full 
          text-base md:text-lg 
          transition-all duration-300 
          shadow-lg hover:shadow-xl hover:scale-105
        ">

                Earn with Profast Courier
              </button>
            </div>

          </div>
        </div>

        {/* Right – Illustration */}
        <div className="w-full md:w-1/2 lg:w-7/12 flex justify-center md:justify-end">
          <img
            src={merchantIllustration}
            alt="Delivery illustration"
            className="
          max-h-[260px] md:max-h-[320px] lg:max-h-[360px] 
          w-auto object-contain 
          drop-shadow-2xl 
          transition-transform duration-400 
          hover:scale-105
        "
          />
        </div>

      </div>
    </div>
  )
};

export default BeMerchant;