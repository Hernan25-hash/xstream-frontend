import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot, deleteDoc, doc, query, where } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { app } from "../firebase";
import AdTopUp from "../admincomponents/AdTopUp";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({});
  const db = getFirestore(app);
  
  const navigate = useNavigate();

  // 🔹 Fetch all users
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const userList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);

      // 🔹 For each user, fetch number of pending receipts for badge
      userList.forEach((user) => {
        const receiptsRef = collection(db, "users", user.id, "receipts");
        const q = query(receiptsRef, where("status", "==", "pending", "processing"));
        onSnapshot(q, (snap) => {
          setPendingCounts((prev) => ({ ...prev, [user.id]: snap.size }));
        });
      });
    });
    return () => unsubscribe();
  }, [db]);

  // 🔹 Delete user
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", id));
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user: " + error.message);
      }
    }
  };

 

  return (
    <div className="min-h-screen p-6 text-white bg-black">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-pink-600">User Management</h1>
        <div className="flex gap-2">
          <button
  onClick={() => navigate(-1)}
  className="px-4 py-2 text-sm transition bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
>
  ← Back
</button>

         
        </div>
      </div>

      {/* Users Table */}
      <div className="p-3 bg-gray-900 rounded-lg shadow-lg sm:p-4 md:p-5">
        <h2 className="pb-2 mb-4 text-lg font-semibold border-b border-gray-700 sm:text-xl">
          Registered Users ({users.length})
        </h2>

        {users.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No users found.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-gray-400 uppercase border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Auth Provider</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Top-ups</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-2">{u.displayName || u.username || "—"}</td>
                      <td className="px-4 py-2">{u.email || "—"}</td>
                      <td className="px-4 py-2 capitalize">
                        {u.providerId === "google.com"
                          ? "Google"
                          : u.providerId === "password"
                          ? "Email/Password"
                          : "Unknown"}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${u.role === "admin" ? "bg-pink-600 text-white" : "bg-gray-700 text-gray-200"}`}>
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="relative px-4 py-2">
                        <AdTopUp userId={u.id} btnText="View" />
                        {pendingCounts[u.id] > 0 && (
                          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                            {pendingCounts[u.id]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="px-3 py-1 text-xs text-white transition bg-red-600 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 md:hidden">
              {users.map((u) => (
                <div key={u.id} className="p-3 border border-gray-800 rounded-lg bg-gray-800/60">
                  <p className="mb-1 text-base font-semibold text-pink-400">{u.displayName || u.username || "—"}</p>
                  <p className="text-sm text-gray-300"><strong>Email:</strong> {u.email || "—"}</p>
                  <p className="text-sm text-gray-300"><strong>Provider:</strong> {u.providerId === "google.com" ? "Google" : u.providerId === "password" ? "Email/Password" : "Unknown"}</p>
                  <p className="text-sm text-gray-300"><strong>Role:</strong> <span className={`px-2 py-1 text-xs font-semibold rounded ${u.role === "admin" ? "bg-pink-600 text-white" : "bg-gray-700 text-gray-200"}`}>{u.role || "user"}</span></p>
                  <div className="flex justify-between mt-2">
                    <AdTopUp userId={u.id} btnText="View Top-ups" />
                    {pendingCounts[u.id] > 0 && (
                      <span className="inline-block px-2 py-1 ml-1 text-xs font-bold text-white bg-red-600 rounded-full">
                        {pendingCounts[u.id]}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="px-3 py-1 text-xs text-white transition bg-red-600 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
