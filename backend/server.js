const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Fixed exchange rates
const exchangeRates = {
  USD_TO_PKR: 279.50,
};

// Product data
const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 49,
    image: "https://images.pexels.com/photos/3394662/pexels-photo-3394662.jpeg",
  },
  {
    id: 2,
    name: "2 TB Flash Drive",
    price: 84,
    image: "https://images.pexels.com/photos/3631991/pexels-photo-3631991.jpeg",
  },
  {
    id: 3,
    name: "Gaming Mouse",
    price: 49,
    image:
      "https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
  {
    id: 4,
    name: "Mechanical Keyboard",
    price: 129,
    image:
      "https://images.pexels.com/photos/1714205/pexels-photo-1714205.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
  {
    id: 5,
    name: "Smartphone Stand",
    price: 19,
    image:
      "https://images.pexels.com/photos/4152562/pexels-photo-4152562.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
];

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// Handle root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Success route
app.get("/complete", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/complete.html"));
});

// Cancel route
app.get("/cancel", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/cancel.html"));
});

// Get products endpoint
app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/api/message", (req, res) => {
  res.json({ message: "Backend is connected as well" });
});

// Checkout Route for Stripe Payment
app.post("/checkout", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: "No items in cart" });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: `Price in PKR: Rs ${(item.price * exchangeRates.USD_TO_PKR).toFixed(0)}`,
        },
        unit_amount: item.price * 100, // Convert to cents
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.BASE_URL}/complete`,
      cancel_url: `${process.env.BASE_URL}/cancel`,
      custom_text: {
        submit: {
          message: 'Note: All payments are processed in USD. PKR prices are shown for reference only.',
        },
      },
    });

    // Send only the URL in response
    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
