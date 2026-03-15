// Services.jsx
import React from "react";
import {
  FaRocket,
  FaMapMarkedAlt,
  FaBoxOpen,
  FaMoneyBillWave,
  FaBuilding,
  FaUndoAlt,
} from "react-icons/fa";

const services = [
  {
    title: "Express & Standard Delivery",
    description:
      "We deliver parcels within 24–72 hours in Dhaka, Chittagong, Sylhet, Khulna, and Rajshahi. Express delivery available in Dhaka within 4–6 hours from pick-up to drop-off.",
    icon: <FaRocket className="text-4xl" />,
  },
  {
    title: "Nationwide Delivery",
    description:
      "We deliver parcels nationwide with home delivery in every district, ensuring your products reach customers within 48–72 hours.",
    icon: <FaMapMarkedAlt className="text-4xl" />,
  },
  {
    title: "Fulfillment Solution",
    description:
      "We also offer customized service with inventory management support, online order processing, packaging, and after sales support.",
    icon: <FaBoxOpen className="text-4xl" />,
  },
  {
    title: "Cash on Home Delivery",
    description:
      "100% cash on delivery anywhere in Bangladesh with guaranteed safety of your product.",
    icon: <FaMoneyBillWave className="text-4xl" />,
  },
  {
    title: "Corporate Service / Contract In Logistics",
    description:
      "Customized corporate services which includes warehouse and inventory management support.",
    icon: <FaBuilding className="text-4xl" />,
  },
  {
    title: "Parcel Return",
    description:
      "Through our reverse logistics facility we allow end customers to return or exchange their products with online business merchants.",
    icon: <FaUndoAlt className="text-4xl" />,
  },
];

export default function Services() {
  return (
    <section className="bg-[#03373D] py-16 md:py-24 rounded-2xl mb-5">
      <div className="container mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Our Services
          </h2>

          <p className="text-md text-gray-200 max-w-3xl mx-auto">
            Enjoy fast, reliable parcel delivery with real-time tracking and zero hassle.
            From personal packages to business shipments — we deliver on time, every time.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" data-aos="zoom-in">
          {services.map((service, index) => (
            <div
              key={index}
              className="
                card
                bg-base-100
                text-base-content
                shadow-lg
                hover:shadow-2xl
                transition-all duration-300
                border border-base-300
                group
                hover:-translate-y-[6px]
              "
            >
              <div className="card-body items-center text-center p-8 md:p-10">

                <div
                  className="
                    mb-6 p-6 rounded-2xl
                    transition-all duration-300
                    bg-base-200 text-primary
                    group-hover:bg-primary
                    group-hover:text-primary-content
                    group-hover:scale-110
                    group-hover:rotate-3
                  "
                >
                  {service.icon}
                </div>

                <h3 className="card-title text-xl md:text-2xl font-bold mb-3 group-hover:text-primary">
                  {service.title}
                </h3>

                <p className="text-base-content/70 group-hover:text-base-content leading-relaxed">
                  {service.description}
                </p>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}