import React from 'react';
import { useNavigate } from 'react-router-dom';

const PortalSelection = () => {
  const navigate = useNavigate();

  const handlePortalSelect = (portal) => {
    localStorage.setItem('selectedPortal', portal);
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white text-black rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <svg className="text-5xl text-green-600 w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h1 className="text-4xl font-bold text-gray-800">Baap Dairy Platform</h1>
          </div>
          <p className="text-lg text-gray-600">कृपया आपला पोर्टल निवडा</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Farmer (Milk Supplier) Portal */}
          <div 
            onClick={() => handlePortalSelect('customer')}
            className="group cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="bg-blue-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
                <svg className="text-3xl text-white w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-blue-800 mb-3">Milk Supplier Portal</h2>
              <p className="text-blue-600 mb-4">दूध घालणाऱ्या शेतकऱ्यांसाठी</p>
              <div className="text-sm text-blue-700 space-y-2">
                <div>• दूध घालण्याचा इतिहास</div>
                <div>• पेमेंट ट्रॅक करा</div>
                <div>• खाते व्यवस्थापन</div>
                <div>• प्रोफाइल अपडेट</div>
              </div>
            </div>
          </div>

          {/* Dairy Collection Center Portal */}
          <div 
            onClick={() => handlePortalSelect('dairy')}
            className="group cursor-pointer bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="bg-green-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                <svg className="text-3xl text-white w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 7h-3V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v1H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM8 6h6v1H8V6zm0 4h8v2H8v-2z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-3">Dairy Collection Center</h2>
              <p className="text-green-600 mb-4">दूध संकलन केंद्रासाठी</p>
              <div className="text-sm text-green-700 space-y-2">
                <div>• दूध संकलन व्यवस्थापन</div>
                <div>• शेतकरी रेकॉर्ड</div>
                <div>• दर्जा तपासणी</div>
                <div>• पेमेंट प्रोसेसिंग</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            पोर्टल निवडल्यानंतर आपण लॉगिन पेजकडे वळवले जाणार आहात.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortalSelection;
