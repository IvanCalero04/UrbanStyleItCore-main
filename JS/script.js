document.addEventListener('DOMContentLoaded', () => {
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
                cartCountElement.classList.add('bump'); // Podrías añadir animaciones CSS aquí
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

    // Toggle (Abrir/Cerrar) Menú Carrito
    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cartDropdown.classList.toggle('active');
        });
    }

    // Botones "Añadir" en productos
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.getAttribute('data-name');
            // Hack para obtener precio del DOM
            const priceText = e.target.previousElementSibling.querySelector('.product-price').innerText;
            const price = priceText.replace('€', '').trim();
            
            addToCart(name, price);
        });
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

// =========================================
// 5. LÓGICA DEL ÁREA PRIVADA (SIMULACIÓN)
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const errorMsg = document.getElementById('login-error');

    // Comprobar si estamos en la página privada
    if (loginSection && dashboardSection) {
        
        // 1. Revisar si ya hay una sesión activa al cargar la página
        const isLogged = sessionStorage.getItem('urbanstyle_logged_in');
        if (isLogged === 'true') {
            mostrarDashboard(sessionStorage.getItem('urbanstyle_user') || 'ADMIN');
        }

        // 2. Gestionar el envío del formulario de Login
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault(); // Evitar que la página recargue
                
                const user = document.getElementById('login-user').value;
                const pass = document.getElementById('login-pass').value;

                // SIMULACIÓN: Aceptamos admin/1234. Puedes cambiarlo.
                if (user.toLowerCase() === 'admin' && pass === '1234') {
                    // Login correcto
                    sessionStorage.setItem('urbanstyle_logged_in', 'true');
                    sessionStorage.setItem('urbanstyle_user', user.toUpperCase());
                    mostrarDashboard(user.toUpperCase());
                } else {
                    // Login incorrecto
                    errorMsg.style.display = 'block';
                    // Animación de temblor en caso de error
                    loginSection.style.transform = 'translateX(10px)';
                    setTimeout(() => loginSection.style.transform = 'translateX(-10px)', 50);
                    setTimeout(() => loginSection.style.transform = 'translateX(0)', 100);
                }
            });
        }

        // 3. Gestionar la desconexión
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.removeItem('urbanstyle_logged_in');
                sessionStorage.removeItem('urbanstyle_user');
                
                // Ocultar dashboard y mostrar login
                dashboardSection.style.display = 'none';
                loginSection.style.display = 'block';
                
                // Limpiar formulario
                loginForm.reset();
                errorMsg.style.display = 'none';
                
                // Mostrar notificación (usa la función showToast que ya tienes)
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

    // Función auxiliar para cambiar la vista
    function mostrarDashboard(username) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        
        const nameDisplay = document.getElementById('user-name-display');
        if(nameDisplay) nameDisplay.textContent = username;

        // Poner la fecha actual en "Última conexión"
        const dateDisplay = document.getElementById('last-login-date');
        if(dateDisplay) {
            const now = new Date();
            dateDisplay.textContent = now.toLocaleString();
        }
    }
});

// =========================================
// 5. LÓGICA DEL ÁREA PRIVADA Y MONITOR
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const errorMsg = document.getElementById('login-error');

    // Comprobar si estamos en la página privada
    if (loginSection && dashboardSection) {
        
        // 1. Revisar si ya hay una sesión activa al cargar la página
        const isLogged = sessionStorage.getItem('urbanstyle_logged_in');
        if (isLogged === 'true') {
            mostrarDashboard(sessionStorage.getItem('urbanstyle_user') || 'ADMIN');
        }

        // 2. Gestionar el envío del formulario de Login
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault(); 
                
                const user = document.getElementById('login-user').value;
                const pass = document.getElementById('login-pass').value;

                // SIMULACIÓN: Aceptamos admin/1234
                if (user.toLowerCase() === 'admin' && pass === '1234') {
                    sessionStorage.setItem('urbanstyle_logged_in', 'true');
                    sessionStorage.setItem('urbanstyle_user', user.toUpperCase());
                    mostrarDashboard(user.toUpperCase());
                } else {
                    // Login incorrecto
                    errorMsg.style.display = 'block';
                    loginSection.style.transform = 'translateX(10px)';
                    setTimeout(() => loginSection.style.transform = 'translateX(-10px)', 50);
                    setTimeout(() => loginSection.style.transform = 'translateX(0)', 100);
                }
            });
        }

        // 3. Gestionar la desconexión
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.removeItem('urbanstyle_logged_in');
                sessionStorage.removeItem('urbanstyle_user');
                
                dashboardSection.style.display = 'none';
                loginSection.style.display = 'block';
                
                loginForm.reset();
                errorMsg.style.display = 'none';
                
                // Usar tu función de toast si existe
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

    // ====================================================
    // FUNCIONES AUXILIARES (Cambio de vista y Monitor)
    // ====================================================

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

        // ¡AQUÍ SE ARRANCA EL MONITOR DE ACTIVIDAD AL ENTRAR!
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
            // Generar número entre 8 y 22
            const totalActivos = Math.floor(Math.random() * (22 - 8 + 1)) + 8;
            if(userCountElement) userCountElement.textContent = totalActivos;
    
            // Cambiar barra
            if(activityBar) activityBar.style.width = Math.floor(Math.random() * 100) + "%";
    
            // Mostrar 4 nombres aleatorios
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
    
        // Ejecutar y repetir cada 4 segundos
        actualizarDatos();
        
        // Evitar que se creen múltiples intervalos si el usuario entra y sale varias veces
        if(window.monitorInterval) clearInterval(window.monitorInterval);
        window.monitorInterval = setInterval(actualizarDatos, 4000);
    }
});