import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { app } from "../firebase";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaEye,
  FaTimes,
} from "react-icons/fa";

const Transactions = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);
  const [subcollectionExists, setSubcollectionExists] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [remarksMap, setRemarksMap] = useState({});
  const db = getFirestore(app);

  // 🔹 Top-Up Rates
  const rates = [
    { price: 5, description: "3 hrs / 1 day" },
    { price: 10, description: "7 hrs / 2 days" },
  ];

  // 🔹 Helper: find rate description by amount
  const getRateDescription = (amount) => {
    const match = rates.find((r) => r.price === Number(amount));
    return match ? match.description : "N/A";
  };

  // 🔹 Fetch receipts
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "users", userId, "receipts"),
      orderBy("createdAt", "desc")
    );

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          setSubcollectionExists(true);
          const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setTransactions(data);

            // Initialize remarksMap with existing remarks
            const initialRemarks = {};
            data.forEach((tx) => {
              initialRemarks[tx.id] = tx.remarks || "";
            });
            setRemarksMap(initialRemarks);
          });
          return () => unsubscribe();
        } else {
          setSubcollectionExists(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching transactions:", err);
        setSubcollectionExists(false);
      });
  }, [db, userId]);

  // 🔹 Realtime updates for selected transaction
  useEffect(() => {
    if (!selectedTx || !userId) return;
    const txRef = doc(db, "users", userId, "receipts", selectedTx.id);

    const unsubscribe = onSnapshot(txRef, (docSnap) => {
      if (docSnap.exists()) {
        setRealtimeData({ id: docSnap.id, ...docSnap.data() });
        setRemarksMap((prev) => ({
          ...prev,
          [docSnap.id]: docSnap.data().remarks || "",
        }));
      }
    });

    return () => unsubscribe();
  }, [selectedTx, db, userId]);

  if (!subcollectionExists) return null;

  if (transactions.length === 0) {
    return (
      <div className="py-3 text-sm text-center text-gray-400 border-t border-gray-700">
        No transactions yet.
      </div>
    );
  }

  // 🔹 Save remarks to Firestore
  const saveRemarks = async () => {
    if (!selectedTx) return;
    try {
      await updateDoc(doc(db, "users", userId, "receipts", selectedTx.id), {
        remarks: remarksMap[selectedTx.id],
      });
      alert("Remarks updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to save remarks");
    }
  };

  return (
    <div className="pt-3 mt-5 border-t border-gray-700">
      <h3 className="mb-3 text-sm font-semibold text-center text-pink-400">
        Transactions
      </h3>

      <div className="space-y-2 overflow-y-auto max-h-40">
        {transactions.map((tx) => {
          const status = tx.status ? tx.status.toLowerCase() : "pending";

          let icon, colorClass;
          if (status === "Verified") {
            icon = <FaCheckCircle className="text-green-400" />;
            colorClass = "text-green-400";
          } else if (status === "Rejected") {
            icon = <FaTimesCircle className="text-red-400" />;
            colorClass = "text-red-400";
          } else {
            icon = <FaHourglassHalf className="text-yellow-400" />;
            colorClass = "text-yellow-400";
          }

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between px-3 py-2 text-xs text-gray-300 rounded-lg bg-gray-800/70"
            >
              {/* 🔹 Left: Transaction Info */}
              <div>
                <p className="font-medium text-white">
                  ₱{tx.amount} — {tx.wallet?.toUpperCase()}
                </p>
                <p className="font-medium text-gray-400">
                  Rate Selected: {getRateDescription(tx.amount)}
                </p>
                <p className="text-gray-400">
                  {tx.createdAt?.toDate
                    ? tx.createdAt.toDate().toLocaleString()
                    : tx.createdAt
                    ? new Date(tx.createdAt).toLocaleString()
                    : "—"}
                </p>
                

              </div>

              {/* 🔹 Right: Status + View button */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1 ${colorClass}`}>
                  {icon}
                  <span className="capitalize">{status}</span>
                </div>

                <button
                  onClick={() => setSelectedTx(tx)}
                  className="flex items-center gap-1 px-2 py-1 text-white transition-all bg-pink-600 rounded-md hover:bg-pink-700"
                >
                  <FaEye />
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔹 Modal */}
      {selectedTx && realtimeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-[90%] max-w-md sm:max-w-lg p-6 bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 shadow-2xl rounded-2xl">
            {/* ❌ Close Button */}
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute text-gray-400 hover:text-white top-3 right-3"
            >
              <FaTimes size={18} />
            </button>

            {/* 🔖 Header */}
            <h2 className="mb-4 text-lg font-semibold text-center text-pink-400 sm:text-xl">
              Receipt Details
            </h2>

            {/* 📋 Info Section */}
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <span className="font-medium text-gray-400">Wallet:</span>{" "}
                {realtimeData.wallet?.toUpperCase()}
              </p>
              <p>
                <span className="font-medium text-gray-400">Amount:</span> ₱
                {realtimeData.amount}
              </p>
              <p>
                <span className="font-medium text-gray-400">Rate Selected:</span>{" "}
                {getRateDescription(realtimeData.amount)}
              </p>
              <p>
                <span className="font-medium text-gray-400">Ref Number:</span>{" "}
                {realtimeData.refNumber}
              </p>
              <p>
                <span className="font-medium text-gray-400">Account:</span>{" "}
                {realtimeData.accountNumber}
              </p>
              <p>
                <span className="font-medium text-gray-400">Status:</span>{" "}
                <span
                  className={`capitalize font-semibold ${
                    realtimeData.status === "verified"
                      ? "text-green-400"
                      : realtimeData.status === "rejected"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {realtimeData.status}
                </span>
              </p>

              {/* 🔹 Remarks Section */}
              <p>
  <span className="font-medium text-gray-400">Remarks:</span>{" "}
  <span className="text-red-400">{realtimeData.remarks || "—"}</span>
</p>

              
            </div>

            {/* 🖼️ Receipt Image */}
            {realtimeData.receiptURL && (
              <div className="mt-5 overflow-hidden border border-gray-700 rounded-xl bg-gray-800/60 max-h-64">
                <div className="overflow-y-auto max-h-64">
                  <img
                    src={realtimeData.receiptURL}
                    alt="Receipt"
                    className="object-contain w-full"
                  />
                </div>
              </div>
            )}

            {/* 🕓 Footer */}
            <div className="mt-5 text-xs text-center text-gray-500">
              Updated Receipts
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
