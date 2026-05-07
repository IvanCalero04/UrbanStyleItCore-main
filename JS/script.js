document.addEventListener('DOMContentLoaded', () => {
    const DB_KEY = 'urbanstyle_cart_v1';
    
    let cartState = {
        items: [],
        total: 0,
        count: 0
    };

    const cartToggleBtn = document.getElementById('cart-toggle');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsContainer = document.getElementById('cart-items-list');
    const cartTotalElement = document.getElementById('cart-total-price');
    const cartCountElement = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('checkout-btn');

    const loadCartFromDB = () => {
        const storedData = localStorage.getItem(DB_KEY);
        if (storedData) {
            cartState = JSON.parse(storedData);
        }
        updateGlobalUI();
    };

    const saveCartToDB = () => {
        localStorage.setItem(DB_KEY, JSON.stringify(cartState));
        updateGlobalUI();
    };

    const updateGlobalUI = () => {
        if (cartCountElement) {
            cartCountElement.textContent = cartState.count;
            if(cartState.count > 0) {
                cartCountElement.classList.add('bump');
            }
        }

        renderCartDropdown();
    };

    const renderCartDropdown = () => {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';
        
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
        
        cartDropdown.classList.add('active');
    };

    window.removeCartItem = (index) => {
        const removedItem = cartState.items[index];
        
        cartState.items.splice(index, 1);
        
        cartState.count--;
        cartState.total -= removedItem.price;
        if(cartState.total < 0) cartState.total = 0;

        saveCartToDB();
        showToast('Elemento eliminado del sistema.');
    };

    const handleCheckout = () => {
        if (cartState.items.length === 0) {
            alert('ERROR: No se detectan datos para transmitir. El carrito está vacío.');
            return;
        }
        
        const confirmBuy = confirm(`Total a procesar: €${cartState.total.toFixed(2)}\n¿Iniciar protocolo de pago?`);
        if (confirmBuy) {
            cartState = { items: [], total: 0, count: 0 };
            saveCartToDB();
            alert('TRANSACCIÓN ACEPTADA. \nGracias por comprar en URBANSTYLE IT CORE.');
            cartDropdown.classList.remove('active');
        }
    };

    loadCartFromDB();

    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cartDropdown.classList.toggle('active');
        });
    }

    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.getAttribute('data-name');
            const priceText = e.target.previousElementSibling.querySelector('.product-price').innerText;
            const price = priceText.replace('€', '').trim();
            
            addToCart(name, price);
        });
    });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    document.addEventListener('click', (e) => {
        if (!cartDropdown.contains(e.target) && !cartToggleBtn.contains(e.target)) {
            cartDropdown.classList.remove('active');
        }
    });

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

        if (images.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            return; 
        }

        const changeImage = (index) => {
            images[currentIndex].classList.remove('active');
            currentIndex = (index + images.length) % images.length;
            images[currentIndex].classList.add('active');
        };

        nextBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            changeImage(currentIndex + 1);
        });
        
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            changeImage(currentIndex - 1);
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const errorMsg = document.getElementById('login-error');

    if (loginSection && dashboardSection) {
        
        const isLogged = sessionStorage.getItem('urbanstyle_logged_in');
        if (isLogged === 'true') {
            mostrarDashboard(sessionStorage.getItem('urbanstyle_user') || 'ADMIN');
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const user = document.getElementById('login-user').value;
                const pass = document.getElementById('login-pass').value;

                if (user.toLowerCase() === 'admin' && pass === '1234') {
                    sessionStorage.setItem('urbanstyle_logged_in', 'true');
                    sessionStorage.setItem('urbanstyle_user', user.toUpperCase());
                    mostrarDashboard(user.toUpperCase());
                } else {
                    errorMsg.style.display = 'block';
                    loginSection.style.transform = 'translateX(10px)';
                    setTimeout(() => loginSection.style.transform = 'translateX(-10px)', 50);
                    setTimeout(() => loginSection.style.transform = 'translateX(0)', 100);
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.removeItem('urbanstyle_logged_in');
                sessionStorage.removeItem('urbanstyle_user');
                
                dashboardSection.style.display = 'none';
                loginSection.style.display = 'block';
                
                loginForm.reset();
                errorMsg.style.display = 'none';
                
                const container = document.getElementById('toast-container');
                if(container) {
                    const toast = document.createElement('div');
                    toast.className = 'toast';
                    toast.innerHTML = `<span>Sistema desconectado.</span>`;
                    container.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                }
            });
        }
    }

    function mostrarDashboard(username) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        
        const nameDisplay = document.getElementById('user-name-display');
        if(nameDisplay) nameDisplay.textContent = username;

        const dateDisplay = document.getElementById('last-login-date');
        if(dateDisplay) {
            const now = new Date();
            dateDisplay.textContent = now.toLocaleString();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const errorMsg = document.getElementById('login-error');

    if (loginSection && dashboardSection) {
        
        const isLogged = sessionStorage.getItem('urbanstyle_logged_in');
        if (isLogged === 'true') {
            mostrarDashboard(sessionStorage.getItem('urbanstyle_user') || 'ADMIN');
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault(); 
                
                const user = document.getElementById('login-user').value;
                const pass = document.getElementById('login-pass').value;

                if (user.toLowerCase() === 'admin' && pass === '1234') {
                    sessionStorage.setItem('urbanstyle_logged_in', 'true');
                    sessionStorage.setItem('urbanstyle_user', user.toUpperCase());
                    mostrarDashboard(user.toUpperCase());
                } else {
                    errorMsg.style.display = 'block';
                    loginSection.style.transform = 'translateX(10px)';
                    setTimeout(() => loginSection.style.transform = 'translateX(-10px)', 50);
                    setTimeout(() => loginSection.style.transform = 'translateX(0)', 100);
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.removeItem('urbanstyle_logged_in');
                sessionStorage.removeItem('urbanstyle_user');
                
                dashboardSection.style.display = 'none';
                loginSection.style.display = 'block';
                
                loginForm.reset();
                errorMsg.style.display = 'none';
               
                const container = document.getElementById('toast-container');
                if(container) {
                    const toast = document.createElement('div');
                    toast.className = 'toast';
                    toast.innerHTML = `<span>Sistema desconectado.</span>`;
                    container.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                }
            });
        }
    }

    function mostrarDashboard(username) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        
        const nameDisplay = document.getElementById('user-name-display');
        if(nameDisplay) nameDisplay.textContent = username;

        const dateDisplay = document.getElementById('last-login-date');
        if(dateDisplay) {
            const now = new Date();
            dateDisplay.textContent = now.toLocaleString();
        }

        simularUsuariosActivos();
    }

    function simularUsuariosActivos() {
        const userCountElement = document.getElementById('active-users-count');
        const usersListElement = document.getElementById('active-users-list');
        const activityBar = document.getElementById('activity-bar');
        
        const nombresSimulados = [
            "USER_X99", "DEV_ROOT", "GUEST_404", "OPERATOR_7", "NODE_ALPHA", 
            "ANON_USR", "CORE_ENG", "CYBER_ST", "M_MAKI_15", "BOT_SCAN_01"
        ];
    
        const actualizarDatos = () => {
            const totalActivos = Math.floor(Math.random() * (22 - 8 + 1)) + 8;
            if(userCountElement) userCountElement.textContent = totalActivos;

            if(activityBar) activityBar.style.width = Math.floor(Math.random() * 100) + "%";
    
            if(usersListElement) {
                const mezclados = nombresSimulados.sort(() => 0.5 - Math.random());
                const seleccionados = mezclados.slice(0, 4);
                
                usersListElement.innerHTML = seleccionados.map(nombre => `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span style="color: #00ff00;">●</span> [ ${nombre} ]
                    </div>
                `).join('');
            }
        };
    
        actualizarDatos();
        
        if(window.monitorInterval) clearInterval(window.monitorInterval);
        window.monitorInterval = setInterval(actualizarDatos, 4000);
    }
    const findStoreBtn = document.getElementById('find-store-btn');
    const mapModal = document.getElementById('map-modal');
    const closeMapBtn = document.getElementById('close-map');
    const mapContainer = document.getElementById('map-container');

    if (findStoreBtn) {
        findStoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
        
            const randomLat = (Math.random() * (37.8515 - 37.8485) + 37.8485).toFixed(6);
            const randomLon = (Math.random() * (-4.7940 - (-4.7980)) + (-4.7980)).toFixed(6);

            mapContainer.innerHTML = `
                <iframe 
                    src="https://maps.google.com/maps?q=${randomLat},${randomLon}&z=15&output=embed" 
                    frameborder="0" 
                    style="border:0;" 
                    allowfullscreen="" 
                    loading="lazy">
                </iframe>
            `;

            mapModal.style.display = "block";
        });
    }

    if (closeMapBtn) {
        closeMapBtn.onclick = () => mapModal.style.display = "none";
    }

    window.onclick = (event) => {
        if (event.target == mapModal) {
            mapModal.style.display = "none";
        }
    };
    
    const faqBtn = document.getElementById('faq-btn');
    const faqModal = document.getElementById('faq-modal');
    const closeFaq = document.getElementById('close-faq');

    if (faqBtn) {
        faqBtn.addEventListener('click', (e) => {
            e.preventDefault();
            faqModal.style.display = "block";
        });
    }

    if (closeFaq) {
        closeFaq.onclick = () => faqModal.style.display = "none";
    }

    window.addEventListener('click', (event) => {
        if (event.target == faqModal) {
            faqModal.style.display = "none";
        }
    });
    
    const shippingBtn = document.getElementById('shipping-btn');
    const shippingModal = document.getElementById('shipping-modal');
    const closeShipping = document.getElementById('close-shipping');

    if (shippingBtn) {
        shippingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            shippingModal.style.display = "block";
        });
    }

    if (closeShipping) {
        closeShipping.onclick = () => shippingModal.style.display = "none";
    }

    window.addEventListener('click', (event) => {
        if (event.target == shippingModal) {
            shippingModal.style.display = "none";
        }
    });
    
    const privacyBtn = document.getElementById('privacy-btn');
    const privacyModal = document.getElementById('privacy-modal');
    const closePrivacy = document.getElementById('close-privacy');

    if (privacyBtn) {
        privacyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            privacyModal.style.display = "block";
        });
    }

    if (closePrivacy) {
        closePrivacy.onclick = () => privacyModal.style.display = "none";
    }

    window.addEventListener('click', (event) => {
        if (event.target == privacyModal) {
            privacyModal.style.display = "none";
        }
    });
});