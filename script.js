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
const clearButton = document.getElementById("clearButton");

/* Modal elements */
const productModal = document.getElementById("productModal");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalBrand = document.getElementById("modalBrand");
const modalDescription = document.getElementById("modalDescription");
const closeModal = document.getElementById("closeModal");

const workerURL = "https://loreal-ai-assistant-worker.yumispider.workers.dev/";

/* Array of products that are selected */
const selectedProductsList = [];

const systemPrompt = `
You are a representative of L'Oreal who specializes in recommending routines to customers interested in trying the brand. If the customer attempts to ask anything other than the routine recommendation based on the items they selected, or what L'Oreal offers, such as skincare, haircare, makeup, fragrance, and other related areas, politely tell them that you do not know. Ensure that all responses fit within the tokens allotted, and that they are not cut-off mid-sentence. Incorporate emojis, and use a conversational, friendly tone.
`;
const messages = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Functions to stored the selected products into the site's local storage. */
function saveSelectedProducts() {
  const selectedProductStorage = {
    selectedProducts: selectedProductsList,
  };
  localStorage.setItem("productList", JSON.stringify(selectedProductStorage));
}

function loadSelectedProducts() {
  const savedSelectedProductStorage = localStorage.getItem("productList");
  if (savedSelectedProductStorage) {
    const selectedProductStorage = JSON.parse(savedSelectedProductStorage);
    const storedList = selectedProductStorage.selectedProducts;

    for (let i = 0; i < storedList.length; i++) {
      selectedProductsList[i] = storedList[i];
    }

    refreshSelectedItems();
  }
}

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
  const locateIndex = locateItemByID(productID, productList);
  const exists = locateIndex !== -1;
  return exists;
}

/* Clears all products that are selected and updates the saved list */
function clearSelection() {
  while (selectedProductsList.length > 0) {
    selectedProductsList.pop();
  }
}

clearButton.addEventListener("click", (e) => {
  clearSelection();
  refreshSelectedItems();
  saveSelectedProducts();
});

/* Unselect a product */
function removeFromSelectedItems(selectedProductID) {
  const removeIndex = locateItemByID(selectedProductID, selectedProductsList);
  selectedProductsList.splice(removeIndex, 1);
  refreshSelectedItems();
  saveSelectedProducts();
}

/* Select a product to include in the generated routine */
function addToSelectedItems(selectedProduct) {
  selectedProductsList.push(selectedProduct);
  refreshSelectedItems();
  saveSelectedProducts();
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
      <div class="learn-more-button-container">
        <button class="learn-more-button" id="learn-more-${SELECTED_PREFIX}${PRODUCT_ID_PREFIX}${product.id}">Learn more
        </button>
      </div>
    </div>
  `,
    )
    .join("");
  products.forEach((cur) => {
    const curProduct = document.getElementById(`${PRODUCT_ID_PREFIX}${cur.id}`);
    const learnMoreButton = document.getElementById(
      `learn-more-${SELECTED_PREFIX}${PRODUCT_ID_PREFIX}${cur.id}`,
    );

    curProduct.addEventListener("click", (e) => {
      const targetID = e.target.closest(".product-card").id;
      const exists = existsInProductList(targetID, selectedProductsList);
      if (!exists) {
        const targetIDIndex = locateItemByID(targetID, products);
        const targetProduct = products[targetIDIndex];
        addToSelectedItems(targetProduct);
      }
    });

    learnMoreButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const productTarget = e.target.closest(".product-card").id;
      const targetIDIndex = locateItemByID(productTarget, products);
      const targetProduct = products[targetIDIndex];
      modalImage.src = targetProduct.image;
      modalName.textContent = targetProduct.name;
      modalBrand.textContent = targetProduct.brand;
      modalDescription.textContent = targetProduct.description;
      productModal.style.display = "flex";
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

function addConversationHistory(conversationReceiver) {
  for (let i = 0; i < messages.length; i++) {
    conversationReceiver.push(messages[i]);
  }
}

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

  const promptMessages = [];
  promptMessages.push({
    role: "system",
    content: systemPrompt + routinePrompt,
  });

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: promptMessages,
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
    await fetchRoutine();
  } else {
    chatWindow.innerHTML =
      "Select some of L'Oreal's products to get a well-organized routine!";
  }
});

async function fetchResponse() {
  chatWindow.style.color = "#000000";
  chatWindow.textContent = "Thinking...";

  const chatPrompt = `
    The customer has asked a question using the chat form. 
  `;

  const promptMessages = [];

  promptMessages.push({
    role: "system",
    content: systemPrompt,
  });

  messages.push({
    role: "user",
    content: userInput.value,
  });

  addConversationHistory(promptMessages);

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: promptMessages,
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

  chatWindow.textContent = "";
}

document.addEventListener("DOMContentLoaded", loadSelectedProducts);

closeModal.addEventListener("click", () => {
  productModal.style.display = "none";
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  await fetchResponse();
});
