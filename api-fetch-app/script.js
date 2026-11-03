// API URL
const API_URL = "https://jsonplaceholder.typicode.com/users";


// DOM Elements
const usersContainer = document.getElementById("usersContainer");

const loading = document.getElementById("loading");

const error = document.getElementById("error");

const errorMessage = document.getElementById("errorMessage");

const empty = document.getElementById("empty");

const loadUsersBtn = document.getElementById("loadUsersBtn");

const retryBtn = document.getElementById("retryBtn");

const searchInput = document.getElementById("searchInput");

const totalUsers = document.getElementById("totalUsers");

const apiStatus = document.getElementById("apiStatus");


// Store API Data
let users = [];


// Loading State
function showLoading() {

    loading.classList.remove("hidden");

    error.classList.add("hidden");

    empty.classList.add("hidden");

    usersContainer.classList.add("hidden");

    apiStatus.textContent = "Loading";

    loadUsersBtn.disabled = true;

    retryBtn.disabled = true;

}


// Hide Loading
function hideLoading() {

    loading.classList.add("hidden");

    loadUsersBtn.disabled = false;

    retryBtn.disabled = false;

}


// Error State
function showError(message) {

    error.classList.remove("hidden");

    errorMessage.textContent = message;

    usersContainer.classList.add("hidden");

    empty.classList.add("hidden");

    totalUsers.textContent = "--";

    apiStatus.textContent = "Failed";

}


// Fetch API Data
async function fetchUsers() {

    showLoading();

    users = [];

    totalUsers.textContent = "--";

    try {

        // Fetch API Request
        const response = await fetch(API_URL);


        // Check HTTP Error
        if (!response.ok) {

            throw new Error(`HTTP Error: ${response.status}`);

        }


        // Convert Response into JSON
        const data = await response.json();


        // Validate API Response
        if (!Array.isArray(data)) {

            throw new Error("Invalid API response");

        }


        // Store Data
        users = data;


        // Update Statistics
        totalUsers.textContent = users.length;

        apiStatus.textContent = "Connected";


        // Render User Cards
        displayUsers(users);


    }

    catch (err) {

        console.error("API Error:", err);

        showError(
            err instanceof Error
                ? err.message
                : "Something went wrong. Please try again."
        );

    }

    finally {

        // Always execute
        hideLoading();

    }

}


// Create User Card
function createUserCard(user) {

    const card = document.createElement("article");

    card.className = "user-card";


    // Card Top
    const cardTop = document.createElement("div");

    cardTop.className = "card-top";


    const avatar = document.createElement("div");

    avatar.className = "avatar";

    avatar.textContent = user.name.charAt(0).toUpperCase();


    const userDetails = document.createElement("div");


    const name = document.createElement("h3");

    name.className = "user-name";

    name.textContent = user.name;


    const username = document.createElement("p");

    username.className = "user-username";

    username.textContent = `@${user.username}`;


    userDetails.append(name, username);

    cardTop.append(avatar, userDetails);


    // Card Information
    const cardInfo = document.createElement("div");

    cardInfo.className = "card-info";


    // Helper Function
    function createInfoRow(icon, label, value) {

        const row = document.createElement("div");

        row.className = "info-row";


        const iconElement = document.createElement("span");

        iconElement.className = "info-icon";

        iconElement.textContent = icon;


        const content = document.createElement("div");


        const labelElement = document.createElement("p");

        labelElement.className = "info-label";

        labelElement.textContent = label;


        const valueElement = document.createElement("p");

        valueElement.className = "info-value";

        valueElement.textContent = value;


        content.append(labelElement, valueElement);

        row.append(iconElement, content);


        return row;

    }


    // Email
    cardInfo.append(
        createInfoRow("✉️", "Email", user.email)
    );


    // Phone
    cardInfo.append(
        createInfoRow("📞", "Phone", user.phone)
    );


    // Website
    const websiteRow = document.createElement("div");

    websiteRow.className = "info-row";


    const websiteIcon = document.createElement("span");

    websiteIcon.className = "info-icon";

    websiteIcon.textContent = "🌐";


    const websiteContent = document.createElement("div");


    const websiteLabel = document.createElement("p");

    websiteLabel.className = "info-label";

    websiteLabel.textContent = "Website";


    const websiteLink = document.createElement("a");

    websiteLink.className = "info-value";

    const safeHostname = user.website
        .replace(/^https?:\/\//i, "")
        .split("/")[0];

    websiteLink.href = `https://${safeHostname}`;

    websiteLink.textContent = user.website;

    websiteLink.target = "_blank";

    websiteLink.rel = "noopener noreferrer";


    websiteContent.append(websiteLabel, websiteLink);

    websiteRow.append(websiteIcon, websiteContent);

    cardInfo.append(websiteRow);


    // Company
    cardInfo.append(
        createInfoRow("🏢", "Company", user.company.name)
    );


    // Address
    const address = `${user.address.street}, ${user.address.city}`;

    cardInfo.append(
        createInfoRow("📍", "Address", address)
    );


    // Final Card
    card.append(cardTop, cardInfo);


    return card;

}


// Display User Cards
function displayUsers(userList) {

    usersContainer.replaceChildren();

    empty.classList.add("hidden");

    usersContainer.classList.remove("hidden");


    if (userList.length === 0) {

        usersContainer.classList.add("hidden");

        empty.classList.remove("hidden");

        return;

    }


    userList.forEach(user => {

        const card = createUserCard(user);

        usersContainer.append(card);

    });

}


// Search Users
searchInput.addEventListener("input", function () {

    const searchValue = searchInput.value.toLowerCase().trim();


    const filteredUsers = users.filter(user => {

        return (
            user.name.toLowerCase().includes(searchValue) ||
            user.email.toLowerCase().includes(searchValue) ||
            user.username.toLowerCase().includes(searchValue) ||
            user.company.name.toLowerCase().includes(searchValue)
        );

    });


    if (!loading.classList.contains("hidden") ||
        !error.classList.contains("hidden")) {

        return;

    }


    displayUsers(filteredUsers);

});


// Refresh Button
loadUsersBtn.addEventListener("click", fetchUsers);


// Retry Button
retryBtn.addEventListener("click", fetchUsers);


// Initial API Call
fetchUsers();