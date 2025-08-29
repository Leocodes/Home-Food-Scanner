"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { useState, useRef, useEffect } from "react";
import { Barcode, Camera, ShoppingCart, AlertTriangle, Info } from "lucide-react";

type Warning = { type: string; message: string };
type Product = {
  name: string;
  ingredients: string;
  warnings: Warning[];
  conditions?: string[];
  alternatives: string[];
};

type StorePrice = { store: string; price: string };

const HealthFoodScanner = () => {
  const [activeTab, setActiveTab] = useState<"scan" | "barcode" | "manual" | "results">("scan");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [manualIngredients, setManualIngredients] = useState("");
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [storeComparison, setStoreComparison] = useState<StorePrice[]>([]);
  const [healthConditions, setHealthConditions] = useState({
    diabetes: false,
    hypertension: false,
    glutenIntolerance: false,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    codeReader.current = new BrowserMultiFormatReader();
    return () => stopScanner();
  }, []);

  const handleScan = (code: string) => {
    handleBarcodeSubmit(code);
    stopScanner();
  };

  const startScanner = async () => {
  if (codeReader.current && videoRef.current) {
    try {
      console.log("Requesting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute("playsinline", "true"); // ✅ needed for iOS Safari
      await videoRef.current.play();

      console.log("Camera started, attaching decoder...");

      const controls = await codeReader.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log("Barcode detected:", result.getText());
            handleScan(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Scanner error:", err);
          }
        }
      );

      controlsRef.current = controls;
      setIsScanning(true);
    } catch (error) {
      console.error("Error starting scanner:", error);
      alert("Camera access denied or unavailable. Please check browser settings.");
    }
  } else {
    console.warn("CodeReader or videoRef not initialized.");
  }
};


  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
  };

  const mockDatabase: Record<string, Product> = {
    "123456789": {
      name: "Coca-Cola",
      ingredients: "Carbonated Water, Sugar, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine",
      warnings: [
        { type: "high-sugar", message: "High sugar content: 39g per can" },
        { type: "caffeine", message: "Contains caffeine" },
      ],
      conditions: ["diabetes", "hypertension"],
      alternatives: ["Coca-Cola Zero Sugar", "Sparkling Water"],
    },
    "987654321": {
      name: "Whole Wheat Bread",
      ingredients: "Whole Wheat Flour, Water, Yeast, Salt, Sugar",
      warnings: [],
      conditions: ["glutenIntolerance"],
      alternatives: ["Gluten-free Bread"],
    },
  };

  const analyzeIngredients = (ingredients: string): Warning[] => {
    const lower = ingredients.toLowerCase();
    const warnings: Warning[] = [];
    if (lower.includes("sugar")) warnings.push({ type: "high-sugar", message: "Contains added sugar" });
    if (lower.includes("caffeine")) warnings.push({ type: "caffeine", message: "Contains caffeine" });
    if (lower.includes("gluten")) warnings.push({ type: "gluten", message: "Contains gluten" });
    return warnings;
  };

  const handleBarcodeSubmit = (code?: string) => {
    const value = code ?? barcodeInput;
    const product = mockDatabase[value];
    if (product) {
      setScannedProduct(product);
      simulateStoreComparison(product.name);
      setActiveTab("results");
    } else {
      setScannedProduct({
        name: "Unknown Product",
        ingredients: "N/A",
        warnings: [{ type: "unknown", message: "Product not found in database" }],
        alternatives: [],
      });
      setStoreComparison([]);
      setActiveTab("results");
    }
  };

  const handleManualAnalysis = () => {
    const warnings = analyzeIngredients(manualIngredients);
    setScannedProduct({
      name: "Custom Ingredient Analysis",
      ingredients: manualIngredients,
      warnings,
      alternatives: [],
    });
    setStoreComparison([]);
    setActiveTab("results");
  };

  const simulateStoreComparison = (_productName: string) => {
    setStoreComparison([
      { store: "Walmart", price: "$1.50" },
      { store: "Target", price: "$1.75" },
      { store: "Amazon", price: "$1.65" },
    ]);
  };

  const getWarningColor = (type: string) => {
    switch (type) {
      case "high-sugar":
        return "bg-red-100 text-red-800 border-red-300";
      case "caffeine":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "gluten":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getWarningIcon = (type: string) => {
    switch (type) {
      case "high-sugar":
      case "caffeine":
      case "gluten":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        {[
          { key: "scan", label: "Scan", icon: Camera },
          { key: "barcode", label: "Barcode", icon: Barcode },
          { key: "manual", label: "Manual", icon: ShoppingCart },
          { key: "results", label: "Results", icon: Info },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 py-3 text-center ${
              activeTab === tab.key ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
            }`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            <tab.icon className="w-5 h-5 mx-auto mb-1" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === "scan" && mounted && (
  <div className="space-y-4">
    <div className="border-2 border-dashed rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
      {isScanning ? (
        <video ref={videoRef} className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center text-gray-400">
          <Camera className="w-12 h-12" />
          <span className="ml-2">Camera Preview</span>
        </div>
      )}
    </div>

    <button
      onClick={isScanning ? stopScanner : startScanner}
      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
    >
      {isScanning ? "Stop Scan" : "Scan Now"}
    </button>

    <p className="text-sm text-gray-500 text-center">
      Point your camera at a barcode to scan
    </p>
  </div>
)}

        {activeTab === "barcode" && (
          <div className="space-y-4">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Enter barcode number"
              className="w-full p-2 border rounded-lg"
            />
            <button
              onClick={() => handleBarcodeSubmit()}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Lookup Product
            </button>
          </div>
        )}

        {activeTab === "manual" && (
          <div className="space-y-4">
            <textarea
              value={manualIngredients}
              onChange={(e) => setManualIngredients(e.target.value)}
              placeholder="Enter ingredients list here..."
              className="w-full p-2 border rounded-lg h-32"
            />
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Health Conditions</h3>
              {Object.keys(healthConditions).map((condition) => (
                <label key={condition} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(healthConditions as any)[condition]}
                    onChange={(e) =>
                      setHealthConditions((prev) => ({
                        ...prev,
                        [condition]: e.target.checked,
                      }))
                    }
                  />
                  <span className="capitalize">{condition.replace(/([A-Z])/g, " $1")}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleManualAnalysis}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Analyze Ingredients
            </button>
          </div>
        )}

        {activeTab === "results" && scannedProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800">{scannedProduct.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{scannedProduct.ingredients}</p>
            </div>

            {/* Donation button */}
            <div className="flex justify-center">
              <a
                href="https://buymeacoffee.com/dppsquad"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl shadow-md hover:bg-yellow-500 transition"
              >
                ☕ Buy me a coffee
              </a>
            </div>

            {storeComparison.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Store Price Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {storeComparison.map((store, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <p className="font-medium">{store.store}</p>
                      <p className="text-blue-600">{store.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scannedProduct.warnings && scannedProduct.warnings.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Health Warnings</h3>
                <div className="space-y-2">
                  {scannedProduct.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 p-3 rounded-lg border ${getWarningColor(warning.type)}`}
                    >
                      {getWarningIcon(warning.type)}
                      <span className="text-sm">{warning.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scannedProduct.alternatives && scannedProduct.alternatives.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Healthier Alternatives</h3>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {scannedProduct.alternatives.map((alt, index) => (
                    <li key={index}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthFoodScanner;
