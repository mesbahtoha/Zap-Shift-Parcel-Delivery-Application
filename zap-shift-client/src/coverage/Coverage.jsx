import { useState } from "react";
import { useLoaderData } from "react-router";
import BangladeshMap from "./BangladeshMap";

const Coverage = () => {
  const serviceCenters = useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const handleSearch = () => {
    const match = serviceCenters.find(d =>
      d.district.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (match) {
      setSelectedDistrict(match);
    } else {
      alert("District not found!");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 md:p-12 max-w-11/12 mx-auto my-5">

      {/* Header */}
      <h2 className="text-3xl sm:text-4xl font-bold text-[#0f2a2a] tracking-tight text-center sm:text-left">
        We are available in 64 districts
      </h2>

      {/* Search Bar */}
      <div className="mt-6 sm:mt-10 flex justify-center sm:justify-start">
        <div className="flex w-full max-w-md bg-white border border-gray-300 rounded-full overflow-hidden shadow-sm focus-within:border-lime-400 focus-within:ring-2 focus-within:ring-lime-200 transition-all">
          
          <div className="flex-1 flex items-center pl-4 sm:pl-6 gap-2 sm:gap-3">
            <span className="text-gray-400 text-xl">🔍</span>
            <input
              type="text"
              placeholder="Search here"
              className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder:text-gray-400 py-2 sm:py-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button
            onClick={handleSearch}
            className="bg-lime-400 hover:bg-lime-500 active:bg-lime-600 text-[#0f2a2a] font-semibold px-4 sm:px-10 py-2 sm:py-4 text-sm sm:text-base transition-colors duration-200"
          >
            Search
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 my-4 sm:my-5" />

      {/* Subtitle */}
      <h3 className="text-xl sm:text-2xl font-bold text-[#0f2a2a] text-center sm:text-left mb-4 sm:mb-5">
        We deliver almost all over Bangladesh
      </h3>

      {/* Map */}
      <BangladeshMap 
        serviceCenters={serviceCenters} 
        selectedDistrict={selectedDistrict} 
      />
    </div>
  );
};

export default Coverage;