import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";

const backendURL = "https://a5-dna-project-backend.onrender.com"; // change this to your actual backend URL

// -------------------- MAIN HOME --------------------
function Home() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");

  const handleScan = async () => {
    if (!barcode) return alert("Enter barcode!");
    try {
      const res = await fetch(`${backendURL}/item/${barcode}`);
      const data = await res.json();

      if (data.error) {
        alert("Item not found!");
      } else {
        setCart([...cart, data]);
        setBarcode("");
      }
    } catch {
      alert("Backend not reachable!");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const res = await fetch(`${backendURL}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart, total }),
    });
    const data = await res.json();
    if (data.message) {
      alert(`✅ ${data.message}\nTotal Bill: ₹${data.total}`);
      setCart([]);
      setMessage("Checkout successful!");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🛒 Smart Retail Checkout System</h1>
      <input
        type="text"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="Enter Barcode (e.g., 12345)"
        style={{ padding: "8px", marginRight: "10px" }}
      />
      <button
        onClick={handleScan}
        style={{
          padding: "8px 16px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
        }}
      >
        Add Item
      </button>

      <h3 style={{ marginTop: "20px" }}>🧺 Cart Items:</h3>
      <ul>
        {cart.map((item, i) => (
          <li key={i}>
            {item.name} - ₹{item.price}
          </li>
        ))}
      </ul>

      <button
        onClick={handleCheckout}
        style={{
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "8px",
          marginTop: "10px",
        }}
      >
        Checkout
      </button>

      <br />
      <Link to="/admin">
        <button
          style={{
            padding: "8px 16px",
            backgroundColor: "#555",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Admin Dashboard
        </button>
      </Link>

      {message && <p style={{ color: "green" }}>{message}</p>}
    </div>
  );
}

// -------------------- ADMIN --------------------
function Admin() {
  const [inventory, setInventory] = useState([]);
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({ sku: "", name: "", price: "", stock: "" });

  useEffect(() => {
    fetch(`${backendURL}/inventory`).then(r => r.json()).then(setInventory);
    fetch(`${backendURL}/billing-history`).then(r => r.json()).then(setBills);
  }, []);

  const handleAddItem = async () => {
    const res = await fetch(`${backendURL}/add-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.message) {
      alert("✅ Item added!");
      setForm({ sku: "", name: "", price: "", stock: "" });
      fetch(`${backendURL}/inventory`).then(r => r.json()).then(setInventory);
    } else {
      alert(data.error || "Failed to add item.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🧾 Admin Dashboard</h1>
      <Link to="/">
        <button
          style={{
            padding: "8px 16px",
            backgroundColor: "#444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          ← Back to Home
        </button>
      </Link>

      <h3>🛍️ Add New Item</h3>
      <input
        placeholder="SKU"
        value={form.sku}
        onChange={(e) => setForm({ ...form, sku: e.target.value })}
        style={{ margin: "5px" }}
      />
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        style={{ margin: "5px" }}
      />
      <input
        placeholder="Price"
        type="number"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
        style={{ margin: "5px" }}
      />
      <input
        placeholder="Stock"
        type="number"
        value={form.stock}
        onChange={(e) => setForm({ ...form, stock: e.target.value })}
        style={{ margin: "5px" }}
      />
      <button
        onClick={handleAddItem}
        style={{
          padding: "8px 16px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          marginLeft: "10px",
        }}
      >
        Add
      </button>

      <h3 style={{ marginTop: "30px" }}>📦 Inventory</h3>
      <ul>
        {inventory.map((item) => (
          <li key={item.sku}>
            {item.name} - ₹{item.price} ({item.stock} pcs)
          </li>
        ))}
      </ul>

      <h3 style={{ marginTop: "30px" }}>🧾 Billing History</h3>
      <ul>
        {bills.map((bill, i) => (
          <li key={i}>
            Bill #{i + 1} - ₹{bill.total}
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------------------- FALLBACK ROUTE HANDLER --------------------
function CatchAllRedirect() {
  const location = useLocation();
  if (location.pathname !== "/") return <Navigate to="/" replace />;
  return null;
}

// -------------------- APP ROUTER --------------------
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<CatchAllRedirect />} />
      </Routes>
    </Router>
  );
}
