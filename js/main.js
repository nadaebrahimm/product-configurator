// Main Application Logic
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentColor = 'white';
    let currentSize = 'L';
    let currentFont = 'Arial';
    let currentTextColor = '#000000';
    let currentImageSize = 100;
    let currentUser = null;
    let designId = null;
    
    // Product base prices
    const prices = {
        base: 20,
        sizes: {
            'S': 0,
            'M': 0,
            'L': 0,
            'XL': 2,
            'XXL': 5
        },
        customImage: 5
    };
    
    // DOM Elements
    const tshirtBase = document.getElementById('tshirt-base');
    const designText = document.getElementById('design-text');
    const designImage = document.getElementById('design-image');
    const textInput = document.getElementById('text-input');
    const fontSelect = document.getElementById('font-select');
    const textColorInput = document.getElementById('text-color');
    const imageUpload = document.getElementById('image-upload');
    const imageSizeSlider = document.getElementById('image-size');
    const totalPriceElement = document.getElementById('total-price');
    const colorOptions = document.querySelectorAll('.color-option');
    const sizeButtons = document.querySelectorAll('.size-btn');
    const loginBtn = document.getElementById('loginBtn');
    const saveBtn = document.getElementById('saveBtn');
    const shareBtn = document.getElementById('shareBtn');
    const orderBtn = document.getElementById('order-btn');
    const loginModal = document.getElementById('login-modal');
    const shareModal = document.getElementById('share-modal');
    const notification = document.getElementById('notification');
    const closeButtons = document.querySelectorAll('.close');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const shareLink = document.getElementById('share-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    
    // Check if URL contains a shared design ID
    function checkForSharedDesign() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedId = urlParams.get('designId');
        
        if (sharedId) {
            loadDesignFromFirebase(sharedId);
        }
    }
    
    // Initialize design from URL if present
    checkForSharedDesign();
    
    // Update price calculation
    function updatePrice() {
        let total = prices.base;
        total += prices.sizes[currentSize];
        
        if (designImage.querySelector('img')) {
            total += prices.customImage;
        }
        
        totalPriceElement.textContent = `$${total.toFixed(2)}`;
    }
    
    // Update UI based on current state
    function updateUI() {
        // Update t-shirt color
        tshirtBase.className = currentColor;
        
        // Update text styling
        designText.style.fontFamily = currentFont;
        designText.style.color = currentTextColor;
        
        // Update price
        updatePrice();
        
        // Update active color
        colorOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.color === currentColor);
        });
        
        // Update active size
        sizeButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.size === currentSize);
        });
    }
    
    // Color selection
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            currentColor = this.dataset.color;
            updateUI();
        });
    });
    
    // Size selection
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentSize = this.dataset.size;
            updateUI();
        });
    });
    
    // Text input
    textInput.addEventListener('input', function() {
        designText.textContent = this.value || "Your Text Here";
    });
    
    // Font selection
    fontSelect.addEventListener('change', function() {
        currentFont = this.value;
        updateUI();
    });
    
    // Text color
    textColorInput.addEventListener('input', function() {
        currentTextColor = this.value;
        updateUI();
    });
    
    // Image upload
    imageUpload.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = `${currentImageSize}%`;
            
            // Clear previous image
            designImage.innerHTML = '';
            designImage.appendChild(img);
            
            updatePrice();
        };
        reader.readAsDataURL(file);
    });
    
    // Image size control
    imageSizeSlider.addEventListener('input', function() {
        currentImageSize = this.value;
        const img = designImage.querySelector('img');
        if (img) {
            img.style.width = `${currentImageSize}%`;
        }
    });
    
    // Modal controls
    loginBtn.addEventListener('click', function() {
        loginModal.style.display = 'block';
    });
    
    shareBtn.addEventListener('click', function() {
        if (!designId) {
            saveDesignToFirebase().then(() => {
                openShareModal();
            });
        } else {
            openShareModal();
        }
    });
    
    function openShareModal() {
        const shareUrl = `${window.location.origin}${window.location.pathname}?designId=${designId}`;
        shareLink.value = shareUrl;
        shareModal.style.display = 'block';
    }
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            loginModal.style.display = 'none';
            shareModal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (event.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });
    
    // Tab functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            tabButtons.forEach(btn => {
                btn.classList.toggle('active', btn === this);
            });
            
            tabContents.forEach(content => {
                content.classList.toggle('active', content.id === `${tab}-tab`);
            });
        });
    });
    
    // Copy link button
    copyLinkBtn.addEventListener('click', function() {
        shareLink.select();
        document.execCommand('copy');
        this.textContent = 'Copied!';
        setTimeout(() => {
            this.textContent = 'Copy';
        }, 2000);
    });
    
    // Save button
    saveBtn.addEventListener('click', function() {
        if (!currentUser) {
            loginModal.style.display = 'block';
            return;
        }
        
        saveDesignToFirebase().then(() => {
            showNotification('Design saved successfully!');
        });
    });
    
    // Show notification
    function showNotification(message) {
        notification.querySelector('p').textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
    
    // Order button
    orderBtn.addEventListener('click', function() {
        if (!currentUser) {
            loginModal.style.display = 'block';
            return;
        }
        
        // Here you would implement cart functionality
        showNotification('Added to cart successfully!');
    });
    
    // Firebase Authentication Listeners
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                currentUser = userCredential.user;
                loginModal.style.display = 'none';
                updateLoginState();
            })
            .catch((error) => {
                alert(`Login Error: ${error.message}`);
            });
    });
    
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                currentUser = userCredential.user;
                return userCredential.user.updateProfile({
                    displayName: name
                });
            })
            .then(() => {
                loginModal.style.display = 'none';
                updateLoginState();
            })
            .catch((error) => {
                alert(`Signup Error: ${error.message}`);
            });
    });
    
    // Update login button text based on auth state
    function updateLoginState() {
        if (currentUser) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.displayName || currentUser.email}`;
        } else {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> Login`;
        }
    }
    
    // Auth state listener
    firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
        updateLoginState();
    });
    
    // Save design to Firebase
    async function saveDesignToFirebase() {
        if (!currentUser) return;
        
        // Get current design state
        const designData = {
            color: currentColor,
            size: currentSize,
            text: designText.textContent,
            font: currentFont,
            textColor: currentTextColor,
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // If there's an image, save it to storage
        const img = designImage.querySelector('img');
        if (img) {
            // Convert data URL to blob
            const response = await fetch(img.src);
            const blob = await response.blob();
            
            // Upload to Firebase Storage
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child(`designs/${currentUser.uid}/${Date.now()}.jpg`);
            await imageRef.put(blob);
            
            // Get download URL
            const imageUrl = await imageRef.getDownloadURL();
            designData.imageUrl = imageUrl;
            designData.imageSize = currentImageSize;
        }
        
        // Save to Firestore
        let ref;
        if (designId) {
            // Update existing design
            ref = firebase.firestore().collection('designs').doc(designId);
            await ref.update(designData);
        } else {
            // Create new design
            ref = firebase.firestore().collection('designs').doc();
            designId = ref.id;
            designData.id = designId;
            await ref.set(designData);
        }
        
        return designId;
    }
    
    // Load design from Firebase
    async function loadDesignFromFirebase(id) {
        try {
            const doc = await firebase.firestore().collection('designs').doc(id).get();
            
            if (!doc.exists) {
                alert('Design not found');
                return;
            }
            
            const data = doc.data();
            designId = id;
            
            // Update design state
            currentColor = data.color || 'white';
            currentSize = data.size || 'L';
            currentFont = data.font || 'Arial';
            currentTextColor = data.textColor || '#000000';
            
            designText.textContent = data.text || 'Your Text Here';
            textInput.value = data.text || '';
            fontSelect.value = currentFont;
            textColorInput.value = currentTextColor;
            
            // Load image if exists
            if (data.imageUrl) {
                const img = document.createElement('img');
                img.src = data.imageUrl;
                img.onload = function() {
                    currentImageSize = data.imageSize || 100;
                    imageSizeSlider.value = currentImageSize;
                    img.style.width = `${currentImageSize}%`;
                    
                    designImage.innerHTML = '';
                    designImage.appendChild(img);
                    
                    updateUI();
                };
            } else {
                designImage.innerHTML = '';
                updateUI();
            }
        } catch (error) {
            console.error('Error loading design:', error);
            alert('Error loading design. Please try again.');
        }
    }
    
    // Initialize UI
    updateUI();
});