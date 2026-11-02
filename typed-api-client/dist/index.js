// ======================================
// 1. IMPORT TYPES AND API FUNCTION
// ======================================
import { fetchData } from "./api.js";
// ======================================
// 2. API BASE URL
// ======================================
const BASE_URL = "https://jsonplaceholder.typicode.com";
// ======================================
// 3. FETCH USERS
// ======================================
async function getUsers() {
    return await fetchData(`${BASE_URL}/users`);
}
// ======================================
// 4. FETCH POSTS
// ======================================
async function getPosts() {
    return await fetchData(`${BASE_URL}/posts`);
}
// ======================================
// 5. FETCH TODOS
// ======================================
async function getTodos() {
    return await fetchData(`${BASE_URL}/todos`);
}
// ======================================
// 6. MAIN FUNCTION
// ======================================
async function main() {
    try {
        // Fetch all API data
        const users = await getUsers();
        const posts = await getPosts();
        const todos = await getTodos();
        // Display API responses
        console.log("Users:", users);
        console.log("Posts:", posts);
        console.log("Todos:", todos);
        // Display total records
        console.log("Total Users:", users.length);
        console.log("Total Posts:", posts.length);
        console.log("Total Todos:", todos.length);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("API Error:", error.message);
        }
        else {
            console.error("Unknown Error:", error);
        }
    }
}
// ======================================
// 7. START APPLICATION
// ======================================
main();
