import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Component to pan/zoom to selected district
const MapMover = ({ selectedDistrict }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedDistrict) {
      const { latitude, longitude } = selectedDistrict;
      map.setView([latitude, longitude], 12, { animate: true });
    }
  }, [selectedDistrict, map]);

  return null;
};

const BangladeshMap = ({ serviceCenters, selectedDistrict }) => {
  return (
    <div className="h-[400px] sm:h-[500px] md:h-[600px] w-full rounded-xl overflow-hidden mt-4 sm:mt-6">
      <MapContainer
        center={[23.685, 90.3563]}
        zoom={7}
        scrollWheelZoom={true}
        className="h-full w-full"
        attributionControl={false}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {serviceCenters.map((district, index) => (
          <Marker 
            key={index} 
            position={[district.latitude, district.longitude]}
          >
            <Popup>
              <div className="space-y-1 text-sm sm:text-base">
                <h2 className="font-bold text-lg">{district.district}</h2>
                <p><strong>Region:</strong> {district.region}</p>
                <p><strong>City:</strong> {district.city}</p>
                <p><strong>Covered Areas:</strong> {district.covered_area.join(", ")}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="text-green-600 font-semibold">{district.status}</span>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {selectedDistrict && <MapMover selectedDistrict={selectedDistrict} />}
      </MapContainer>
    </div>
  );
};

export default BangladeshMap;