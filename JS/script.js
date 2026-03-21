document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // CDN PARA IMAGENES (anti-carga en EC2)
    // =========================================
    
    const initImageCdnRewrites = async () => {
        const baseUrl = window.IMG_CDN_BASE_URL || document.documentElement.dataset.imgCdnBaseUrl || '';
        const mapUrl = window.IMG_CDN_IMAGE_MAP_URL || document.documentElement.dataset.imgCdnImageMapUrl || '';

        let imageMap = null;
        if (mapUrl) {
            try {
                const r = await fetch(mapUrl, { headers: { 'Accept': 'application/json' } });
                if (r.ok) imageMap = await r.json();
            } catch (_e) {
                imageMap = null;
            }
        }

        if (!baseUrl && !imageMap) return; // No definido: no tocamos nada.
        const normalizedBase = String(baseUrl || '').replace(/\/$/, '');

        const imgs = document.querySelectorAll('img[src]');
        imgs.forEach((img) => {
            const src = img.getAttribute('src') || '';
            const idx = src.indexOf('IMG/');
            if (idx === -1) return;

            const keyPath = src.slice(idx).replace(/\/+/g, '/'); // e.g. "IMG/ROPA/HOMBRE/x.jpg"
            const keyFilename = keyPath.split('/').pop();

            let nextSrc = null;
            if (imageMap && typeof imageMap === 'object') {
                nextSrc =
                    imageMap[keyPath] ||
                    imageMap[keyFilename] ||
                    imageMap[src] ||
                    null;
            }

            if (!nextSrc && normalizedBase) {
                nextSrc = `${normalizedBase}/${keyPath}`;
            }

            if (nextSrc) {
                img.setAttribute('src', nextSrc);
                img.loading = img.loading || 'lazy';
                img.decoding = img.decoding || 'async';
            }
        });
    };

    initImageCdnRewrites();

    // =========================================
    // 1. CONFIGURACIÓN BASE DE DATOS
    // =========================================
    const DB_KEY = 'urbanstyle_cart_v1';
    
    // Estado inicial
    let cartState = {
        items: [],
        total: 0,
        count: 0
    };

    // Referencias DOM (Elementos de la interfaz)
    const cartToggleBtn = document.getElementById('cart-toggle');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsContainer = document.getElementById('cart-items-list');
    const cartTotalElement = document.getElementById('cart-total-price');
    const cartCountElement = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('checkout-btn');
    const productsSection = document.getElementById('products');

    // =========================================
    // 2.1 CATÁLOGO (API)
    // =========================================
    const formatEur = (cents) => `€${(Number(cents || 0) / 100).toFixed(2)}`;

    const renderProductsFromApi = (items) => {
        if (!productsSection) return;

        if (!Array.isArray(items) || items.length === 0) {
            productsSection.innerHTML = '<p class="empty-msg">SYSTEM_EMPTY... <br> No hay productos disponibles.</p>';
            return;
        }

        productsSection.innerHTML = `
          <h2 class="section-title"><span>Productos</span></h2>
          <div class="products-grid" id="products-grid"></div>
        `;

        const grid = document.getElementById('products-grid');
        items.forEach((p) => {
            const price = formatEur(p?.variant?.priceCents);
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
              <div class="product-info">
                <h3 class="product-title">${p.name}</h3>
                <p class="product-desc">${p.description || ''}</p>
                <div class="product-meta">
                  <span class="product-price">${price}</span>
                </div>
                <button class="btn btn-primary add-btn" data-name="${p.name}" data-price-cents="${p?.variant?.priceCents || 0}">
                  AÑADIR AL CARRITO
                </button>
              </div>
            `;
            grid.appendChild(card);
        });
    };

    const loadProducts = async () => {
        if (!productsSection) return;
        productsSection.innerHTML = '<p class="empty-msg">Cargando catálogo...</p>';

        try {
            const res = await fetch('/api/products', { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error(`HTTP_${res.status}`);
            const data = await res.json();
            renderProductsFromApi(data.items);
        } catch (e) {
            productsSection.innerHTML = '<p class="empty-msg">ERROR: No se pudo cargar el catálogo desde la API.</p>';
        }
    };

    // =========================================
    // 2. FUNCIONES DEL NÚCLEO (DB & UI)
    // =========================================

    // Cargar desde LocalStorage
    const loadCartFromDB = () => {
        const storedData = localStorage.getItem(DB_KEY);
        if (storedData) {
            cartState = JSON.parse(storedData);
        }
        updateGlobalUI();
    };

    // Guardar en LocalStorage
    const saveCartToDB = () => {
        localStorage.setItem(DB_KEY, JSON.stringify(cartState));
        updateGlobalUI();
    };

    // Actualizar toda la interfaz (Icono y Dropdown)
    const updateGlobalUI = () => {
        // 1. Actualizar Badge (Contador)
        if (cartCountElement) {
            cartCountElement.textContent = cartState.count;
            if(cartState.count > 0) {
                cartCountElement.classList.add('bump');
            }
        }

        // 2. Renderizar Lista del Dropdown
        renderCartDropdown();
    };

    // Generar el HTML dentro del carrito
    const renderCartDropdown = () => {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = ''; // Limpiar lista actual
        
        // Calcular Total fresco para evitar errores de redondeo
        let calculatedTotal = 0;

        if (cartState.items.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-msg">SYSTEM_EMPTY... <br> Inserte módulos.</p>';
            cartTotalElement.textContent = '€0.00';
            return;
        }

        cartState.items.forEach((item, index) => {
            calculatedTotal += item.price;

            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');
            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">€${item.price.toFixed(2)}</span>
                </div>
                <button class="remove-btn" onclick="removeCartItem(${index})">&times;</button>
            `;
            cartItemsContainer.appendChild(itemEl);
        });

        cartTotalElement.textContent = `€${calculatedTotal.toFixed(2)}`;
    };

    // =========================================
    // 3. ACCIONES (ADD, REMOVE, CHECKOUT)
    // =========================================

    // Añadir item
    const addToCart = (productName, price) => {
        const newProduct = {
            id: Date.now(),
            name: productName,
            price: parseFloat(price)
        };

        cartState.items.push(newProduct);
        cartState.count++;
        cartState.total += newProduct.price;

        saveCartToDB();
        showToast(`${productName} añadido.`);
        
        // Abrir el carrito automáticamente al añadir (Opcional, buena UX)
        cartDropdown.classList.add('active');
    };

    // Eliminar item (Se expone al objeto window para ser llamado desde el HTML inyectado)
    window.removeCartItem = (index) => {
        const removedItem = cartState.items[index];
        
        // Quitar del array
        cartState.items.splice(index, 1);
        
        // Recalcular estado
        cartState.count--;
        cartState.total -= removedItem.price;
        if(cartState.total < 0) cartState.total = 0;

        saveCartToDB();
        showToast('Elemento eliminado del sistema.');
    };

    // Procesar compra
    const handleCheckout = () => {
        if (cartState.items.length === 0) {
            alert('ERROR: No se detectan datos para transmitir. El carrito está vacío.');
            return;
        }
        
        const confirmBuy = confirm(`Total a procesar: €${cartState.total.toFixed(2)}\n¿Iniciar protocolo de pago?`);
        if (confirmBuy) {
            // Limpiar carrito
            cartState = { items: [], total: 0, count: 0 };
            saveCartToDB();
            alert('TRANSACCIÓN ACEPTADA. \nGracias por comprar en URBANSTYLE IT CORE.');
            cartDropdown.classList.remove('active');
        }
    };

    // =========================================
    // 4. EVENT LISTENERS
    // =========================================

    // Carga inicial
    loadCartFromDB();
    loadProducts();

    // Toggle (Abrir/Cerrar) Menú Carrito
    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cartDropdown.classList.toggle('active');
        });
    }

    // Botones "Añadir" en productos (delegación para contenido dinámico)
    document.addEventListener('click', (e) => {
        const btn = e.target?.closest?.('.add-btn');
        if (!btn) return;

        const name = btn.getAttribute('data-name') || 'Producto';
        const priceCents = Number(btn.getAttribute('data-price-cents') || 0);
        const price = (priceCents / 100).toFixed(2);
        addToCart(name, price);
    });

    // Botón Checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    // Cerrar carrito si se hace clic fuera
    document.addEventListener('click', (e) => {
        if (!cartDropdown.contains(e.target) && !cartToggleBtn.contains(e.target)) {
            cartDropdown.classList.remove('active');
        }
    });

    // Lógica Hamburguesa (Mobile)
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const bars = hamburger.querySelectorAll('.bar');
            if (navMenu.classList.contains('active')) {
                bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
    }

    // Helper Toast Notification
    const showToast = (message) => {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };
});

document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('.image-slider');

    sliders.forEach(slider => {
        const images = slider.querySelectorAll('.product-image');
        const prevBtn = slider.querySelector('.prev-arrow');
        const nextBtn = slider.querySelector('.next-arrow');
        let currentIndex = 0;

        // Ocultar flechas si solo hay una imagen
        if (images.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            return; 
        }

        const changeImage = (index) => {
            images[currentIndex].classList.remove('active');
            currentIndex = (index + images.length) % images.length; // Maneja índices negativos y superiores
            images[currentIndex].classList.add('active');
        };

        nextBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Evita comportamientos extraños si está en un enlace
            changeImage(currentIndex + 1);
        });
        
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            changeImage(currentIndex - 1);
        });
    });
});