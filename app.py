from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 🧺 Inventory data
inventory = {
    "12345": {"sku": "12345", "name": "Milk", "price": 30, "stock": 20},
    "67890": {"sku": "67890", "name": "Bread", "price": 25, "stock": 15},
    "11111": {"sku": "11111", "name": "Eggs", "price": 60, "stock": 10},
}

# 🧾 Billing history (in-memory)
bills = []


@app.route("/item/<sku>", methods=["GET"])
def get_item(sku):
    """Return single item by SKU"""
    item = inventory.get(sku)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    return jsonify(item)


@app.route("/checkout", methods=["POST"])
def checkout():
    """Handle checkout and record bill"""
    data = request.json
    total = data.get("total")
    cart = data.get("cart")

    # Save the bill
    bill_record = {"items": cart, "total": total}
    bills.append(bill_record)

    return jsonify({"message": "Checkout successful!", "total": total})


@app.route("/inventory", methods=["GET"])
def get_inventory():
    """Return all inventory items"""
    return jsonify(list(inventory.values()))


@app.route("/billing-history", methods=["GET"])
def get_billing_history():
    """Return all bills"""
    return jsonify(bills)


@app.route("/add-item", methods=["POST"])
def add_item():
    """Add a new product to inventory"""
    data = request.json
    sku = data.get("sku")
    name = data.get("name")
    price = data.get("price")
    stock = data.get("stock")

    if not all([sku, name, price, stock]):
        return jsonify({"error": "All fields required"}), 400

    if sku in inventory:
        return jsonify({"error": "Item already exists"}), 400

    inventory[sku] = {
        "sku": sku,
        "name": name,
        "price": float(price),
        "stock": int(stock),
    }

    return jsonify({"message": "Item added successfully", "item": inventory[sku]})


# ✅ Production entry point (for Render)
if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)

