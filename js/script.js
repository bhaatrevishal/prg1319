
const dd = document.getElementById("dd");
const inp = document.getElementById("inp");
const list = document.getElementById("list");
const loader = document.getElementById("cart-loader");
let items,
  orig,
  currentSupplier,
  currentWardrobe = null,
  currentCategory = null,
  allBuyerProducts,
  supplierWardrobesData,
  grid,
  cartDetails,
  pillBar;
let cartimageObserver, gridimageObserver;
const nr = document.getElementById("nr");
let hIdx = 0;
let selVal = null;
const catalogueContent = document.getElementById("cat-content");
const apiCache = new Map();
let buyerCurrency, buyerEmail, buyerRegion;

function hideLoader() {
  loader.classList.add("hide-loader");
}

function showLoader() {
  loader.classList.remove("hide-loader");
}
initiateFlow();

async function initiateFlow() {
  await ZOHO.CREATOR.UTIL.getQueryParams().then((response) => {
    buyerCurrency = response.buyerCurrency;
    buyerEmail = response.buyerEmail;
    buyerRegion = response.buyerRegion;
    userRole = response.userRole;
  });

  if (userRole != "Buyer") {
    catalogueContent.innerHTML = `<div id="no-permission" class="no-permission-wrapper hidden">
               <div class="no-permission-content">
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <path d="M44.1183 52.7577H44.1423ZM44.1183 34.7577V43.7577ZM39.8433 20.4087L18.6693 55.7577C18.2331 56.5138 18.0023 57.371 18 58.2439C17.9977 59.1168 18.224 59.9752 18.6562 60.7336C19.0885 61.4919 19.7118 62.124 20.4641 62.5668C21.2164 63.0096 22.0714 63.2478 22.9443 63.2577H65.2923C66.1656 63.2487 67.0212 63.0111 67.774 62.5685C68.5268 62.1258 69.1505 61.4937 69.583 60.735C70.0154 59.9763 70.2415 59.1176 70.2388 58.2443C70.2361 57.371 70.0045 56.5137 69.5673 55.7577L48.3963 20.4087C47.951 19.6735 47.3236 19.0656 46.5748 18.6436C45.8259 18.2217 44.9809 18 44.1213 18C43.2618 18 42.4167 18.2217 41.6679 18.6436C40.919 19.0656 40.2916 19.6735 39.8463 20.4087" fill="#FFE6E6"/>
                         <path d="M35.9992 47.9999H36.0232M35.9992 29.9999V38.9999M31.7242 15.6509L10.5502 50.9999C10.1139 51.756 9.88317 52.6131 9.88088 53.4861C9.87858 54.359 10.1048 55.2173 10.5371 55.9757C10.9694 56.7341 11.5927 57.3662 12.3449 57.809C13.0972 58.2518 13.9523 58.49 14.8252 58.4999H57.1732C58.0464 58.4909 58.9021 58.2533 59.6549 57.8106C60.4077 57.368 61.0314 56.7359 61.4638 55.9772C61.8963 55.2185 62.1224 54.3597 62.1197 53.4865C62.1169 52.6132 61.8854 51.7559 61.4482 50.9999L40.2772 15.6509C39.8319 14.9157 39.2045 14.3077 38.4556 13.8858C37.7068 13.4639 36.8617 13.2422 36.0022 13.2422C35.1426 13.2422 34.2976 13.4639 33.5487 13.8858C32.7999 14.3077 32.1725 14.9157 31.7272 15.6509" stroke="#DC2626" stroke-width="3" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h2 class="no-permission-title">Access Restricted</h2>
                    <p class="no-permission-msg">You don't have permission to view this page. Please contact your administrator.</p>
               </div>
          </div>`;
    return;
  }

  let config = {
    report_name: "Suppliers_Widget",
  };
console.log(config);

	ZOHO.CREATOR.DATA.getRecords(config).then(function (response) {
	  console.log(response);
	  
		response.data.forEach((element) => {
		
			const dropdownItem = document.createElement("div");
			dropdownItem.className = "dropdown-item";
			dropdownItem.setAttribute("data-value", element.Supplier_Organisation);
			dropdownItem.setAttribute("data-id", element.ID);
			dropdownItem.innerText = element.Supplier_Organisation;
			list.appendChild(dropdownItem);
		});

    items = Array.from(list.children);
    orig = items.map((i) => i.textContent);
    hideLoader();
  });
}

function vis() {
  return items.filter((i) => !i.classList.contains("hidden"));
}

function hl(idx) {
  items.forEach((i) => i.classList.remove("highlighted"));
  const v = vis();
  if (!v.length) {
    hIdx = -1;
    return;
  }
  if (idx < 0) idx = v.length - 1;
  if (idx >= v.length) idx = 0;
  hIdx = idx;
  v[idx].classList.add("highlighted");
  v[idx].scrollIntoView({ block: "nearest" });
}

function openDD() {
  if (dd.classList.contains("open")) return;
  dd.classList.add("open");
  inp.value = "";
  filter("");
  hIdx = 0;
  hl(0);
}

function closeDD() {
  dd.classList.remove("open");
  if (selVal) {
    const idx = items.findIndex((i) => i.dataset.value === selVal);
    if (idx !== -1) inp.value = orig[idx];
  } else {
    inp.value = "";
  }
  hIdx = 0;
  items.forEach((i) => i.classList.remove("highlighted"));
}

function pick(item) {
  items.forEach((i) => i.classList.remove("selected"));
  item.classList.add("selected");
  selVal = item.dataset.value;
  if (item.dataset.id != currentSupplier) {
    currentSupplier = item.dataset.id;
    getSelectedSupplierDetails();
    inp.value = orig[items.indexOf(item)];
  }
  closeDD();
}

function showCartSkeletonLoader() {
  const cartTitle = cartPanelDiv.querySelector(".cart-title");
  cartPanelDiv.innerHTML = "";
  if (cartTitle) cartPanelDiv.appendChild(cartTitle);

  const cartHeight = cartPanelDiv.clientHeight || window.innerHeight;
  const rowHeight = 110;
  const count = Math.ceil(cartHeight / rowHeight);

  const skeletonList = document.createElement("div");
  skeletonList.className = "cart-skeleton-list";

  for (let i = 0; i < count; i++) {
    const skeletonRow = document.createElement("div");
    skeletonRow.className = "cart-item-skeleton";
    skeletonRow.innerHTML = `
            <div class="skeleton cart-skeleton-img"></div>
            <div class="cart-skeleton-info">
                <div class="skeleton cart-skeleton-title"></div>
                <div class="skeleton cart-skeleton-code"></div>
                <div class="skeleton cart-skeleton-meta"></div>
                <div class="cart-skeleton-bottom">
                    <div class="skeleton cart-skeleton-qty"></div>
                    <div class="skeleton cart-skeleton-price"></div>
                </div>
            </div>
        `;
    skeletonList.appendChild(skeletonRow);
  }

  cartPanelDiv.appendChild(skeletonList);
}

function getSelectedSupplierDetails() {
  let config = {
    form_name: "Trigger_Form",
    payload: {
      data: {
        Action_field: "Get Wardrobe Data",
        Supplier_ID: currentSupplier,
      },
      result: {
        fields: ["JSON"],
        message: true,
      },
    },
  };
  const wardrobesDataPromise = ZOHO.CREATOR.DATA.addRecords(config)
    .then((response) => JSON.parse(response.message) || [])
    .catch(() => []);

  const cartPromise = ZOHO.CREATOR.DATA.getRecords({
    report_name: "Cart_Details_Widget",
    criteria: `Supplier.ID == ${currentSupplier}`,
  })
    .then((res) => res.data || [])
    .catch(() => []);

  Promise.all([wardrobesDataPromise, cartPromise]).then(function ([
    wardrobesData,
    cartData,
  ]) {
    catalogueContent.classList.remove("empty");
    catalogueContent.innerHTML = "";
    supplierWardrobesData = wardrobesData.wardrobes;
    cartDetails = cartData;
    constructInitialDOM();
  });
}

// test code
// currentSupplier = "4908788000000276439";
// getSelectedSupplierDetails();
//test code ends

