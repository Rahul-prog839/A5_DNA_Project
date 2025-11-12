import React, { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard() {
  const [inventory, setInventory] = useState([]); // safe default
  const [billingHistory, setBillingHistory] = useState([]); // safe default
  const [newItem, setNewItem] = useState({
    sku: "",
    name: "",
    price: "",
    stock: "",
  });
  const [backendStatus, setBackendStatus] = useState(true);

  // 🧠 Load inventory and billing history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, billRes] = await Promise.all([
          axios.get("http://127.0.0.1:5000/inventory"),
          axios.get("http://127.0.0.1:5000/billing-history"),
        ]);
        setInventory(invRes.data || []);
        setBillingHistory(billRes.data || []);
        setBackendStatus(true);
      } catch (error) {
        console.error("Backend not reachable:", error);
        setBackendStatus(false);
      }
    };
    fetchData();
  }, []);

  // ➕ Add new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (
      !newItem.sku.trim() ||
      !newItem.name.trim() ||
      !newItem.price ||
      !newItem.stock
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await axios.post("http://127.0.0.1:5000/add-item", newItem);
      alert("✅ " + res.data.message);
      setInventory((prev) => [...prev, res.data.item]);
      setNewItem({ sku: "", name: "", price: "", stock: "" });
    } catch (err) {
      console.error(err);
      alert("❌ " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginTop: "20px" }}>🛒 Smart Retail Admin Dashboard</h1>

      {!backendStatus && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          ⚠️ Backend not reachable or Flask not running
        </p>
      )}

      {/* ADD ITEM FORM */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          width: "400px",
          margin: "20px auto",
          padding: "15px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h3>➕ Add New Product</h3>
        <form onSubmit={handleAddItem}>
          <input
            type="text"
            placeholder="SKU"
            value={newItem.sku}
            onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
            style={{ margin: "5px", padding: "8px", width: "90%" }}
          />
          <input
            type="text"
            placeholder="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            style={{ margin: "5px", padding: "8px", width: "90%" }}
          />
          <input
            type="number"
            placeholder="Price (₹)"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            style={{ margin: "5px", padding: "8px", width: "90%" }}
          />
          <input
            type="number"
            placeholder="Stock"
            value={newItem.stock}
            onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
            style={{ margin: "5px", padding: "8px", width: "90%" }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              marginTop: "10px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Add Item
          </button>
        </form>
      </div>

      {/* INVENTORY */}
      <h2>📦 Inventory</h2>
      {Array.isArray(inventory) && inventory.length > 0 ? (
        <table
          border="1"
          cellPadding="8"
          style={{
            margin: "0 auto",
            borderCollapse: "collapse",
            minWidth: "400px",
          }}
        >
          <thead style={{ backgroundColor: "#eee" }}>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.sku}>
                <td>{item.sku}</td>
                <td>{item.name}</td>
                <td>₹{item.price}</td>
                <td>{item.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No items in inventory.</p>
      )}

      {/* BILLING HISTORY */}
      <h2 style={{ marginTop: "40px" }}>🧾 Billing History</h2>
      {Array.isArray(billingHistory) && billingHistory.length > 0 ? (
        <div style={{ margin: "20px auto", width: "60%" }}>
          {billingHistory.map((bill, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "10px",
                marginBottom: "10px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h4>Bill #{idx + 1}</h4>
              <ul style={{ listStyleType: "none", padding: 0 }}>
                {Array.isArray(bill.items) &&
                  bill.items.map((it, i) => (
                    <li key={i}>
                      {it.name} × {it.qty} = ₹{it.price * it.qty}
                    </li>
                  ))}
              </ul>
              <strong>Total: ₹{bill.total}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p>No billing records yet.</p>
      )}
    </div>
  );
}

export default AdminDashboard;
