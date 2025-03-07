let cart = [];
let currentCurrency = 'USD';
const exchangeRates = {
  USD_TO_PKR: 279.50
};

// Fetch and display products
async function fetchProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

function displayProducts(products) {
  const productsContainer = document.getElementById('products');
  productsContainer.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description || 'Beautiful accommodation'}</p>
        <p class="price">${formatPrice(product.price)}</p>
        <button onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

function formatPrice(price) {
  if (currentCurrency === 'PKR') {
    const pkrPrice = price * exchangeRates.USD_TO_PKR;
    return `Rs. ${pkrPrice.toFixed(0)}`;
  }
  return `$${price}`;
}

function changeCurrency(currency) {
  currentCurrency = currency;
  fetchProducts(); // Refresh the display with new currency
  updateCartDisplay();
}

function addToCart(product) {
  const existingItem = cart.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCartDisplay();
}

function updateCartDisplay() {
  const cartContainer = document.getElementById('cart-items');
  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  
  cartContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <p>${formatPrice(item.price)} x ${item.quantity || 1}</p>
        <button onclick="removeFromCart(${item.id})">Remove</button>
      </div>
    </div>
  `).join('');
  
  document.getElementById('cart-total').textContent = formatPrice(total);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartDisplay();
}

// Handle checkout
document.getElementById('checkout-button').addEventListener('click', async () => {
  try {
    const response = await fetch('/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: cart }),
    });
    
    const { url } = await response.json();
    window.location = url;
  } catch (error) {
    console.error('Error during checkout:', error);
  }
});

// Initialize
fetchProducts();
