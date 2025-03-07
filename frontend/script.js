// Fetch backend message
fetch("http://localhost:3000/api/message")
    .then(response => response.json())
    .then(data => {
        document.getElementById("message").textContent = data.message;
    })
    .catch(error => console.error("Error fetching data:", error));

// Shopping Cart Logic
const cart = [];
const cartList = document.getElementById("cart-list");
const cartTotal = document.getElementById("cart-total");
let currentCurrency = 'USD';
let products = [];

// Fixed exchange rates
const exchangeRates = {
    USD_TO_PKR: 279.50,
    PKR_TO_USD: 0.00357
};

// Fetch products from backend
async function loadProducts() {
    try {
        const response = await fetch("/api/products");
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// Display products in the UI
function displayProducts() {
    const productsContainer = document.querySelector('.products');
    productsContainer.innerHTML = '';

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>Price: <span class="price" data-usd="${product.price}">$${product.price.toFixed(2)}</span></p>
            <button onclick="addToCart(${product.id})">Add to Cart</button>
        `;
        productsContainer.appendChild(productDiv);
    });
}

function getProduct(productId) {
    return products.find(p => p.id === productId);
}

function addToCart(productId) {
    const product = getProduct(productId);
    if (!product) return;

    cart.push({
        id: product.id,
        name: product.name,
        priceUSD: product.price,
        pricePKR: product.price * exchangeRates.USD_TO_PKR
    });
    updateCart();
}

function updateCart() {
    cartList.innerHTML = "";
    let totalUSD = 0;
    let totalPKR = 0;

    cart.forEach(item => {
        totalUSD += item.priceUSD;
        totalPKR += item.pricePKR;
        const li = document.createElement("li");
        const price = currentCurrency === 'PKR' ? 
            `Rs ${item.pricePKR.toFixed(0)}` : 
            `$${item.priceUSD.toFixed(2)}`;
        li.textContent = `${item.name} - ${price}`;
        cartList.appendChild(li);
    });

    cartTotal.textContent = currentCurrency === 'PKR' ? 
        `Rs ${totalPKR.toFixed(0)}` : 
        `$${totalUSD.toFixed(2)}`;
}

function changeCurrency(currency) {
    currentCurrency = currency;
    const prices = document.querySelectorAll('.price');
    
    prices.forEach(price => {
        const usdPrice = parseFloat(price.getAttribute('data-usd'));
        if (currency === 'PKR') {
            const pkrPrice = usdPrice * exchangeRates.USD_TO_PKR;
            price.innerHTML = `Rs ${pkrPrice.toFixed(0)}`;
        } else {
            price.innerHTML = `$${usdPrice.toFixed(2)}`;
        }
    });
    
    updateCart();
}

function payNow() {
    if (cart.length === 0) {
        alert('Please add items to your cart first');
        return;
    }

    fetch("/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            items: cart.map(item => ({
                name: item.name,
                price: item.priceUSD,
                quantity: 1
            }))
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.url) {
            window.location.href = data.url;
        }
    })
    .catch(error => console.error("Error:", error));
}

// Load products when page loads
loadProducts();