let cartPanelDiv, leftGridView;
function constructInitialDOM() {
  const wrapper = document.createElement("div");
  wrapper.className = "catalogue-content-wrapper";

  const leftPanel = document.createElement("div");
  leftPanel.className = "left-panel";
  leftPanel.id = "prod-grid-view";
  leftGridView = leftPanel;

  const tabBarWrapper = document.createElement("div");
  tabBarWrapper.className = "tab-bar-wrapper";

  const tabBar = document.createElement("div");
  tabBar.className = "tab-bar";

  if (!supplierWardrobesData || supplierWardrobesData.length === 0) {
    catalogueContent.classList.add("no-data");
    catalogueContent.innerHTML = `
            <div class="no-category-state">
               <svg width="87" height="91" viewBox="0 0 87 91" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.3014 0H9.98573C4.4706 0 0 4.50941 0 10.0724V23.5037C0 29.0625 4.4706 33.5762 9.98573 33.5762H23.3014C28.8166 33.5762 33.2872 29.0625 33.2872 23.5037V10.0724C33.2872 4.50941 28.8166 0 23.3014 0Z" fill="#C9D0FF"/>
                    <path d="M71.3366 2.46289H58.0209C52.5058 2.46289 48.0352 6.9723 48.0352 12.5353V25.9666C48.0352 31.5254 52.5058 36.0391 58.0209 36.0391H71.3366C76.8517 36.0391 81.3223 31.5254 81.3223 25.9666V12.5353C81.3223 6.9723 76.8517 2.46289 71.3366 2.46289Z" fill="#C9D0FF"/>
                    <path d="M23.3014 55.4238H9.98573C4.4706 55.4238 0 59.9332 0 65.4963V78.9276C0 84.4864 4.4706 89 9.98573 89H23.3014C28.8166 89 33.2872 84.4864 33.2872 78.9276V65.4963C33.2872 59.9332 28.8166 55.4238 23.3014 55.4238Z" fill="#C9D0FF"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M28.9912 50.0781C31.5484 50.0782 33.9066 50.9203 35.8125 52.3408C35.3959 53.3087 35.0257 54.3013 34.7061 55.3164C33.1962 53.9258 31.1894 53.0782 28.9912 53.0781H15.6748C11.0013 53.0785 7.18992 56.9035 7.18945 61.6543V75.082C7.18957 79.8285 11.0007 83.6539 15.6748 83.6543H28.9912C32.307 83.6542 35.1863 81.7283 36.5811 78.915C37.0941 79.9391 37.6599 80.932 38.2773 81.8887C36.191 84.7742 32.8139 86.6542 28.9912 86.6543H15.6748C9.31945 86.6539 4.18957 81.4609 4.18945 75.082V61.6543C4.18992 55.2719 9.31927 50.0785 15.6748 50.0781H28.9912ZM28.9912 4.56543C35.3466 4.5656 40.4762 9.75889 40.4766 16.1377V29.5693C40.4765 35.9437 35.3472 41.1414 28.9912 41.1416H15.6748C9.31903 41.1412 4.18954 35.9436 4.18945 29.5693V16.1377C4.18978 9.75903 9.31959 4.56583 15.6748 4.56543H28.9912ZM74.7969 4.56543C81.1486 4.56552 86.278 9.75925 86.2783 16.1377V29.5693C86.2783 33.1318 84.6757 36.3265 82.1533 38.4521C81.2488 37.8554 80.3121 37.3037 79.3457 36.8008C81.706 35.2805 83.2783 32.6144 83.2783 29.5693V16.1377C83.278 11.3908 79.4665 7.56552 74.7969 7.56543H61.4766C56.8025 7.56577 52.9915 11.3914 52.9912 16.1377V29.5693C52.9912 31.5729 53.6735 33.4124 54.8115 34.8701C53.8271 35.1986 52.8643 35.574 51.9258 35.9941C50.7043 34.1542 49.9912 31.9435 49.9912 29.5693V16.1377C49.9915 9.75899 55.1213 4.56577 61.4766 4.56543H74.7969ZM15.6748 7.56543C11.0008 7.56583 7.18978 11.3914 7.18945 16.1377V29.5693C7.18954 34.312 11.0011 38.1412 15.6748 38.1416H28.9912C33.6651 38.1414 37.4765 34.3122 37.4766 29.5693V16.1377C37.4762 11.3913 33.6654 7.5656 28.9912 7.56543H15.6748Z" fill="#6170DA"/>
                    <path d="M62.2977 79.0178V78.5475C62.2977 76.8262 62.7453 75.1345 63.5967 73.6385C64.448 72.1425 65.6738 70.8936 67.1537 70.0145L68.4547 69.2415C69.9727 68.3396 71.23 67.0584 72.1032 65.5238C72.9764 63.9892 73.4354 62.2538 73.4353 60.4882C73.4353 54.8666 68.8771 50.3076 63.2547 50.3076H62.2977C56.1465 50.3076 51.1602 55.2939 51.1602 61.4452V62.0738M62.2977 86.9378V88.9178" stroke="#6170DA" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
               <p class="no-category-msg">No Wardrobes available in your selection</p>
            </div>
        `;
    return;
  }

  supplierWardrobesData.forEach((wardrobe, i) => {
    if (i === 0) {
      currentWardrobe = wardrobe.wardrobe_id;
    }
    const tab = document.createElement("div");
    tab.className = "tab" + (i === 0 ? " active" : "");
    tab.textContent = wardrobe.wardrobe_name;
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentWardrobe = wardrobe.wardrobe_id;
      const selected = supplierWardrobesData.find(
        (w) => w.wardrobe_id === wardrobe.wardrobe_id,
      );
      renderPills(selected.categories);
    });
    tabBar.appendChild(tab);
  });

  pillBar = document.createElement("div");
  pillBar.className = "pill-bar";

  grid = document.createElement("div");
  grid.className = "product-grid";
  gridimageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const imageData = img.dataset.imageData;
          const cacheKey = img.dataset.cacheKey;
          const placeholder = img.previousElementSibling;

          if (!imageData) return;

          if (imageCache.has(cacheKey)) {
            img.src = imageCache.get(cacheKey);
            img.classList.remove("img-hidden");
            if (placeholder) placeholder.classList.add("hidden");
          } else {
            ZOHO.CREATOR.UTIL.setImageData(img, imageData, function () {
              imageCache.set(cacheKey, img.src);
              img.classList.remove("img-hidden");
              if (placeholder) placeholder.classList.add("hidden");
            });
          }

          gridimageObserver.unobserve(img);
        }
      });
    },
    { root: grid, rootMargin: "200px 0px", threshold: 0 },
  );

  renderPills(supplierWardrobesData[0]?.categories);

  tabBarWrapper.appendChild(tabBar);
  leftPanel.appendChild(tabBarWrapper);
  leftPanel.appendChild(pillBar);
  leftPanel.appendChild(grid);

  const cartPanel = document.createElement("div");
  cartPanel.className = "cart-panel";
  cartPanel.id = "cart-det-panel";
  cartPanelDiv = cartPanel;

  const cartTitle = document.createElement("h3");
  cartTitle.className = "cart-title";
  cartTitle.innerHTML = `<svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.1243 9.59762V8.24762C10.1243 6.31982 11.6295 4.74707 13.4993 4.74707C15.369 4.74707 16.8743 6.31982 16.8743 8.24762V9.59762H19.2071C19.3139 9.5977 19.4168 9.63827 19.495 9.71116C19.5731 9.78406 19.6207 9.88386 19.6283 9.99047L20.4302 21.803C20.4372 21.9146 20.3999 22.0244 20.3263 22.1086C20.2527 22.1928 20.1488 22.2446 20.0373 22.2525H6.98956C6.87785 22.2525 6.77072 22.2081 6.69173 22.1292C6.61274 22.0502 6.56836 21.943 6.56836 21.8313V21.803L7.37026 9.99047C7.37744 9.88362 7.42493 9.78348 7.50312 9.71031C7.58131 9.63713 7.68437 9.59637 7.79146 9.59627L10.1243 9.59762ZM11.3906 9.59762H15.6093V8.24762C15.6093 7.00697 14.6643 6.01202 13.4993 6.01202C12.3342 6.01202 11.3906 7.00697 11.3906 8.24762V9.59762ZM7.89271 20.9889H19.1058L18.42 10.8639H8.57986L7.89271 20.9889Z" fill="black"/>
</svg> Cart Details`;
  cartPanel.appendChild(cartTitle);

  wrapper.appendChild(leftPanel);
  wrapper.appendChild(cartPanel);
  catalogueContent.appendChild(wrapper);

  showCartSkeletonLoader();
  renderCartDetails(cartDetails);
}

function syncCartToCategory() {
  if (!cartPanelDiv) return;

  const cartList = cartPanelDiv.querySelector(".cart-list");
  const activeFilterBtn = cartPanelDiv.querySelector(".cart-filter-btn.active");

  if (!cartList || !activeFilterBtn) return;

  if (activeFilterBtn.dataset.filter === "current") {
    renderCartItems(cartDetails, cartList, "current");
  }
}

function renderPills(categories) {
  pillBar.innerHTML = "";

  if (!categories || categories.length === 0) {
    pillBar.style.display = "none";
    grid.className = "product-grid";
    grid.innerHTML = `
            <div class="no-category-state">
               <svg width="87" height="91" viewBox="0 0 87 91" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.3014 0H9.98573C4.4706 0 0 4.50941 0 10.0724V23.5037C0 29.0625 4.4706 33.5762 9.98573 33.5762H23.3014C28.8166 33.5762 33.2872 29.0625 33.2872 23.5037V10.0724C33.2872 4.50941 28.8166 0 23.3014 0Z" fill="#C9D0FF"/>
                    <path d="M71.3366 2.46289H58.0209C52.5058 2.46289 48.0352 6.9723 48.0352 12.5353V25.9666C48.0352 31.5254 52.5058 36.0391 58.0209 36.0391H71.3366C76.8517 36.0391 81.3223 31.5254 81.3223 25.9666V12.5353C81.3223 6.9723 76.8517 2.46289 71.3366 2.46289Z" fill="#C9D0FF"/>
                    <path d="M23.3014 55.4238H9.98573C4.4706 55.4238 0 59.9332 0 65.4963V78.9276C0 84.4864 4.4706 89 9.98573 89H23.3014C28.8166 89 33.2872 84.4864 33.2872 78.9276V65.4963C33.2872 59.9332 28.8166 55.4238 23.3014 55.4238Z" fill="#C9D0FF"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M28.9912 50.0781C31.5484 50.0782 33.9066 50.9203 35.8125 52.3408C35.3959 53.3087 35.0257 54.3013 34.7061 55.3164C33.1962 53.9258 31.1894 53.0782 28.9912 53.0781H15.6748C11.0013 53.0785 7.18992 56.9035 7.18945 61.6543V75.082C7.18957 79.8285 11.0007 83.6539 15.6748 83.6543H28.9912C32.307 83.6542 35.1863 81.7283 36.5811 78.915C37.0941 79.9391 37.6599 80.932 38.2773 81.8887C36.191 84.7742 32.8139 86.6542 28.9912 86.6543H15.6748C9.31945 86.6539 4.18957 81.4609 4.18945 75.082V61.6543C4.18992 55.2719 9.31927 50.0785 15.6748 50.0781H28.9912ZM28.9912 4.56543C35.3466 4.5656 40.4762 9.75889 40.4766 16.1377V29.5693C40.4765 35.9437 35.3472 41.1414 28.9912 41.1416H15.6748C9.31903 41.1412 4.18954 35.9436 4.18945 29.5693V16.1377C4.18978 9.75903 9.31959 4.56583 15.6748 4.56543H28.9912ZM74.7969 4.56543C81.1486 4.56552 86.278 9.75925 86.2783 16.1377V29.5693C86.2783 33.1318 84.6757 36.3265 82.1533 38.4521C81.2488 37.8554 80.3121 37.3037 79.3457 36.8008C81.706 35.2805 83.2783 32.6144 83.2783 29.5693V16.1377C83.278 11.3908 79.4665 7.56552 74.7969 7.56543H61.4766C56.8025 7.56577 52.9915 11.3914 52.9912 16.1377V29.5693C52.9912 31.5729 53.6735 33.4124 54.8115 34.8701C53.8271 35.1986 52.8643 35.574 51.9258 35.9941C50.7043 34.1542 49.9912 31.9435 49.9912 29.5693V16.1377C49.9915 9.75899 55.1213 4.56577 61.4766 4.56543H74.7969ZM15.6748 7.56543C11.0008 7.56583 7.18978 11.3914 7.18945 16.1377V29.5693C7.18954 34.312 11.0011 38.1412 15.6748 38.1416H28.9912C33.6651 38.1414 37.4765 34.3122 37.4766 29.5693V16.1377C37.4762 11.3913 33.6654 7.5656 28.9912 7.56543H15.6748Z" fill="#6170DA"/>
                    <path d="M62.2977 79.0178V78.5475C62.2977 76.8262 62.7453 75.1345 63.5967 73.6385C64.448 72.1425 65.6738 70.8936 67.1537 70.0145L68.4547 69.2415C69.9727 68.3396 71.23 67.0584 72.1032 65.5238C72.9764 63.9892 73.4354 62.2538 73.4353 60.4882C73.4353 54.8666 68.8771 50.3076 63.2547 50.3076H62.2977C56.1465 50.3076 51.1602 55.2939 51.1602 61.4452V62.0738M62.2977 86.9378V88.9178" stroke="#6170DA" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
               <p class="no-category-msg">No Category available in your selection</p>
            </div>
        `;
    return;
  }

  pillBar.style.display = "flex";

  categories.forEach((cat, i) => {
    const pill = document.createElement("div");
    pill.className = "pill" + (i === 0 ? " active" : "");
    pill.textContent = cat.category_name;
    pill.dataset.categoryId = cat.category_id;
    pill.addEventListener("click", () => {
      document
        .querySelectorAll(".pill")
        .forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentCategory = cat.category_id;
      fetchProducts(currentWardrobe, currentCategory);
      if (cartDetails) syncCartToCategory();
    });

    pillBar.appendChild(pill);

    if (i === 0) {
      currentCategory = cat.category_id;
      fetchProducts(currentWardrobe, currentCategory);
      if (cartDetails) syncCartToCategory();
    }
  });
}

// Optimize fetchProducts with debounce
const debouncedFetchProducts = debounce(fetchProducts, 200);

