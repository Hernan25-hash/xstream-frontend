import React, { useState, useRef, useEffect } from "react";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app, otherStorage } from "../firebase";
import { useNavigate } from "react-router-dom";

const db = getFirestore(app);

const ReceiptModal = ({ show, onClose, userId, wallet, amount }) => {
  const navigate = useNavigate();

  const [selectedWallet, setSelectedWallet] = useState(wallet || "gcash");
  const [accountNumber, setAccountNumber] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [file, setFile] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [status, setStatus] = useState("pending");

  const modalRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (show && wallet) {
      setSelectedWallet(wallet);
      setStatus("pending");
      setShowUploadForm(false);
      setFile(null);
      setAccountNumber("");
      setRefNumber("");
    }
  }, [show, wallet]);

  // Cancel processing if modal closes
  useEffect(() => {
    if (!show && status === "processing") {
      setStatus("pending");
    }
  }, [show, status]);

  if (!show) return null;

  const getQrImage = () => {
    const key = `${selectedWallet}${amount}`;
    switch (key) {
      case "gcash5":
        return "/e-wallet/gcash5.jpeg";
      case "gcash10":
        return "/e-wallet/gcash10.jpeg";
      case "maya5":
        return "/e-wallet/maya5.jpeg";
      case "maya10":
        return "/e-wallet/maya10.jpeg";
      default:
        return "";
    }
  };

  const handleUpload = async () => {
    if (!file || !accountNumber || !refNumber) {
      alert("Please fill in all fields and upload your receipt.");
      return;
    }

    if (!show) return; // abort if modal closed

    setStatus("processing"); // disable button immediately

    try {
      const storageRef = ref(
        otherStorage,
        `receipts/${userId}/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      if (!show) return; // abort if modal closed during upload

      const receiptRef = collection(db, "users", userId, "receipts");
      await addDoc(receiptRef, {
        wallet: selectedWallet,
        accountNumber,
        refNumber,
        amount: parseFloat(amount),
        receiptURL: downloadURL,
        createdAt: serverTimestamp(),
        status: "processing",
      });

      setStatus("submitted");
      setFile(null);
      setAccountNumber("");
      setRefNumber("");

      // Optional: show inline message before redirect
      setTimeout(() => {
        navigate("/exclusive");
      }, 4000);
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("error");
      alert("Upload failed, please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div
        ref={modalRef}
        className="relative p-6 bg-gray-900 border border-gray-700 shadow-xl rounded-2xl w-96"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute text-gray-400 top-3 right-3 hover:text-pink-500"
        >
          ✕
        </button>

        {/* Unified Header Section */}
<h2 className="mb-2 text-lg font-semibold text-center text-pink-500">
  {showUploadForm ? "Upload Receipt Form" : "Scan QR Code / Screenshot"}
</h2>


        {/* Wallet Display */}
        {selectedWallet && (
          <p className="mb-4 text-sm text-center text-gray-300">
            Selected Wallet:{" "}
            <span className="font-semibold text-white capitalize">
              {selectedWallet}
            </span>
          </p>
        )}

        {/* QR Image Section */}
{!showUploadForm && (
  <div className="flex flex-col items-center mb-4">
    <img
      src={getQrImage()}
      alt={`${selectedWallet} ${amount}`}
      className="object-contain w-32 h-32"
    />
    <p className="mt-2 text-sm text-gray-300">Amount: ₱{amount}</p>
    <button
      onClick={() => setShowUploadForm(true)}
      className="mt-2 text-sm font-semibold text-pink-500 underline transition-colors hover:text-pink-400"
    >
      Upload Receipt to complete transaction
    </button>
  </div>
)}


        {/* Upload Form Section */}
        {showUploadForm && (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="pt-4 mb-4 text-left border-t border-gray-700">
              <label className="text-sm text-gray-300">Wallet Selected</label>
              <div className="flex gap-4 mb-2">
                <img
                  src={`/e-wallet/${selectedWallet}.png`}
                  alt={selectedWallet}
                  className="w-20 h-20"
                />
              </div>

              <label className="text-sm text-gray-300">Account / Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 text-black rounded-lg"
              />

              <label className="text-sm text-gray-300">Amount</label>
              <input
                type="number"
                value={amount}
                readOnly
                className="w-full px-3 py-2 text-black bg-gray-200 rounded-lg"
              />

              <label className="text-sm text-gray-300">Reference Number</label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full px-3 py-2 text-black rounded-lg"
              />

              <label className="text-sm text-gray-300">Upload Receipt</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-gray-300"
              />

              <div className="flex justify-center mt-3">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={status === "processing" || !file}
                  className="px-6 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {status === "processing" ? "Processing..." : "Submit"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Status Messages */}
        {status === "submitted" && (
  <div className="mt-4 text-center">
    <p className="font-semibold text-green-400">
      ✅ Your receipt has been submitted successfully!
    </p>
    <div className="flex items-center justify-center mt-2 text-sm text-gray-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4 mr-2 text-pink-500 animate-spin"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6l4 2"
        />
      </svg>
      <span>Processing... Please wait for admin approval.</span>
    </div>
  </div>
)}

        {status === "error" && (
          <p className="mt-2 text-sm text-center text-red-500">
            ❌ Upload failed. Please try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default ReceiptModal;
