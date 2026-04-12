// Global constants
const SELECTED_PREFIX = "selected-";
const PRODUCT_ID_PREFIX = "product-";

/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const userInput = document.getElementById("userInput");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const routineButton = document.getElementById("generateRoutine");
const selectedProducts = document.getElementById("selectedProductsList");

/* Array of products that are selected */
const selectedProductsList = [];

const messages = [
  {
    role: "system",
    content:
      "You are a L'Oreal expert that specializes in recommending routines to customers who are interested in trying the brand. If the customer attempts to ask anything other than the routine recommendation based on the items they selected, or what L'Oreal offers, such as skincare, haircare, makeup, fragrance, and other related areas, politely tell them that you do not know. Generate all responses with a conversational, friendly tone. Ensure that the length of your responses are within the tokens allotted, and that it they are not cut-off mid-sentence.",
  },
];

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
  }
  return i;
}

/* Indicate if a product exists in some specified array */
function existsInProductList(productID, productList) {
  return locateItemByID(productID, productList) == -1;
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
          <button class="remove-button" id="button-${SELECTED_PREFIX}${PRODUCT_ID_PREFIX}${product.id}">
            Remove
          </button>
      </div>
    </div>
  `;
  }

  selectedProductsList.forEach((cur) => {
    const curProduct = document.getElementById(
      `button-${SELECTED_PREFIX}${PRODUCT_ID_PREFIX}${cur.id}`,
    );

    curProduct.addEventListener("click", (e) => {
      const targetID = e.target.id;

      const targetIDIndex = locateItemByID(targetID, selectedProductsList);
      const targetProduct = selectedProductsList[targetIDIndex];

      removeFromSelectedItems(targetProduct);
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
      if (!existsInProductList(targetID, selectedProductsList)) {
        const targetIDIndex = locateItemByID(targetID, products);
        const targetProduct = products[targetIDIndex];
        addToSelectedItems(targetProduct);
      }
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
});

async function fetchRoutine() {
  chatWindow.style.color = "#000000";
  chatWindow.textContent = "Thinking...";

  const selected = {
    selectedProducts: selectedProductsList,
  };
  const selectedToString = JSON.stringify(selected);
  const routinePrompt = `
    The customer has requested a routine generation from the products they selected using the interface. To do so, analyze the following JSON data: ${selectedToString}
    Use this JSON data to recommend a routine to the customer. 
  `;

  messages.push({
    role: "system",
    content: routinePrompt,
  });

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error status: ${response.status}`);
    }

    const responseFromAI = await response.json();

    const responseText =
      responseFromAI.choices[0].message.content || "Could not form a response.";

    chatWindow.textContent = responseText;

    messages.push({
      role: "assistant",
      content: responseText,
    });
  } catch (error) {
    console.error(error);
    chatWindow.style.color = "#FF003B";
    chatWindow.textContent =
      "Sorry, something went wrong. Please try again later. :(";
  }
}

/* Handles clicks of the button that generates routines */
routineButton.addEventListener("click", async (e) => {
  e.preventDefault();

  if (selectedProductsList.length > 0) {
    fetchRoutine();
  } else {
    chatWindow.innerHTML =
      "Select some of L'Oreal's products to get a well-organized routine!";
  }
});
