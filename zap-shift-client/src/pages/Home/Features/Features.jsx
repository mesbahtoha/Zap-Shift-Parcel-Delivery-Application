import liveTracking from '../../../assets/illastrate/Transit.png';
import safeDelivery from '../../../assets/illastrate/man.png';
import callSupport from '../../../assets/illastrate/man.png';

const Features = () => {
    return (
        <div className="pb-12" data-aos="fade-right">
            <div className="max-w-6xl mx-auto px-5">

                {/* Top dashed line */}
                <div className="border-2 border-t border-dashed border-gray-300 mb-10" />

                {/* Feature 1 */}
                <div
                    className="
        flex flex-col md:flex-row items-start gap-6 mb-14 
        bg-white p-6 rounded-2xl 
        transition-all duration-300 
        hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1
      "
                >
                    <img
                        src={liveTracking}
                        alt="Live Parcel Tracking"
                        className="w-24 h-24 md:w-28 md:h-28 object-contain transition-transform duration-300 hover:scale-110"
                    />
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-1.5 h-10 bg-gray-400 rounded-full" />
                            <h3 className="text-2xl font-bold text-gray-800">
                                Live Parcel Tracking
                            </h3>
                        </div>
                        <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                            Stay updated in real-time with our live parcel tracking feature.
                            From pick-up to delivery, monitor your shipment's journey and get
                            instant status updates for complete peace of mind.
                        </p>
                    </div>
                </div>

                {/* Feature 2 */}
                <div
                    className="
        flex flex-col md:flex-row items-start gap-6 mb-14 
        bg-white p-6 rounded-2xl 
        transition-all duration-300 
        hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1
      "
                >
                    <img
                        src={safeDelivery}
                        alt="100% Safe Delivery"
                        className="w-24 h-24 md:w-28 md:h-28 object-contain transition-transform duration-300 hover:scale-110"
                    />
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-1.5 h-10 bg-gray-400 rounded-full" />
                            <h3 className="text-2xl font-bold text-gray-800">
                                100% Safe Delivery
                            </h3>
                        </div>
                        <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                            We ensure your parcels are handled with the utmost care and delivered
                            securely to their destination. Our reliable process guarantees safe
                            and damage-free delivery every time.
                        </p>
                    </div>
                </div>

                {/* Feature 3 */}
                <div
                    className="
        flex flex-col md:flex-row items-start gap-6 
        bg-white p-6 rounded-2xl 
        transition-all duration-300 
        hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1
      "
                >
                    <img
                        src={callSupport}
                        alt="24/7 Call Center Support"
                        className="w-24 h-24 md:w-28 md:h-28 object-contain transition-transform duration-300 hover:scale-110"
                    />
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-1.5 h-10 bg-gray-400 rounded-full" />
                            <h3 className="text-2xl font-bold text-gray-800">
                                24/7 Call Center Support
                            </h3>
                        </div>
                        <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                            Our dedicated support team is available around the clock to assist you
                            with any questions, updates, or concerns — anytime you need us.
                        </p>
                    </div>
                </div>

                {/* Bottom dashed line */}
                <div className="border-2 border-t border-dashed border-gray-300 mt-10" />

            </div>
        </div>
    );
};

export default Features;