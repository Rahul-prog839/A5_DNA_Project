# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from uuid import uuid4
from datetime import datetime

app = Flask(__name__)
CORS(app)

# -------------------------
# In-memory "database"
# -------------------------
inventory = {
    "12345": {"sku": "12345", "name": "Milk", "price": 30.0, "stock": 20},
    "67890": {"sku": "67890", "name": "Bread", "price": 25.0, "stock": 15},
    "11111": {"sku": "11111", "name": "Eggs", "price": 60.0, "stock": 10},
}

bills = []  # each bill: { id, timestamp, items: [{sku, name, price, qty, line_total}], total }


# -------------------------
# Helpers
# -------------------------
def bad_request(msg):
    return jsonify({"error": msg}), 400


def not_found(msg="Not found"):
    return jsonify({"error": msg}), 404


def parse_json_request():
    """Return (data, error_response) - error_response is None on success."""
    if not request.is_json:
        return None, bad_request("Request body must be JSON")
    try:
        data = request.get_json()
    except Exception:
        return None, bad_request("Invalid JSON")
    return data, None


# -------------------------
# Routes
# -------------------------
@app.route("/")
def home():
    return "✅ Smart Retail Flask Backend is running successfully!"


@app.route("/health")
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat() + "Z"})


@app.route("/inventory", methods=["GET"])
def get_inventory():
    """Return a list of inventory items"""
    return jsonify(list(inventory.values()))


@app.route("/item/<sku>", methods=["GET"])
def get_item(sku):
    """Return a single item by SKU"""
    item = inventory.get(sku)
    if item is None:
        return not_found("Item not found")
    return jsonify(item)


@app.route("/add-item", methods=["POST"])
def add_item():
    """Add a new product to inventory"""
    data, err = parse_json_request()
    if err:
        return err

    sku = data.get("sku")
    name = data.get("name")
    price = data.get("price")
    stock = data.get("stock")

    if not sku or not name or price is None or stock is None:
        return bad_request("Fields required: sku, name, price, stock")

    sku = str(sku).strip()
    if sku in inventory:
        return bad_request("Item already exists")

    try:
        price = float(price)
        stock = int(stock)
    except Exception:
        return bad_request("Price must be a number and stock must be an integer")

    inventory[sku] = {"sku": sku, "name": name, "price": price, "stock": stock}
    return jsonify({"message": "Item added successfully", "item": inventory[sku]}), 201


@app.route("/billing-history", methods=["GET"])
def get_billing_history():
    """Return all billing records (most recent first)"""
    # return reversed to show latest first
    return jsonify(list(reversed(bills)))


@app.route("/checkout", methods=["POST"])
def checkout():
    """
    Expects JSON:
    {
      "cart": [ {"sku": "...", "qty": <int>}, ... ],
      "total": <number>   # optional (we will compute on server)
    }
    """
    data, err = parse_json_request()
    if err:
        return err

    cart = data.get("cart")
    if not isinstance(cart, list) or len(cart) == 0:
        return bad_request("cart must be a non-empty list of {sku, qty}")

    # Validate and compute
    items_out = []
    total_computed = 0.0

    # First pass: validate availability
    for entry in cart:
        if not isinstance(entry, dict):
            return bad_request("Each cart entry must be an object with sku and qty")
        sku = str(entry.get("sku")) if entry.get("sku") is not None else None
        qty = entry.get("qty")
        if not sku or qty is None:
            return bad_request("Each cart entry must have sku and qty")
        try:
            qty = int(qty)
        except Exception:
            return bad_request("qty must be integer")
        if qty <= 0:
            return bad_request("qty must be positive integer")

        item = inventory.get(sku)
        if item is None:
            return not_found(f"Item with SKU {sku} not found")
        if item["stock"] < qty:
            return bad_request(f"Insufficient stock for SKU {sku} (available {item['stock']})")

    # Second pass: deduct stock and build bill
    for entry in cart:
        sku = str(entry["sku"])
        qty = int(entry["qty"])
        item = inventory[sku]
        line_price = float(item["price"]) * qty
        # Deduct stock
        item["stock"] -= qty
        items_out.append({
            "sku": sku,
            "name": item["name"],
            "price": float(item["price"]),
            "qty": qty,
            "line_total": round(line_price, 2),
        })
        total_computed += line_price

    total_computed = round(total_computed, 2)
    # Save bill
    bill_record = {
        "id": str(uuid4()),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "items": items_out,
        "total": total_computed,
    }
    bills.append(bill_record)

    return jsonify({"message": "Checkout successful!", "bill": bill_record}), 201


# -------------------------
# Error handlers
# -------------------------
@app.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "The requested URL was not found on the server."}), 404


@app.errorhandler(500)
def handle_500(e):
    return jsonify({"error": "Internal server error"}), 500


# -------------------------
# Production entry point (for Render)
# -------------------------
if __name__ == "__main__":
    from waitress import serve

    # Run with waitress for production (Render friendly)
    serve(app, host="0.0.0.0", port=5000)