function fetchProducts(wardrobeId, categoryId) {
  const cacheKey = `products_${wardrobeId}_${categoryId}`;

  if (apiCache.has(cacheKey)) {
    renderProducts(apiCache.get(cacheKey));
    return;
  }

  showSkeletonLoader();

  let config = {
    report_name: "Buyer_Products_Widget",
    criteria: `Wardrobe_Id == ${wardrobeId} && Category_Id == ${categoryId}`,
  };

  ZOHO.CREATOR.DATA.getRecords(config)
    .then(function (response) {
      apiCache.set(cacheKey, response.data);
      renderProducts(response.data);
    })
    .catch(function () {
      renderProducts([]);
    });
}

let regionalCodeData = [];
function fetchProductVariants(styleMasterCode, gender) {
  const variantsPromise = ZOHO.CREATOR.DATA.getRecords({
    report_name: "Buyer_Products_Widget_Grouped",
    criteria: `Style_Master_Code == "${styleMasterCode}"`,
  })
    .then((res) => res.data || [])
    .catch(() => []);

  const regionalCodePromise = ZOHO.CREATOR.DATA.getRecords({
    report_name: "Sizes_Widget",
    criteria: `Product_Category.ID == ${currentCategory} && Gender == "${gender}"`,
  })
    .then((res) => {
      if (res.code == 3000) return res.data || [];
      return [];
    })
    .catch(() => []);

  Promise.all([variantsPromise, regionalCodePromise]).then(function ([
    variantsData,
    regionalData,
  ]) {
    regionalCodeData = regionalData;
    openProductDetail(variantsData);
  });
}

function showSkeletonLoader() {
  grid.innerHTML = "";

  const gridWidth = grid.clientWidth || 800;
  const cardWidth = gridWidth / 4; // 4 columns
  const cardHeight = cardWidth + 100; // image height + text below
  const availableHeight = window.innerHeight - grid.getBoundingClientRect().top;
  const rows = Math.ceil(availableHeight / cardHeight);
  const count = rows * 4; // 4 cards per row

  for (let i = 0; i < count; i++) {
    const skeletonCard = document.createElement("div");
    skeletonCard.className = "product-card skeleton-card";
    skeletonCard.innerHTML = `
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-subtitle"></div>
            <div class="skeleton skeleton-price"></div>
        `;
    grid.appendChild(skeletonCard);
  }
}

