const SELECTED_PREFIX = "selected-";
const PRODUCT_ID_PREFIX = "product-";

/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProducts = document.getElementById("selectedProductsList");

/* Array of products that are selected */
const selectedProductsList = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Extracts the id from the DOM id of a product */
function separateID(id) {
  const stringID = "" + id;
  const cutIndex =
    stringID.indexOf(PRODUCT_ID_PREFIX) + PRODUCT_ID_PREFIX.length;
  const splitID = stringID.substring(cutIndex);
  return splitID;
}

/* Locates a selected item using its ID in the document and returns the index
 * (ex. selected-product-2)
 */
function locateItemByID(id, productsList) {
  const targetID = separateID(id);
  let found = false;
  let i = 0;
  while (i < productsList.length && !found) {
    const currentProduct = productsList[i];
    const currentID = currentProduct.id;
    found = currentID == targetID;
    if (!found) {
      i++;
    }
  }
  if (!found) {
    i = -1;
    console.log(`WARNING: Couldn't locate product by ID ${targetID}`);
  }
  return i;
}

/* Unselect a product */
function removeFromSelectedItems(selectedProductID) {
  const removeIndex = locateItemByID(selectedProductID, selectedProductsList);
  selectedProductsList.splice(removeIndex, 1);
  refreshSelectedItems();
}

/* Select a product to include in the generated routine */
function addToSelectedItems(selectedProduct) {
  selectedProductsList.push(selectedProduct);
  refreshSelectedItems();
}

/* Refresh the products selected in the box */
function refreshSelectedItems() {
  selectedProducts.innerHTML = "";
  for (let i = 0; i < selectedProductsList.length; i++) {
    const product = selectedProductsList[i];
    selectedProducts.innerHTML += `
    <div class="selected-product-card" id="${SELECTED_PREFIX}${PRODUCT_ID_PREFIX}${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="selected-product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="remove-button-container">
          <button class="remove-button" id="${SELECTED_PREFIX}${PRODUCT_ID_PREFIX}button-${product.id}">
            Remove
          </button>
      </div>
    </div>
  `;
  }

  selectedProductsList.forEach((cur) => {
    const curProduct = document.getElementById(
      `${SELECTED_PREFIX}${PRODUCT_ID_PREFIX}button-${cur.id}`,
    );

    curProduct.addEventListener("click", async (e) => {
      const products = await loadProducts();
      const targetID = e.target.closest(".product-card").id;
      console.log(targetID);

      const targetIDIndex = locateItemByID(targetID, products);
      const targetProduct = products[targetIDIndex];

      addToSelectedItems(targetProduct);
    });
  });
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" id="${PRODUCT_ID_PREFIX}${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `,
    )
    .join("");
  products.forEach((cur) => {
    const curProduct = document.getElementById(`${PRODUCT_ID_PREFIX}${cur.id}`);

    curProduct.addEventListener("click", async (e) => {
      const products = await loadProducts();
      const targetID = e.target.closest(".product-card").id;
      console.log(targetID);

      const targetIDIndex = locateItemByID(targetID, products);
      const targetProduct = products[targetIDIndex];

      addToSelectedItems(targetProduct);
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory,
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
