import { useState } from "react";

const tabs = {
  story: {
    label: "Story",
    content: [
      "We started with a simple promise — to make parcel delivery fast, reliable, and stress-free. What began as a small logistics idea quickly evolved into a modern delivery service designed around customer convenience.",
      "Over the years, we focused on building strong regional networks, improving delivery speed, and creating transparent tracking systems so customers always know where their parcels are.",
      "Today we proudly support individuals, businesses, and online stores with a delivery platform that connects people, products, and opportunities — always ensuring parcels arrive safely and on time.",
    ],
  },
  mission: {
    label: "Mission",
    content: [
      "Our mission is to simplify parcel delivery through smart logistics and reliable service. We aim to remove the stress of sending packages by offering clear tracking, dependable riders, and efficient delivery hubs.",
      "We believe delivery should be fast but also trustworthy. That is why we continuously invest in technology, training, and service quality.",
      "Every parcel we move represents trust from our customers, and our mission is to honor that trust with consistent and responsible delivery.",
    ],
  },
  success: {
    label: "Success",
    content: [
      "Success for us is measured by satisfied customers and dependable deliveries. Every successful shipment strengthens our commitment to improving the delivery experience.",
      "From supporting small businesses to helping individuals send important parcels, our platform has grown because of the trust people place in our service.",
      "As we expand, our success continues to be built on reliability, transparency, and strong partnerships with riders and service centers.",
    ],
  },
  team: {
    label: "Team & Others",
    content: [
      "Behind every successful delivery is a dedicated team. Our riders, warehouse teams, customer support staff, and operations managers work together to keep parcels moving smoothly.",
      "We believe teamwork is the foundation of great logistics. Every member of our team contributes to creating a dependable and efficient delivery system.",
      "Together with our service centers and delivery partners, we form a network committed to reliability, professionalism, and customer satisfaction.",
    ],
  },
};

const About = () => {
  const [activeTab, setActiveTab] = useState("story");

  return (
    <section className="px-4 py-6 md:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-3xl bg-base-100 p-6 shadow-sm md:p-10 lg:p-14">

        {/* Header */}
        <div className="max-w-4xl">
          <h1 className="text-3xl font-extrabold text-[#083c46] dark:text-base-content md:text-4xl lg:text-5xl">
            About Us
          </h1>

          <p className="mt-4 text-sm leading-7 text-base-content/60 md:text-base">
            Enjoy fast, reliable parcel delivery with real-time tracking and zero
            hassle. From personal packages to business shipments — we deliver on
            time, every time.
          </p>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-base-300"></div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-6 md:gap-8">
          {Object.entries(tabs).map(([key, tab]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`text-base transition-colors md:text-lg ${
                activeTab === key
                  ? "font-semibold text-lime-700 dark:text-lime-400"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-8 space-y-6">
          {tabs[activeTab].content.map((paragraph, index) => (
            <p
              key={index}
              className="text-sm leading-8 text-base-content/70 md:text-base"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;