const imageCache = new Map();
function renderProducts(products) {
  grid.innerHTML = "";

  if (!products || products.length === 0) {
    grid.className = "product-grid";
    grid.innerHTML = `
            <div class="no-category-state">
               <svg width="90" height="101" viewBox="0 0 90 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32.661 17.7823V15.9678L7.25781 23.2258L10.8868 43.1854H21.7739V86.7337H65.3222V43.1854H76.2093L79.8383 23.2258L54.4351 15.9678V17.7823C54.4351 20.6697 53.2881 23.4389 51.2464 25.4806C49.2046 27.5223 46.4355 28.6694 43.548 28.6694C40.6606 28.6694 37.8914 27.5223 35.8497 25.4806C33.808 23.4389 32.661 20.6697 32.661 17.7823Z" fill="#C9D0FF"/>
                    <path d="M32.6603 10.8873V9.07276C32.6603 9.07276 11.6322 6.98681 7.25717 16.3308C3.89771 23.5058 10.8862 36.2904 10.8862 36.2904H21.7733V79.8387H65.3215V36.2904H76.2086C76.2086 36.2904 83.1971 23.5058 79.8376 16.3308C75.4626 6.98681 54.4345 9.07276 54.4345 9.07276V10.8873C54.4345 13.7747 53.2875 16.5439 51.2457 18.5856C49.204 20.6273 46.4348 21.7743 43.5474 21.7743C40.66 21.7743 37.8908 20.6273 35.8491 18.5856C33.8074 16.5439 32.6603 13.7747 32.6603 10.8873Z" stroke="#6170DA" stroke-width="2"/>
                    <circle cx="62.4185" cy="72.5806" r="27.5806" fill="white"/>
                    <g clip-path="url(#clip0_113_5730)">
                         <path d="M59.5161 79.2427V78.8911C59.5161 77.6039 59.8508 76.3389 60.4875 75.2201C61.1241 74.1014 62.0407 73.1675 63.1474 72.5101L64.1203 71.9321C65.2554 71.2577 66.1956 70.2996 66.8486 69.152C67.5016 68.0044 67.8448 66.7068 67.8447 65.3864C67.8447 61.1826 64.4362 57.7734 60.2318 57.7734H59.5161C54.9162 57.7734 51.1875 61.5022 51.1875 66.102V66.5722M59.5161 85.1653V86.6459" stroke="#6170DA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                         <clipPath id="clip0_113_5730">
                              <rect width="49.3547" height="49.3547" fill="white" transform="translate(34.8379 47.9023)"/>
                         </clipPath>
                    </defs>
               </svg>
               <p class="no-category-msg">No Product available in your selection</p>
            </div>
        `;
    return;
  }

  // Batch DOM updates for performance
  const fragment = document.createDocumentFragment();
  const grouped = {};
  products.forEach((item) => {
    const code = item["Style_ID.Style_Master_Code"];
    if (!grouped[code]) grouped[code] = [];
    grouped[code].push(item);
  });

  Object.values(grouped).forEach((group) => {
    const item = group[0];
    const card = document.createElement("div");
    card.className = "product-card";
    card.setAttribute("data-id", item["Style_ID.Primary_Image"]);
    card.addEventListener("click", function () {
      showLoader();
      fetchProductVariants(
        item["Style_ID.Style_Master_Code"],
        item["Style_ID.Gender"],
      );
    });

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "img-wrapper";

    const placeholder = document.createElement("div");
    placeholder.className = "img-placeholder";
    // ...SVG placeholder...

    // Responsive image loading
    const img = document.createElement("img");
    img.className = "product-img img-hidden";
    img.alt = item.Style_Name?.Style_Name;
    if (item["Style_ID.Primary_Image"]) {
      img.dataset.imageData = item["Style_ID.Primary_Image"];
      img.dataset.cacheKey = item["Style_ID.ID"];
      // Use srcset for modern formats
      img.setAttribute('srcset', `${item["Style_ID.Primary_Image"]}.webp 1x, ${item["Style_ID.Primary_Image"]}.jpg 2x`);
      img.setAttribute('sizes', '(max-width: 600px) 100vw, 25vw');
      if (typeof IntersectionObserver !== 'undefined') {
        gridimageObserver.observe(img);
      } else {
        // Fallback: load immediately
        img.src = item["Style_ID.Primary_Image"];
        img.classList.remove("img-hidden");
        if (placeholder) placeholder.classList.add("hidden");
      }
    }
    imgWrapper.appendChild(placeholder);
    imgWrapper.appendChild(img);

    const name = document.createElement("p");
    name.className = "product-name";
    name.textContent = item.Style_Name?.Style_Name;

    const idEl = document.createElement("p");
    idEl.className = "product-id";
    idEl.textContent = item["Style_ID.Style_Master_Code"];

    const price = document.createElement("p");
    price.className = "product-price";
    price.innerHTML = `Starting at : <strong>${buyerCurrency} ${item.Sell_Price}</strong>`;

    card.appendChild(imgWrapper);
    card.appendChild(name);
    card.appendChild(idEl);
    card.appendChild(price);
    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
}

function openProductDetail(group) {
  const existing = document.getElementById("product-detail-wrapper");
  if (existing) existing.remove();

  const firstItem = group[0];
  let selectedItem = firstItem;
  let quantity = 1;
  let selectedSize = group[0]?.Size?.Size || null;
  let selectedColor = group[0]?.["Colors.Hex_Color_Code"] || null;

  function getExistingCartItem(item) {
    return (
      cartDetails.find(
        (c) =>
          c.Product?.ID === item["Style_Name"]?.ID &&
          c.Product_Size?.ID === item.Size?.ID &&
          c.Product_Color?.ID === item["Style_ID.Style_Colour"]?.ID,
      ) || null
    );
  }

  function syncCartButton() {
    const existingCartItem = getExistingCartItem(selectedItem);

    if (existingCartItem) {
      quantity = existingCartItem.Quantity;
      qtyDisplay.value = quantity;
      addToCartBtn.textContent = "Update Cart";
      addToCartBtn.dataset.mode = "update";
      addToCartBtn.dataset.cartId = existingCartItem.ID;
    } else {
      quantity = 1;
      qtyDisplay.value = 1;
      addToCartBtn.textContent = "Add to Cart";
      addToCartBtn.dataset.mode = "add";
      addToCartBtn.dataset.cartId = "";
    }
    hideLoader();
  }

  const header = document.getElementById("catalogue-header-name");
  header.innerHTML = "";
  const backBtn = document.createElement("button");
  backBtn.className = "pd-back-btn";
  backBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12.5 15.8334L6.6667 10L12.5 4.16669" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg> Back to Product catalogue`;
  backBtn.addEventListener("click", closeProductDetail);
  header.appendChild(backBtn);

  const detailWrapper = document.createElement("div");
  detailWrapper.id = "product-detail-wrapper";
  detailWrapper.className = "pd-detail-wrapper";

  const imgCol = document.createElement("div");
  imgCol.className = "pd-img-col";

  const mainImgWrapper = document.createElement("div");
  mainImgWrapper.className = "pd-main-img-wrapper";

  const mainPlaceholder = document.createElement("div");
  mainPlaceholder.id = "pd-main-placeholder";
  mainPlaceholder.className = "img-placeholder";
  mainPlaceholder.innerHTML = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.625 18.7503C15.625 17.369 16.1737 16.0442 17.1505 15.0675C18.1272 14.0907 19.452 13.542 20.8333 13.542C22.2147 13.542 23.5394 14.0907 24.5162 15.0675C25.4929 16.0442 26.0417 17.369 26.0417 18.7503C26.0417 20.1317 25.4929 21.4564 24.5162 22.4332C23.5394 23.4099 22.2147 23.9587 20.8333 23.9587C19.452 23.9587 18.1272 23.4099 17.1505 22.4332C16.1737 21.4564 15.625 20.1317 15.625 18.7503ZM20.8333 15.6253C20.0045 15.6253 19.2097 15.9546 18.6236 16.5406C18.0376 17.1267 17.7083 17.9215 17.7083 18.7503C17.7083 19.5791 18.0376 20.374 18.6236 20.96C19.2097 21.5461 20.0045 21.8753 20.8333 21.8753C21.6621 21.8753 22.457 21.5461 23.043 20.96C23.6291 20.374 23.9583 19.5791 23.9583 18.7503C23.9583 17.9215 23.6291 17.1267 23.043 16.5406C22.457 15.9546 21.6621 15.6253 20.8333 15.6253Z" fill="#9A9797"/>
<path d="M28.3806 7.29199H21.6181C19.3264 7.29199 17.5389 7.29199 16.1077 7.40866C14.6535 7.52741 13.4723 7.77324 12.4098 8.31283C10.6453 9.21172 9.21074 10.6463 8.31185 12.4107C7.77018 13.4732 7.52643 14.6545 7.40768 16.1087C7.29102 17.542 7.29102 19.3253 7.29102 21.6191V28.3816C7.29102 30.3524 7.29102 31.9482 7.36602 33.267C7.37157 33.4017 7.3799 33.5406 7.39102 33.6837L7.39727 33.7482C7.47018 34.7191 7.59518 35.5691 7.82227 36.3441C7.94865 36.7802 8.11185 37.1955 8.31185 37.5899C9.21074 39.3544 10.6453 40.7889 12.4098 41.6878C13.4723 42.2295 14.6535 42.4732 16.1077 42.592C17.5389 42.7087 19.3243 42.7087 21.6181 42.7087H28.3806C30.6723 42.7087 32.4598 42.7087 33.891 42.592C35.3452 42.4732 36.5264 42.2274 37.5889 41.6878C39.3534 40.7889 40.788 39.3544 41.6868 37.5899C42.7202 35.5587 42.7139 33.1045 42.7077 30.8378L42.7056 30.1253L42.7077 28.3816V21.6191C42.7077 19.3274 42.7077 17.5399 42.591 16.1087C42.4723 14.6545 42.2264 13.4732 41.6868 12.4107C40.788 10.6463 39.3534 9.21172 37.5889 8.31283C36.5264 7.77116 35.3452 7.52741 33.891 7.40866C32.4598 7.29199 30.6743 7.29199 28.3806 7.29199ZM9.48477 33.7212L9.47227 33.5753C9.38685 32.267 10.7285 30.9712 11.7202 30.0149C11.8799 29.8621 12.0271 29.7184 12.1618 29.5837C12.6868 29.0545 13.0431 28.8149 13.3618 28.7003C14.0547 28.4471 14.8148 28.4471 15.5077 28.7003C15.8243 28.8149 16.1806 29.0545 16.7056 29.5837C17.2368 30.1191 17.8639 30.8691 18.7556 31.9378C19.0046 32.2373 19.314 32.481 19.6635 32.6529C20.013 32.8247 20.3949 32.921 20.7841 32.9353C21.1734 32.9497 21.5613 32.8818 21.9225 32.7361C22.2837 32.5905 22.6102 32.3703 22.8806 32.0899L29.1368 25.6087C29.3181 25.4212 29.5077 25.2087 29.7035 24.9899C30.4223 24.1857 31.241 23.2691 32.1973 22.9503C32.8377 22.7373 33.5298 22.7373 34.1702 22.9503C35.7806 23.4878 37.2931 25.3024 38.6077 26.8795C39.0952 27.4628 39.5535 28.0149 39.9827 28.4566C40.5056 29.0003 40.6243 29.3128 40.6223 30.0462C40.616 31.8587 40.5806 33.1857 40.466 34.2232C40.3473 35.2753 40.1473 36.0191 39.8306 36.6441C39.1314 38.0166 38.0156 39.1324 36.6431 39.8316C35.9223 40.1982 35.0473 40.4066 33.7223 40.5149C32.3848 40.6253 30.6827 40.6253 28.3327 40.6253H21.666C19.316 40.6253 17.6139 40.6253 16.2785 40.5149C14.9514 40.4066 14.0764 40.1982 13.3556 39.8316C11.891 39.0838 10.7222 37.8628 10.0389 36.367C9.75143 35.6982 9.5806 34.8816 9.48477 33.7212ZM40.6243 26.1253L38.6973 24.1295C38.0454 23.4316 37.3671 22.7589 36.6639 22.1128C36.0744 21.5962 35.5014 21.1982 34.8285 20.9753C33.7608 20.6199 32.6067 20.6199 31.5389 20.9753C30.866 21.1982 30.2931 21.5962 29.7056 22.1128C29.1327 22.6128 28.4806 23.2899 27.6702 24.1295L21.3806 30.642C21.3135 30.7118 21.2324 30.7667 21.1427 30.803C21.0529 30.8393 20.9565 30.8563 20.8597 30.8527C20.7629 30.8492 20.668 30.8252 20.5811 30.7825C20.4943 30.7397 20.4174 30.679 20.3556 30.6045L20.3243 30.567C19.4702 29.5441 18.7868 28.7232 18.1848 28.1149C17.5681 27.4941 16.9556 27.0107 16.2223 26.742C15.0673 26.3197 13.8002 26.3197 12.6452 26.742C11.9118 27.0128 11.3014 27.492 10.6827 28.117C10.2277 28.5858 9.79124 29.0723 9.37435 29.5753V21.667C9.37435 19.317 9.37435 17.6149 9.48477 16.2795C9.5931 14.9524 9.80143 14.0774 10.1681 13.3566C10.8673 11.9841 11.9831 10.8682 13.3556 10.1691C14.0764 9.80241 14.9514 9.59408 16.2785 9.48574C17.6139 9.37533 19.316 9.37533 21.666 9.37533H28.3327C30.6827 9.37533 32.3848 9.37533 33.7202 9.48574C35.0473 9.59408 35.9223 9.80241 36.6431 10.1691C38.0156 10.8682 39.1314 11.9841 39.8306 13.3566C40.1973 14.0774 40.4056 14.9524 40.5139 16.2795C40.6243 17.6149 40.6243 19.317 40.6243 21.667V26.1253Z" fill="#9A9797"/>
</svg>
`;

  const mainImg = document.createElement("img");
  mainImg.id = "pd-main-img";
  mainImg.className = "pd-main-img hidden";

  if (firstItem["Style_ID.Primary_Image"]) {
    const cacheKey = firstItem["Style_ID.ID"];
    if (imageCache.has(cacheKey)) {
      mainImg.src = imageCache.get(cacheKey);
      mainImg.classList.remove("hidden");
      mainPlaceholder.classList.add("hidden");
    } else {
      ZOHO.CREATOR.UTIL.setImageData(
        mainImg,
        firstItem["Style_ID.Primary_Image"],
        function () {
          imageCache.set(cacheKey, mainImg.src);
          mainImg.classList.remove("hidden");
          mainPlaceholder.classList.add("hidden");
        },
      );
    }
  }

  mainImgWrapper.appendChild(mainPlaceholder);
  mainImgWrapper.appendChild(mainImg);

  const qtyRow = document.createElement("div");
  qtyRow.id = "pd-qty-row";
  qtyRow.className = "pd-qty-row";

  const qtyMinus = document.createElement("button");
  qtyMinus.className = "pd-qty-btn";
  qtyMinus.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 8.625H3.75" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;

  const qtyDisplay = document.createElement("input");
  qtyDisplay.setAttribute("type", "number");
  qtyDisplay.id = "pd-qty-display";
  qtyDisplay.className = "pd-qty-display";
  qtyDisplay.value = quantity;
  qtyDisplay.min = 1;

  qtyDisplay.addEventListener("keydown", (e) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
  });

  qtyDisplay.addEventListener("blur", () => {
    if (!qtyDisplay.value || parseInt(qtyDisplay.value) < 1) {
      qtyDisplay.value = 1;
      quantity = 1;
    } else quantity = qtyDisplay.value;
  });

  const qtyPlus = document.createElement("button");
  qtyPlus.className = "pd-qty-btn";
  qtyPlus.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.625 3.75V13.5M13.5 8.625H3.75" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;

  qtyMinus.addEventListener("click", () => {
    if (quantity > 1) {
      quantity--;
      qtyDisplay.value = quantity;
    }
  });
  qtyPlus.addEventListener("click", () => {
    quantity++;
    qtyDisplay.value = quantity;
  });

  qtyRow.appendChild(qtyMinus);
  qtyRow.appendChild(qtyDisplay);
  qtyRow.appendChild(qtyPlus);

  const addToCartWrapper = document.createElement("div");
  addToCartWrapper.className = "add-btn-wrapper";
  addToCartWrapper.appendChild(qtyRow);

  const addToCartBtn = document.createElement("button");
  addToCartBtn.id = "pd-add-to-cart-btn";
  addToCartBtn.className = "pd-add-to-cart-btn";
  addToCartBtn.textContent = "Add to Cart";
  addToCartBtn.dataset.mode = "add";

  addToCartBtn.addEventListener("click", () => {
    if (addToCartBtn.dataset.mode === "update") {
      updateCart(addToCartBtn.dataset.cartId, selectedItem, quantity);
    } else {
      showLoader();
      addToCart(selectedItem, quantity);
    }
  });
  addToCartWrapper.appendChild(addToCartBtn);

  imgCol.appendChild(mainImgWrapper);
  imgCol.appendChild(addToCartWrapper);

  const infoCol = document.createElement("div");
  infoCol.id = "pd-info-col";
  infoCol.className = "pd-info-col";

  const productName = document.createElement("h2");
  productName.className = "pd-product-name";
  productName.textContent = firstItem.Style_Name?.Style_Name || "—";

  const productPrice = document.createElement("p");
  productPrice.className = "pd-product-price";
  productPrice.id = "pd-product-price";
  productPrice.textContent = `${buyerCurrency} ${firstItem.Sell_Price}`;

  const sizeHeader = document.createElement("div");
  sizeHeader.className = "pd-size-header";

  const sizesLabel = document.createElement("p");
  sizesLabel.className = "pd-label";
  sizesLabel.innerHTML = `Select Size <p class='size-chart' onclick="openSizeChart()">Size Chart <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 15L12.5 10L7.5 5" stroke="#29379E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</p>`;
  sizeHeader.appendChild(sizesLabel);

  const sizesRow = document.createElement("div");
  sizesRow.id = "pd-sizes-row";
  sizesRow.className = "pd-sizes-row";

  const sizeTooltip = document.createElement("div");
  sizeTooltip.id = "pd-size-tooltip";
  sizeTooltip.className = "pd-size-tooltip hidden";

  function showSizeTooltip(size, anchorBtn) {
    const match = regionalCodeData?.find((r) => r.Size === size);

    if (!match) {
      sizeTooltip.classList.add("hidden");
      return;
    }

    const regional_value = match.Size_Chart_Details?.find((r) =>
      r.zc_display_value.includes(buyerRegion),
    );

    if (!regional_value) {
      sizeTooltip.classList.add("hidden");
      return;
    }

    const btnRect = anchorBtn.getBoundingClientRect();
    const tooltipParentRect = sizeTooltip.parentElement.getBoundingClientRect();
    const arrowLeft =
      btnRect.left - tooltipParentRect.left + anchorBtn.offsetWidth / 2;

    sizeTooltip.style.setProperty("--arrow-left", `${arrowLeft}px`);

    let html = `<p class="tooltip-regional">Equivalent Regional size : <strong>${regional_value.zc_display_value || "—"}</strong></p><p class="tooltip-row">${match.Chart_Details}</p>`;

    sizeTooltip.innerHTML = html;
    sizeTooltip.classList.remove("hidden");
  }

  const colorsLabel = document.createElement("p");
  colorsLabel.className = "pd-label";
  colorsLabel.textContent = "Select Colour";

  const colorsRow = document.createElement("div");
  colorsRow.id = "pd-colors-row";
  colorsRow.className = "pd-colors-row";

  function updateSelectedItem() {
    const match = group.find(
      (item) =>
        item.Size?.Size === selectedSize &&
        item["Colors.Hex_Color_Code"] === selectedColor,
    );
    if (!match) return;

    selectedItem = match;

    document.getElementById("pd-product-price").textContent =
      `${buyerCurrency} ${match.Sell_Price}`;
    document.getElementById("pd-description").textContent =
      match["Style_ID.Product_Description"] || "";

    mainImgWrapper.classList.add("loading");
    mainImg.classList.add("hidden");
    mainPlaceholder.classList.remove("hidden");
    setSelectorsDisabled(true);

    if (match["Style_ID.Primary_Image"]) {
      console.log(match["Style_ID.Primary_Image"]);
      const cacheKey = match["Style_ID.ID"];
      if (imageCache.has(cacheKey)) {
        mainImg.src = imageCache.get(cacheKey);
        mainImgWrapper.classList.remove("loading");
        mainImg.classList.remove("hidden");
        mainPlaceholder.classList.add("hidden");
        setSelectorsDisabled(false);
      } else {
        ZOHO.CREATOR.UTIL.setImageData(
          mainImg,
          match["Style_ID.Primary_Image"],
          function () {
            imageCache.set(cacheKey, mainImg.src);
            mainImgWrapper.classList.remove("loading");
            mainImg.classList.remove("hidden");
            mainPlaceholder.classList.add("hidden");
          },
        );
      }
      mainImg.onload = () => {
        mainImgWrapper.classList.remove("loading");
        mainImg.classList.remove("hidden");
        mainPlaceholder.classList.add("hidden");
        setSelectorsDisabled(false);
      };
      mainImg.onerror = () => {
        mainImgWrapper.classList.remove("loading");
        mainImg.classList.add("hidden");
        mainPlaceholder.classList.remove("hidden");
        setSelectorsDisabled(false);
      };
    } else {
      mainImgWrapper.classList.remove("loading");
      mainImg.classList.add("hidden");
      mainPlaceholder.classList.remove("hidden");
      setSelectorsDisabled(false);
    }

    syncCartButton();
  }

  function renderColors(forSize) {
    colorsRow.innerHTML = "";

    const availableColors = [
      ...new Map(
        group
          .filter((item) => item.Size?.Size === forSize)
          .map((item) => [item["Colors.Hex_Color_Code"], item]),
      ).values(),
    ];

    selectedColor = availableColors[0]?.["Colors.Hex_Color_Code"] || null;

    availableColors.forEach((item, i) => {
      const colorWrapper = document.createElement("div");
      colorWrapper.className = "pd-color-wrapper";

      const colorBtn = document.createElement("button");
      colorBtn.id = `pd-color-${i}`;
      colorBtn.className = "pd-color-btn" + (i === 0 ? " active" : "");
      colorBtn.style.background = item["Colors.Hex_Color_Code"];
      colorBtn.title = item["Colors.Color_Name"] || "";

      colorBtn.addEventListener("click", () => {
        Array.from(colorsRow.querySelectorAll(".pd-color-btn")).forEach((b) =>
          b.classList.remove("active"),
        );
        colorBtn.classList.add("active");
        selectedColor = item["Colors.Hex_Color_Code"];
        updateSelectedItem();
      });

      colorWrapper.appendChild(colorBtn);
      colorsRow.appendChild(colorWrapper);
    });

    updateSelectedItem();
  }

  const sizes = [
    ...new Map(group.map((item) => [item.Size?.Size, item])).values(),
  ];
  sizes.forEach((item, i) => {
    const sizeBtn = document.createElement("button");
    sizeBtn.id = `pd-size-${i}`;
    sizeBtn.className = "pd-size-btn" + (i === 0 ? " active" : "");
    sizeBtn.textContent = item.Size?.Size || "—";
    sizeBtn.addEventListener("click", () => {
      Array.from(sizesRow.children).forEach((b) =>
        b.classList.remove("active"),
      );
      sizeBtn.classList.add("active");
      selectedSize = item.Size?.Size;
      showSizeTooltip(selectedSize, sizeBtn);
      renderColors(selectedSize);
    });
    sizesRow.appendChild(sizeBtn);
  });

  const desc = document.createElement("p");
  desc.id = "pd-description";
  desc.textContent = firstItem["Style_ID.Product_Description"] || "";

  infoCol.appendChild(productName);
  infoCol.appendChild(productPrice);
  infoCol.appendChild(sizeHeader);
  infoCol.appendChild(sizesRow);
  infoCol.appendChild(sizeTooltip);
  infoCol.appendChild(colorsLabel);
  infoCol.appendChild(colorsRow);
  infoCol.appendChild(desc);

  detailWrapper.appendChild(imgCol);
  detailWrapper.appendChild(infoCol);
  leftGridView.appendChild(detailWrapper);

  renderColors(selectedSize);

  function setSelectorsDisabled(disabled) {
    Array.from(sizesRow.querySelectorAll(".pd-size-btn")).forEach(
      (b) => (b.disabled = disabled),
    );
    Array.from(colorsRow.querySelectorAll(".pd-color-btn")).forEach(
      (b) => (b.disabled = disabled),
    );
  }

  const firstSizeBtn = sizesRow.querySelector(".pd-size-btn");
  if (firstSizeBtn) showSizeTooltip(selectedSize, firstSizeBtn);
}

function showToast(message, type = "success") {
  const existing = document.getElementById("toast-msg");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast-msg";
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("toast-visible"), 10);
  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function closeProductDetail() {
  const detailWrapper = document.getElementById("product-detail-wrapper");
  if (detailWrapper) detailWrapper.remove();

  const header = document.getElementById("catalogue-header-name");
  header.innerHTML = "";
  header.textContent = "Product catalogue";
}

function openSizeChart() {
  const sizeChartDiv = document.createElement("div");
  sizeChartDiv.id = "size-chart-wrapper";

  const sizeChartDivContainer = document.createElement("div");
  sizeChartDivContainer.className = "size-chart-container";
  const sizeChartHeader = document.createElement("div");
  sizeChartHeader.className = "chart-chart-header";
  sizeChartHeader.innerHTML = `<span class='close-size-chart' onclick='closeSizeChart()'><svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 21L10.5 14L17.5 7" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span> Size Chart`;
  sizeChartDivContainer.appendChild(sizeChartHeader);

  const imgContainer = document.createElement("div");
  imgContainer.className = "img-container";

  const menImage = document.createElement("img");
  menImage.style.marginBottom = "14px";
  menImage.className = "size-chart-img";
  menImage.src = "./assets/men.png";
  imgContainer.appendChild(menImage);

  const womenImage = document.createElement("img");
  womenImage.className = "size-chart-img";
  womenImage.src = "./assets/women.png";
  imgContainer.appendChild(womenImage);

  sizeChartDivContainer.appendChild(imgContainer);
  sizeChartDiv.appendChild(sizeChartDivContainer);
  document.body.append(sizeChartDiv);
}

function closeSizeChart() {
  const sizeChartDiv = document.getElementById("size-chart-wrapper");
  if (sizeChartDiv) {
    sizeChartDiv.remove();
  }
}
// Helper: Debounce function
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function addToCart(item, quantity) {
  const addToCartBtn = document.getElementById("pd-add-to-cart-btn");
  addToCartBtn.disabled = true;
  addToCartBtn.textContent = "Adding...";

  const qty = parseInt(quantity);
  const unitPrice = parseFloat(item.Sell_Price);
  const subTotal = qty * unitPrice;

  const config = {
    form_name: "Order_Details",
    payload: {
      data: {
               Product: item.Style_Name.ID,
        Quantity: qty,
        Supplier: currentSupplier,
        Product_Color: item["Style_ID.Style_Colour"].ID,
        Product_Size: item.Size.ID,
        Sub_Total: subTotal,
        Description: item["Style_ID.Product_Description"],
      },
    },
    result: true,
  };

  ZOHO.CREATOR.DATA.addRecords(config)
    .then(function (response) {
      if (response.code == 3000) {
        const newRecord = response.data;

        const newCartItem = {
          ID: newRecord.ID,
          Quantity: qty,
          Sub_Total: subTotal,
          Product: {
            ID: item.Style_Name.ID,
            Style_Name: item.Style_Name.Style_Name,
          },
          "Product.Style_Master_Code": item["Style_ID.Style_Master_Code"],
          "Product.Primary_Image": item["Style_ID.Primary_Image"],
          "Product.Style_Category": item["Style_Name.Style_Category"],
          Product_Size: item.Size,
          Product_Color: item.Colors,
        };

        cartDetails.push(newCartItem);

        addToCartBtn.dataset.mode = "update";
        addToCartBtn.dataset.cartId = newRecord.ID;
        addToCartBtn.textContent = "Update Cart";
        addToCartBtn.disabled = false;

        const emptyState = cartPanelDiv.querySelector(".cart-empty");
        if (emptyState) {
          renderCartDetails(cartDetails);
        } else {
          const cartList = cartPanelDiv.querySelector(".cart-list");
          const noItems = cartList?.querySelector(".cart-no-items");
          if (noItems) noItems.remove();
          appendCartRow(newCartItem, cartList);
        }

        hideLoader();

        setTimeout(() => {
          const newRow = cartPanelDiv.querySelector(
            `.cart-item[data-id="${newRecord.ID}"]`,
          );
          if (newRow) {
            newRow.scrollIntoView({ behavior: "smooth", block: "end" });
          }
        }, 100);
      } else {
        console.error("Failed to add to cart:", response);
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = "Add to Cart";
        hideLoader();
      }
    })
    .catch(function (err) {
      console.error("Error adding to cart:", err);
      addToCartBtn.disabled = false;
      addToCartBtn.textContent = "Add to Cart";
      hideLoader();
    });
}

function updateCart(cartItemId, item, quantity) {
  const addToCartBtn = document.getElementById("pd-add-to-cart-btn");
  addToCartBtn.disabled = true;
  addToCartBtn.textContent = "Updating...";

  const qty = parseInt(quantity);
  const unitPrice = parseFloat(item.Sell_Price);
  const subTotal = qty * unitPrice;

  const config = {
    report_name: "Cart_Details_Widget",
    id: cartItemId,
    payload: {
      data: {
        Quantity: qty,
        Sub_Total: subTotal,
      },
    },
  };

  ZOHO.CREATOR.DATA.updateRecordById(config)
    .then(function (response) {
      if (response.code == 3000) {
        const cartItem = cartDetails.find((c) => c.ID === cartItemId);
        if (cartItem) {
          cartItem.Quantity = qty;
          cartItem.Sub_Total = subTotal;
        }

        const qtyEl = document.getElementById(`qty-${cartItemId}`);
        const row = document.querySelector(
          `.cart-item[data-id="${cartItemId}"]`,
        );
        if (qtyEl) qtyEl.value = qty;
        if (row) {
          const priceEl = row.querySelector(".cart-item-price");
          if (priceEl) {
            priceEl.textContent = `${buyerCurrency} ${subTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
          }
        }

        addToCartBtn.disabled = false;
        addToCartBtn.textContent = "Update Cart";
      } else {
        console.error("Failed to update cart:", response);
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = "Update Cart";
      }
    })
    .catch(function (err) {
      console.error("Error updating cart:", err);
      addToCartBtn.disabled = false;
      addToCartBtn.textContent = "Update Cart";
    });
}

function renderCartDetails(data) {
  const cartTitle = cartPanelDiv.querySelector(".cart-title");
  cartPanelDiv.innerHTML = "";
  cartPanelDiv.appendChild(cartTitle);

  if (!data || data.length === 0) {
    const emptyCart = document.createElement("div");
    emptyCart.className = "cart-empty";
    emptyCart.innerHTML = `
            <span class="cart-icon">
                <svg width="71" height="79" viewBox="0 0 71 79" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M52.4835 58.2068H34.9659C32.2074 58.2068 29.8286 56.2682 29.2719 53.5665L26 38H56.4008C59.2229 38 61.3015 40.6402 60.6393 43.3835L58.1348 53.7574C57.5046 56.3677 55.1688 58.2068 52.4835 58.2068Z" fill="#C9D0FF"/>
                    <path d="M11.334 22.7588H16.2369C18.3058 22.7588 20.0898 24.2127 20.5074 26.239L25.1762 48.8955C25.7329 51.5973 28.1116 53.5358 30.8702 53.5358H48.3878C51.073 53.5358 53.4089 51.6968 54.0391 49.0865L56.5435 38.7125C57.2058 35.9693 55.1272 33.3291 52.3051 33.3291H21.9043M30.3605 65.0399C30.3605 66.2074 29.414 67.1539 28.2464 67.1539C27.0789 67.1539 26.1324 66.2074 26.1324 65.0399C26.1324 63.8723 27.0789 62.9258 28.2464 62.9258C29.414 62.9258 30.3605 63.8723 30.3605 65.0399ZM53.6151 65.0399C53.6151 66.2074 52.6686 67.1539 51.501 67.1539C50.3335 67.1539 49.387 66.2074 49.387 65.0399C49.387 63.8723 50.3335 62.9258 51.501 62.9258C52.6686 62.9258 53.6151 63.8723 53.6151 65.0399Z" stroke="#8A96ED" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M47.175 23.6585L47.3402 23.5342C47.9445 23.0795 48.6567 22.7897 49.4068 22.6933C50.157 22.597 50.9193 22.6974 51.619 22.9848L52.2341 23.2373C52.9518 23.532 53.7337 23.6349 54.5032 23.5361C55.2727 23.4372 56.0033 23.1399 56.6231 22.6734C58.5968 21.1882 58.9932 18.3834 57.5078 16.4094L57.255 16.0734C55.6299 13.9138 52.5618 13.4804 50.4022 15.1056L50.1815 15.2717M44.3944 25.7509L43.6992 26.274" stroke="#B9C1FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M35.5008 19.6852V19.4643C35.5008 18.6558 35.711 17.8613 36.1109 17.1586C36.5108 16.4559 37.0865 15.8693 37.7816 15.4564L38.3927 15.0933C39.1057 14.6697 39.6962 14.068 40.1064 13.3472C40.5165 12.6264 40.7321 11.8113 40.732 10.9819C40.732 8.34152 38.5911 6.2002 35.9503 6.2002H35.5008C32.6116 6.2002 30.2695 8.54225 30.2695 11.4314V11.7267M35.5008 23.4052V24.3352" stroke="#8A96ED" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </span>
            <p>Cart is Empty. Add product</p>
        `;
    cartPanelDiv.appendChild(emptyCart);
    return;
  }

  // Filter toggle
  const filterBar = document.createElement("div");
  filterBar.className = "cart-filter-bar";
  filterBar.innerHTML = `
        <button class="cart-filter-btn active" data-filter="all">
            All Category
        </button>
        <button class="cart-filter-btn" data-filter="current">This Category</button>
    `;
  cartPanelDiv.appendChild(filterBar);

  const cartList = document.createElement("div");
  cartList.className = "cart-list";
  cartimageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const imageData = img.dataset.imageData;
          const cacheKey = img.dataset.cacheKey;
          const placeholder = img.previousElementSibling;

          if (!imageData) return;

          if (imageCache.has(cacheKey)) {
            img.src = imageCache.get(cacheKey);
            img.classList.remove("img-hidden");
            if (placeholder) placeholder.classList.add("hidden");
          } else {
            ZOHO.CREATOR.UTIL.setImageData(img, imageData, function () {
              imageCache.set(cacheKey, img.src);
              img.classList.remove("img-hidden");
              if (placeholder) placeholder.classList.add("hidden");
            });
          }

          cartimageObserver.unobserve(img);
        }
      });
    },
    { root: cartList, rootMargin: "200px 0px", threshold: 0 },
  );
  cartPanelDiv.appendChild(cartList);

  const cartFooter = document.createElement("div");
  cartFooter.className = "cart-footer";
  cartFooter.innerHTML = `
        <button class="cart-btn-reset" onclick="resetCart()">Reset Cart</button>
        <button class="cart-btn-submit" onclick="submitCart()">Review</button>
    `;
  cartPanelDiv.appendChild(cartFooter);

  filterBar.querySelectorAll(".cart-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBar
        .querySelectorAll(".cart-filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      renderCartItems(cartDetails, cartList, filter);
    });
  });

  renderCartItems(cartDetails, cartList, "all");
}

function updateCartOnChange(cartItemId, itemPrice, quantity, callbacks = {}) {
  const unitPrice = parseFloat(itemPrice);
  const subTotal = quantity * unitPrice;

  const config = {
    report_name: "Cart_Details_Widget",
    id: cartItemId,
    payload: {
      data: {
        Quantity: quantity,
        Sub_Total: subTotal,
      },
    },
  };

  ZOHO.CREATOR.DATA.updateRecordById(config)
    .then(function (response) {
      if (response.code == 3000) {
        const cartItem = cartDetails.find((c) => c.ID === cartItemId);
        if (cartItem) {
          cartItem.Quantity = quantity;
          cartItem.Sub_Total = subTotal;
        }

        const row = document.querySelector(
          `.cart-item[data-id="${cartItemId}"]`,
        );
        if (row) {
          const priceEl = row.querySelector(".cart-item-price");
          if (priceEl) {
            priceEl.textContent = `${buyerCurrency} ${subTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
          }
        }

        callbacks.onSuccess?.();
      } else {
        console.error("Failed to update cart:", response);
        callbacks.onError?.();
      }
    })
    .catch(function (err) {
      console.error("Error updating cart:", err);
      callbacks.onError?.();
    });
}

function renderCartItems(data, container, filter) {
  container.innerHTML = "";
  const filtered =
    filter === "current"
      ? data.filter(
          (item) => item["Product.Style_Category"]?.ID === currentCategory,
        )
      : data;

  const cartFooter = cartPanelDiv.querySelector(".cart-footer");
  if (filtered.length === 0) {
    if (cartFooter) cartFooter.style.display = "none";
    const emptyCart = document.createElement("div");
    emptyCart.className = "cart-empty";
    emptyCart.innerHTML = `
            <span class="cart-icon">
                <svg width="71" height="79" viewBox="0 0 71 79" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M52.4835 58.2068H34.9659C32.2074 58.2068 29.8286 56.2682 29.2719 53.5665L26 38H56.4008C59.2229 38 61.3015 40.6402 60.6393 43.3835L58.1348 53.7574C57.5046 56.3677 55.1688 58.2068 52.4835 58.2068Z" fill="#C9D0FF"/>
                    <path d="M11.334 22.7588H16.2369C18.3058 22.7588 20.0898 24.2127 20.5074 26.239L25.1762 48.8955C25.7329 51.5973 28.1116 53.5358 30.8702 53.5358H48.3878C51.073 53.5358 53.4089 51.6968 54.0391 49.0865L56.5435 38.7125C57.2058 35.9693 55.1272 33.3291 52.3051 33.3291H21.9043M30.3605 65.0399C30.3605 66.2074 29.414 67.1539 28.2464 67.1539C27.0789 67.1539 26.1324 66.2074 26.1324 65.0399C26.1324 63.8723 27.0789 62.9258 28.2464 62.9258C29.414 62.9258 30.3605 63.8723 30.3605 65.0399ZM53.6151 65.0399C53.6151 66.2074 52.6686 67.1539 51.501 67.1539C50.3335 67.1539 49.387 66.2074 49.387 65.0399C49.387 63.8723 50.3335 62.9258 51.501 62.9258C52.6686 62.9258 53.6151 63.8723 53.6151 65.0399Z" stroke="#8A96ED" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M47.175 23.6585L47.3402 23.5342C47.9445 23.0795 48.6567 22.7897 49.4068 22.6933C50.157 22.597 50.9193 22.6974 51.619 22.9848L52.2341 23.2373C52.9518 23.532 53.7337 23.6349 54.5032 23.5361C55.2727 23.4372 56.0033 23.1399 56.6231 22.6734C58.5968 21.1882 58.9932 18.3834 57.5078 16.4094L57.255 16.0734C55.6299 13.9138 52.5618 13.4804 50.4022 15.1056L50.1815 15.2717M44.3944 25.7509L43.6992 26.274" stroke="#B9C1FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M35.5008 19.6852V19.4643C35.5008 18.6558 35.711 17.8613 36.1109 17.1586C36.5108 16.4559 37.0865 15.8693 37.7816 15.4564L38.3927 15.0933C39.1057 14.6697 39.6962 14.068 40.1064 13.3472C40.5165 12.6264 40.7321 11.8113 40.732 10.9819C40.732 8.34152 38.5911 6.2002 35.9503 6.2002H35.5008C32.6116 6.2002 30.2695 8.54225 30.2695 11.4314V11.7267M35.5008 23.4052V24.3352" stroke="#8A96ED" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </span>
            <p>No items in this category.</p>
        `;
    container.appendChild(emptyCart);
    return;
  }

  if (cartFooter) cartFooter.style.display = "flex";
  filtered.forEach((item) => appendCartRow(item, container));
}

function updateCartOnChange(cartItemId, itemPrice, quantity, callbacks = {}) {
  const unitPrice = parseFloat(itemPrice);
  const subTotal = quantity * unitPrice;

  const config = {
    report_name: "Cart_Details_Widget",
    id: cartItemId,
    payload: {
      data: {
        Quantity: quantity,
        Sub_Total: subTotal,
      },
    },
  };

  ZOHO.CREATOR.DATA.updateRecordById(config)
    .then(function (response) {
      if (response.code == 3000) {
        const cartItem = cartDetails.find((c) => c.ID === cartItemId);
        if (cartItem) {
          cartItem.Quantity = quantity;
          cartItem.Sub_Total = subTotal;
        }

        const row = document.querySelector(
          `.cart-item[data-id="${cartItemId}"]`,
        );
        if (row) {
          const priceEl = row.querySelector(".cart-item-price");
          if (priceEl) {
            priceEl.textContent = `${buyerCurrency} ${subTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
          }
        }

        callbacks.onSuccess?.();
      } else {
        console.error("Failed to update cart:", response);
        callbacks.onError?.();
      }
    })
    .catch(function (err) {
      console.error("Error updating cart:", err);
      callbacks.onError?.();
    });
}

function renderCartItems(data, container, filter) {
  container.innerHTML = "";
  const filtered =
    filter === "current"
      ? data.filter(
          (item) => item["Product.Style_Category"]?.ID === currentCategory,
        )
      : data;

  const cartFooter = cartPanelDiv.querySelector(".cart-footer");
  if (filtered.length === 0) {
    if (cartFooter) cartFooter.style.display = "none";
    const emptyCart = document.createElement("div");
    emptyCart.className = "cart-empty";
    emptyCart.innerHTML = `
            <span class="cart-icon">
                <svg width="71" height="79" viewBox="0 0 71 79" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M52.4835 58.2068H34.9659C32.2074 58.2068 29.8286 56.2682 29.2719 53.5665L26 38H56.4008C59.2229 38 61.3015 40.6402 60.6393 43.3835L58.1348 53.7574C57.5046 56.3677 55.1688 58.2068 52.4835 58.2068Z" fill="#C9D0FF"/>
                    <path d="M11.334 22.7588H16.2369C18.3058 22.7588 20.0898 24.2127 20.5074 26.239L25.1762 48.8955C25.7329 51.5973 28.1116 53.5358 30.8702 53.5358H48.3878C51.073 53.5358 53.4089 51.6968 54.0391 49.0865L56.5435 38.7125C57.2058 35.9693 55.1272 33.3291 52.3051 33.3291H21.9043M30.3605 65.0399C30.3605 66.2074 29.414 67.1539 28.2464 67.1539C27.0789 67.1539 26.1324 66.2074 26.1324 65.0399C26.1324 63.8723 27.0789 62.9258 28.2464 62.9258C29.414 62.9258 30.3605 63.8723 30.3605 65.0399ZM53.6151 65.0399C53.6151 66.2074 52.6686 67.1539 51.501 67.1539C50.3335 67.1539 49.387 66.2074 49.387 65.0399C49.387 63.8723 50.3335 62.9258 51.501 62.9258C52.6686 62.9258 53.6151 63.8723 53.6151 65.0399Z" stroke="#8A96ED" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M47.175 23.6585L47.3402 23.5342C47.9445 23.0795 48.6567 22.7897 49.4068 22.6933C50.157 22.597 50.9193 22.6974 51.619 22.9848L52.2341 23.2373C52.9518 23.532 53.7337 23.6349 54.5032 23.5361C55.2727 23.4372 56.0033 23.1399 56.6231 22.6734C58.5968 21.1882 58.9932 18.3834 57.5078 16.4094L57.255 16.0734C55.6299 13.9138 52.5618 13.4804 50.4022 15.1056L50.1815 15.2717M44.3944 25.7509L43.6992 26.274" stroke="#B9C1FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M35.5008 19.6852V19.4643C35.5008 18.6558 35.711 17.8613 36.1109 17.1586C36.5108 16.4559 37.0865 15.8693 37.7816 15.4564L38.3927 15.0933C39.1057 14.6697 39.6962 14.068 40.1064 13.3472C40.5165 12.6264 40.7321 11.8113 40.732 10.9819C40.732 8.34152 38.5911 6.2002 35.9503 6.2002H35.5008C32.6116 6.2002 30.2695 8.54225 30.2695 11.4314V11.7267M35.5008 23.4052V24.3352" stroke="#8A96ED" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </span>
            <p>No items in this category.</p>
        `;
    container.appendChild(emptyCart);
    return;
  }

  if (cartFooter) cartFooter.style.display = "flex";
  filtered.forEach((item) => appendCartRow(item, container));
}

function appendCartRow(item, container) {
  const row = document.createElement("div");
  row.className = "cart-item";
  row.dataset.id = item.ID;
  row.dataset.price = item.Sub_Total / item.Quantity;

  const cartImgWrapper = document.createElement("div");
  cartImgWrapper.className = "cart-item-img";

  const placeholder = document.createElement("div");
  placeholder.className = "img-placeholder";
  placeholder.innerHTML = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.625 18.7503C15.625 17.369 16.1737 16.0442 17.1505 15.0675C18.1272 14.0907 19.452 13.542 20.8333 13.542C22.2147 13.542 23.5394 14.0907 24.5162 15.0675C25.4929 16.0442 26.0417 17.369 26.0417 18.7503C26.0417 20.1317 25.4929 21.4564 24.5162 22.4332C23.5394 23.4099 22.2147 23.9587 20.8333 23.9587C19.452 23.9587 18.1272 23.4099 17.1505 22.4332C16.1737 21.4564 15.625 20.1317 15.625 18.7503ZM20.8333 15.6253C20.0045 15.6253 19.2097 15.9546 18.6236 16.5406C18.0376 17.1267 17.7083 17.9215 17.7083 18.7503C17.7083 19.5791 18.0376 20.374 18.6236 20.96C19.2097 21.5461 20.0045 21.8753 20.8333 21.8753C21.6621 21.8753 22.457 21.5461 23.043 20.96C23.6291 20.374 23.9583 19.5791 23.9583 18.7503C23.9583 17.9215 23.6291 17.1267 23.043 16.5406C22.457 15.9546 21.6621 15.6253 20.8333 15.6253Z" fill="#9A9797"/>
<path d="M28.3806 7.29199H21.6181C19.3264 7.29199 17.5389 7.29199 16.1077 7.40866C14.6535 7.52741 13.4723 7.77324 12.4098 8.31283C10.6453 9.21172 9.21074 10.6463 8.31185 12.4107C7.77018 13.4732 7.52643 14.6545 7.40768 16.1087C7.29102 17.542 7.29102 19.3253 7.29102 21.6191V28.3816C7.29102 30.3524 7.29102 31.9482 7.36602 33.267C7.37157 33.4017 7.3799 33.5406 7.39102 33.6837L7.39727 33.7482C7.47018 34.7191 7.59518 35.5691 7.82227 36.3441C7.94865 36.7802 8.11185 37.1955 8.31185 37.5899C9.21074 39.3544 10.6453 40.7889 12.4098 41.6878C13.4723 42.2295 14.6535 42.4732 16.1077 42.592C17.5389 42.7087 19.3243 42.7087 21.6181 42.7087H28.3806C30.6723 42.7087 32.4598 42.7087 33.891 42.592C35.3452 42.4732 36.5264 42.2274 37.5889 41.6878C39.3534 40.7889 40.788 39.3544 41.6868 37.5899C42.7202 35.5587 42.7139 33.1045 42.7077 30.8378L42.7056 30.1253L42.7077 28.3816V21.6191C42.7077 19.3274 42.7077 17.5399 42.591 16.1087C42.4723 14.6545 42.2264 13.4732 41.6868 12.4107C40.788 10.6463 39.3534 9.21172 37.5889 8.31283C36.5264 7.77116 35.3452 7.52741 33.891 7.40866C32.4598 7.29199 30.6743 7.29199 28.3806 7.29199ZM9.48477 33.7212L9.47227 33.5753C9.38685 32.267 10.7285 30.9712 11.7202 30.0149C11.8799 29.8621 12.0271 29.7184 12.1618 29.5837C12.6868 29.0545 13.0431 28.8149 13.3618 28.7003C14.0547 28.4471 14.8148 28.4471 15.5077 28.7003C15.8243 28.8149 16.1806 29.0545 16.7056 29.5837C17.2368 30.1191 17.8639 30.8691 18.7556 31.9378C19.0046 32.2373 19.314 32.481 19.6635 32.6529C20.013 32.8247 20.3949 32.921 20.7841 32.9353C21.1734 32.9497 21.5613 32.8818 21.9225 32.7361C22.2837 32.5905 22.6102 32.3703 22.8806 32.0899L29.1368 25.6087C29.3181 25.4212 29.5077 25.2087 29.7035 24.9899C30.4223 24.1857 31.241 23.2691 32.1973 22.9503C32.8377 22.7373 33.5298 22.7373 34.1702 22.9503C35.7806 23.4878 37.2931 25.3024 38.6077 26.8795C39.0952 27.4628 39.5535 28.0149 39.9827 28.4566C40.5056 29.0003 40.6243 29.3128 40.6223 30.0462C40.616 31.8587 40.5806 33.1857 40.466 34.2232C40.3473 35.2753 40.1473 36.0191 39.8306 36.6441C39.1314 38.0166 38.0156 39.1324 36.6431 39.8316C35.9223 40.1982 35.0473 40.4066 33.7223 40.5149C32.3848 40.6253 30.6827 40.6253 28.3327 40.6253H21.666C19.316 40.6253 17.6139 40.6253 16.2785 40.5149C14.9514 40.4066 14.0764 40.1982 13.3556 39.8316C11.891 39.0838 10.7222 37.8628 10.0389 36.367C9.75143 35.6982 9.5806 34.8816 9.48477 33.7212ZM40.6243 26.1253L38.6973 24.1295C38.0454 23.4316 37.3671 22.7589 36.6639 22.1128C36.0744 21.5962 35.5014 21.1982 34.8285 20.9753C33.7608 20.6199 32.6067 20.6199 31.5389 20.9753C30.866 21.1982 30.2931 21.5962 29.7056 22.1128C29.1327 22.6128 28.4806 23.2899 27.6702 24.1295L21.3806 30.642C21.3135 30.7118 21.2324 30.7667 21.1427 30.803C21.0529 30.8393 20.9565 30.8563 20.8597 30.8527C20.7629 30.8492 20.668 30.8252 20.5811 30.7825C20.4943 30.7397 20.4174 30.679 20.3556 30.6045L20.3243 30.567C19.4702 29.5441 18.7868 28.7232 18.1848 28.1149C17.5681 27.4941 16.9556 27.0107 16.2223 26.742C15.0673 26.3197 13.8002 26.3197 12.6452 26.742C11.9118 27.0128 11.3014 27.492 10.6827 28.117C10.2277 28.5858 9.79124 29.0723 9.37435 29.5753V21.667C9.37435 19.317 9.37435 17.6149 9.48477 16.2795C9.5931 14.9524 9.80143 14.0774 10.1681 13.3566C10.8673 11.9841 11.9831 10.8682 13.3556 10.1691C14.0764 9.80241 14.9514 9.59408 16.2785 9.48574C17.6139 9.37533 19.316 9.37533 21.666 9.37533H28.3327C30.6827 9.37533 32.3848 9.37533 33.7202 9.48574C35.0473 9.59408 35.9223 9.80241 36.6431 10.1691C38.0156 10.8682 39.1314 11.9841 39.8306 13.3566C40.1973 14.0774 40.4056 14.9524 40.5139 16.2795C40.6243 17.6149 40.6243 19.317 40.6243 21.667V26.1253Z" fill="#9A9797"/>
</svg>
`;

  const mainImg = document.createElement("img");
  mainImg.id = "pd-main-img";
  mainImg.className = "pd-main-img hidden";

  if (firstItem["Style_ID.Primary_Image"]) {
    const cacheKey = firstItem["Style_ID.ID"];
    if (imageCache.has(cacheKey)) {
      mainImg.src = imageCache.get(cacheKey);
      mainImg.classList.remove("hidden");
      mainPlaceholder.classList.add("hidden");
    } else {
      ZOHO.CREATOR.UTIL.setImageData(
        mainImg,
        firstItem["Style_ID.Primary_Image"],
        function () {
          imageCache.set(cacheKey, mainImg.src);
          mainImg.classList.remove("hidden");
          mainPlaceholder.classList.add("hidden");
        },
      );
    }
  }

  mainImgWrapper.appendChild(mainPlaceholder);
  mainImgWrapper.appendChild(mainImg);

  const qtyRow = document.createElement("div");
  qtyRow.id = "pd-qty-row";
  qtyRow.className = "pd-qty-row";

  const qtyMinus = document.createElement("button");
  qtyMinus.className = "pd-qty-btn";
  qtyMinus.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 8.625H3.75" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;

  const qtyDisplay = document.createElement("input");
  qtyDisplay.setAttribute("type", "number");
  qtyDisplay.id = "pd-qty-display";
  qtyDisplay.className = "pd-qty-display";
  qtyDisplay.value = quantity;
  qtyDisplay.min = 1;

  qtyDisplay.addEventListener("keydown", (e) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
  });

  qtyDisplay.addEventListener("blur", () => {
    if (!qtyDisplay.value || parseInt(qtyDisplay.value) < 1) {
      qtyDisplay.value = 1;
      quantity = 1;
    } else quantity = qtyDisplay.value;
  });

  const qtyPlus = document.createElement("button");
  qtyPlus.className = "pd-qty-btn";
  qtyPlus.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.625 3.75V13.5M13.5 8.625H3.75" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;

  qtyMinus.addEventListener("click", () => {
    if (quantity > 1) {
      quantity--;
      qtyDisplay.value = quantity;
    }
  });
  qtyPlus.addEventListener("click", () => {
    quantity++;
    qtyDisplay.value = quantity;
  });

  qtyRow.appendChild(qtyMinus);
  qtyRow.appendChild(qtyDisplay);
  qtyRow.appendChild(qtyPlus);

  const addToCartWrapper = document.createElement("div");
  addToCartWrapper.className = "add-btn-wrapper";
  addToCartWrapper.appendChild(qtyRow);

  const addToCartBtn = document.createElement("button");
  addToCartBtn.id = "pd-add-to-cart-btn";
  addToCartBtn.className = "pd-add-to-cart-btn";
  addToCartBtn.textContent = "Add to Cart";
  addToCartBtn.dataset.mode = "add";

  addToCartBtn.addEventListener("click", () => {
    if (addToCartBtn.dataset.mode === "update") {
      updateCart(addToCartBtn.dataset.cartId, selectedItem, quantity);
    } else {
      showLoader();
      addToCart(selectedItem, quantity);
    }
  });
  addToCartWrapper.appendChild(addToCartBtn);

  imgCol.appendChild(mainImgWrapper);
  imgCol.appendChild(addToCartWrapper);

  const infoCol = document.createElement("div");
  infoCol.id = "pd-info-col";
  infoCol.className = "pd-info-col";

  const productName = document.createElement("h2");
  productName.className = "pd-product-name";
  productName.textContent = firstItem.Style_Name?.Style_Name || "—";

  const productPrice = document.createElement("p");
  productPrice.className = "pd-product-price";
  productPrice.id = "pd-product-price";
  productPrice.textContent = `${buyerCurrency} ${firstItem.Sell_Price}`;

  const sizeHeader = document.createElement("div");
  sizeHeader.className = "pd-size-header";

  const sizesLabel = document.createElement("p");
  sizesLabel.className = "pd-label";
  sizesLabel.innerHTML = `Select Size <p class='size-chart' onclick="openSizeChart()">Size Chart <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 15L12.5 10L7.5 5" stroke="#29379E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</p>`;
  sizeHeader.appendChild(sizesLabel);

  const sizesRow = document.createElement("div");
  sizesRow.id = "pd-sizes-row";
  sizesRow.className = "pd-sizes-row";

  const sizeTooltip = document.createElement("div");
  sizeTooltip.id = "pd-size-tooltip";
  sizeTooltip.className = "pd-size-tooltip hidden";

  function showSizeTooltip(size, anchorBtn) {
    const match = regionalCodeData?.find((r) => r.Size === size);

    if (!match) {
      sizeTooltip.classList.add("hidden");
      return;
    }

    const regional_value = match.Size_Chart_Details?.find((r) =>
      r.zc_display_value.includes(buyerRegion),
    );

    if (!regional_value) {
      sizeTooltip.classList.add("hidden");
      return;
    }

    const btnRect = anchorBtn.getBoundingClientRect();
    const tooltipParentRect = sizeTooltip.parentElement.getBoundingClientRect();
    const arrowLeft =
      btnRect.left - tooltipParentRect.left + anchorBtn.offsetWidth / 2;

    sizeTooltip.style.setProperty("--arrow-left", `${arrowLeft}px`);

    let html = `<p class="tooltip-regional">Equivalent Regional size : <strong>${regional_value.zc_display_value || "—"}</strong></p><p class="tooltip-row">${match.Chart_Details}</p>`;

    sizeTooltip.innerHTML = html;
    sizeTooltip.classList.remove("hidden");
  }

  const colorsLabel = document.createElement("p");
  colorsLabel.className = "pd-label";
  colorsLabel.textContent = "Select Colour";

  const colorsRow = document.createElement("div");
  colorsRow.id = "pd-colors-row";
  colorsRow.className = "pd-colors-row";

  function updateSelectedItem() {
    const match = group.find(
      (item) =>
        item.Size?.Size === selectedSize &&
        item["Colors.Hex_Color_Code"] === selectedColor,
    );
    if (!match) return;

    selectedItem = match;

    document.getElementById("pd-product-price").textContent =
      `${buyerCurrency} ${match.Sell_Price}`;
    document.getElementById("pd-description").textContent =
      match["Style_ID.Product_Description"] || "";

    mainImgWrapper.classList.add("loading");
    mainImg.classList.add("hidden");
    mainPlaceholder.classList.remove("hidden");
    setSelectorsDisabled(true);

    if (match["Style_ID.Primary_Image"]) {
      console.log(match["Style_ID.Primary_Image"]);
      const cacheKey = match["Style_ID.ID"];
      if (imageCache.has(cacheKey)) {
        mainImg.src = imageCache.get(cacheKey);
        mainImgWrapper.classList.remove("loading");
        mainImg.classList.remove("hidden");
        mainPlaceholder.classList.add("hidden");
        setSelectorsDisabled(false);
      } else {
        ZOHO.CREATOR.UTIL.setImageData(
          mainImg,
          match["Style_ID.Primary_Image"],
          function () {
            imageCache.set(cacheKey, mainImg.src);
            mainImgWrapper.classList.remove("loading");
            mainImg.classList.remove("hidden");
            mainPlaceholder.classList.add("hidden");
          },
        );
      }
      mainImg.onload = () => {
        mainImgWrapper.classList.remove("loading");
        mainImg.classList.remove("hidden");
        mainPlaceholder.classList.add("hidden");
        setSelectorsDisabled(false);
      };
      mainImg.onerror = () => {
        mainImgWrapper.classList.remove("loading");
        mainImg.classList.add("hidden");
        mainPlaceholder.classList.remove("hidden");
        setSelectorsDisabled(false);
      };
    } else {
      mainImgWrapper.classList.remove("loading");
      mainImg.classList.add("hidden");
      mainPlaceholder.classList.remove("hidden");
      setSelectorsDisabled(false);
    }

    syncCartButton();
  }

  function renderColors(forSize) {
    colorsRow.innerHTML = "";

    const availableColors = [
      ...new Map(
        group
          .filter((item) => item.Size?.Size === forSize)
          .map((item) => [item["Colors.Hex_Color_Code"], item]),
      ).values(),
    ];

    selectedColor = availableColors[0]?.["Colors.Hex_Color_Code"] || null;

    availableColors.forEach((item, i) => {
      const colorWrapper = document.createElement("div");
      colorWrapper.className = "pd-color-wrapper";

      const colorBtn = document.createElement("button");
      colorBtn.id = `pd-color-${i}`;
      colorBtn.className = "pd-color-btn" + (i === 0 ? " active" : "");
      colorBtn.style.background = item["Colors.Hex_Color_Code"];
      colorBtn.title = item["Colors.Color_Name"] || "";

      colorBtn.addEventListener("click", () => {
        Array.from(colorsRow.querySelectorAll(".pd-color-btn")).forEach((b) =>
          b.classList.remove("active"),
        );
        colorBtn.classList.add("active");
        selectedColor = item["Colors.Hex_Color_Code"];
        updateSelectedItem();
      });

      colorWrapper.appendChild(colorBtn);
      colorsRow.appendChild(colorWrapper);
    });

    updateSelectedItem();
  }

  const sizes = [
    ...new Map(group.map((item) => [item.Size?.Size, item])).values(),
  ];
  sizes.forEach((item, i) => {
    const sizeBtn = document.createElement("button");
    sizeBtn.id = `pd-size-${i}`;
    sizeBtn.className = "pd-size-btn" + (i === 0 ? " active" : "");
    sizeBtn.textContent = item.Size?.Size || "—";
    sizeBtn.addEventListener("click", () => {
      Array.from(sizesRow.children).forEach((b) =>
        b.classList.remove("active"),
      );
      sizeBtn.classList.add("active");
      selectedSize = item.Size?.Size;
      showSizeTooltip(selectedSize, sizeBtn);
      renderColors(selectedSize);
    });
    sizesRow.appendChild(sizeBtn);
  });

  const desc = document.createElement("p");
  desc.id = "pd-description";
  desc.textContent = firstItem["Style_ID.Product_Description"] || "";

  infoCol.appendChild(productName);
  infoCol.appendChild(productPrice);
  infoCol.appendChild(sizeHeader);
  infoCol.appendChild(sizesRow);
  infoCol.appendChild(sizeTooltip);
  infoCol.appendChild(colorsLabel);
  infoCol.appendChild(colorsRow);
  infoCol.appendChild(desc);

  detailWrapper.appendChild(imgCol);
  detailWrapper.appendChild(infoCol);
  leftGridView.appendChild(detailWrapper);

  renderColors(selectedSize);

  function setSelectorsDisabled(disabled) {
    Array.from(sizesRow.querySelectorAll(".pd-size-btn")).forEach(
      (b) => (b.disabled = disabled),
    );
    Array.from(colorsRow.querySelectorAll(".pd-color-btn")).forEach(
      (b) => (b.disabled = disabled),
    );
  }

  const firstSizeBtn = sizesRow.querySelector(".pd-size-btn");
  if (firstSizeBtn) showSizeTooltip(selectedSize, firstSizeBtn);
}

function showToast(message, type = "success") {
  const existing = document.getElementById("toast-msg");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast-msg";
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("toast-visible"), 10);
  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function closeProductDetail() {
  const detailWrapper = document.getElementById("product-detail-wrapper");
  if (detailWrapper) detailWrapper.remove();

  const header = document.getElementById("catalogue-header-name");
  header.innerHTML = "";
  header.textContent = "Product catalogue";
}

function openSizeChart() {
  const sizeChartDiv = document.createElement("div");
  sizeChartDiv.id = "size-chart-wrapper";

  const sizeChartDivContainer = document.createElement("div");
  sizeChartDivContainer.className = "size-chart-container";
  const sizeChartHeader = document.createElement("div");
  sizeChartHeader.className = "chart-chart-header";
  sizeChartHeader.innerHTML = `<span class='close-size-chart' onclick='closeSizeChart()'><svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 21L10.5 14L17.5 7" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span> Size Chart`;
  sizeChartDivContainer.appendChild(sizeChartHeader);

  const imgContainer = document.createElement("div");
  imgContainer.className = "img-container";

  const menImage = document.createElement("img");
  menImage.style.marginBottom = "14px";
  menImage.className = "size-chart-img";
  menImage.src = "./assets/men.png";
  imgContainer.appendChild(menImage);

  const womenImage = document.createElement("img");
  womenImage.className = "size-chart-img";
  womenImage.src = "./assets/women.png";
  imgContainer.appendChild(womenImage);

  sizeChartDivContainer.appendChild(imgContainer);
  sizeChartDiv.appendChild(sizeChartDivContainer);
  document.body.append(sizeChartDiv);
}

function closeSizeChart() {
  const sizeChartDiv = document.getElementById("size-chart-wrapper");
  if (sizeChartDiv) {
    sizeChartDiv.remove();
  }
}
