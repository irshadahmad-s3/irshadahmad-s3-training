const signupForm = document.getElementById("signupForm");

const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const formMessage = document.getElementById("formMessage");

signupForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (password.value !== confirmPassword.value) {
        formMessage.textContent = "Passwords do not match.";
        confirmPassword.focus();
        return;
    }

    formMessage.textContent = "Signup form validated successfully.";
    formMessage.style.color = "green";
});