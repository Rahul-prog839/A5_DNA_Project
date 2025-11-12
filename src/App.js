import React, { useState } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

const API_URL = "http://127.0.0.1:5000"; // Flask backend URL

function App() {
  const [cart, setCart] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const startScanner = () => {
    setScanning(true);
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    scanner.render(onScanSuccess);
  };

  const onScanSuccess = (decodedText) => {
    fetchItem(decodedText);
  };

  const fetchItem = async (sku) => {
    try {
      const res = await axios.get(`${API_URL}/item/${sku}`);
      const existing = cart.find((i) => i.sku === sku);
      if (existing) {
        existing.qty += 1;
        setCart([...cart]);
      } else {
        setCart([...cart, { ...res.data, qty: 1 }]);
      }
    } catch (err) {
      alert("Item not found");
    }
  };

  const checkout = async () => {
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    await axios.post(`${API_URL}/checkout`, {
      customer_name: "Local User",
      total,
      items: cart,
    });
    alert("Checkout complete!");
    setCart([]);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>🛒 Smart Retail Checkout System</h1>

      {/* Buttons + Input */}
      {!scanning && (
        <button
          onClick={startScanner}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0078ff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          Start Scanner
        </button>
      )}

      <input
        type="text"
        placeholder="Enter barcode manually"
        value={manualCode}
        onChange={(e) => setManualCode(e.target.value)}
        style={{
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          marginRight: "10px",
        }}
      />
      <button
        onClick={() => {
          if (manualCode.trim()) {
            fetchItem(manualCode.trim());
            setManualCode("");
          }
        }}
        style={{
          padding: "8px 16px",
          backgroundColor: "green",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Add Item
      </button>

      <div id="reader" style={{ margin: "20px auto", width: "300px" }}></div>

      <h3>🧾 Cart</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {cart.map((item) => (
          <li key={item.sku}>
            {item.name} × {item.qty} = ₹{item.price * item.qty}
          </li>
        ))}
      </ul>

      {cart.length > 0 && (
        <>
          <h3>Total: ₹{cart.reduce((s, i) => s + i.price * i.qty, 0)}</h3>
          <button
            onClick={checkout}
            style={{
              padding: "10px 20px",
              backgroundColor: "darkgreen",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Checkout
          </button>
        </>
      )}

      {/* --- ADMIN DASHBOARD BUTTON --- */}
      <div>
        <button
          onClick={() => (window.location.href = "/admin")}
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
      </div>
    </div>
  );
}

export default App;
