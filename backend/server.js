const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const HOSTAWAY_TOKEN =
  "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI4MDA2NiIsImp0aSI6ImE0OTkzMDcyMzdiNmQyODA2M2NlYzYwZjUzM2RmYTM1NTU4ZjU0Yzc4OTJhMTk5MmFkZGNhYjZlZWE5NTE1MzFjMDYwM2UzMGI5ZjczZDRhIiwiaWF0IjoxNzM5MjcwMjM2LjA0NzE4LCJuYmYiOjE3MzkyNzAyMzYuMDQ3MTgyLCJleHAiOjIwNTQ4MDMwMzYuMDQ3MTg2LCJzdWIiOiIiLCJzY29wZXMiOlsiZ2VuZXJhbCJdLCJzZWNyZXRJZCI6NTI0OTJ9.n_QTZxeFcJn121EGofg290ReOoNE7vMJAE4-lnXhNbLCZw0mIJu1KQWE5pM0xPUcUHeJ-7XTQfS0U5yIkabGi7vGGex0yx9A0h03fn7ZBAtCzPLq_Xmj8ZOdHzahpRqxRsNRRNOlnbttTSrpSo4NJCdK6yhMTKrKkTTVh60IJIc";

// Fixed exchange rates
const exchangeRates = {
  USD_TO_PKR: 279.5,
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/complete", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/complete.html"));
});

app.get("/cancel", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/cancel.html"));
});

app.get("/api/products", async (req, res) => {
  try {
    const response = await axios.get('https://api.hostaway.com/v1/listings', {
      headers: {
        'Authorization': HOSTAWAY_TOKEN
      }
    });

    // Debug: Log the first listing to see its structure
    console.log('First listing data:', JSON.stringify(response.data.result[0], null, 2));

    const listings = response.data.result.map(listing => ({
      id: listing.id,
      name: listing.name,
      price: listing.basePrice || listing.price || 99,
      image: listing.picture, // Use the picture URL directly from the API
      description: listing.description || 'Beautiful accommodation'
    }));

    // Debug: Log the transformed listings
    // console.log('Transformed listings:', JSON.stringify(listings, null, 2));

    res.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
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
          description: `Price in PKR: Rs ${(
            item.price * exchangeRates.USD_TO_PKR
          ).toFixed(2)}`,
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
          message:
            "Note: All payments are processed in USD.\nPKR prices are shown for reference only.",
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
