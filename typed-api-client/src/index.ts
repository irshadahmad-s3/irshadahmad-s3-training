// ======================================
// 1. IMPORT TYPES AND API FUNCTION
// ======================================

import { fetchData } from "./api.js";

import type { User, Post, Todo } from "./types.js";


// ======================================
// 2. API BASE URL
// ======================================

const BASE_URL = "https://jsonplaceholder.typicode.com";


// ======================================
// 3. FETCH USERS
// ======================================

async function getUsers(): Promise<User[]> {

    return await fetchData<User[]>(`${BASE_URL}/users`);

}


// ======================================
// 4. FETCH POSTS
// ======================================

async function getPosts(): Promise<Post[]> {

    return await fetchData<Post[]>(`${BASE_URL}/posts`);

}


// ======================================
// 5. FETCH TODOS
// ======================================

async function getTodos(): Promise<Todo[]> {

    return await fetchData<Todo[]>(`${BASE_URL}/todos`);

}


// ======================================
// 6. MAIN FUNCTION
// ======================================

async function main(): Promise<void> {

    try {

        // Fetch all API data
        const users: User[] = await getUsers();

        const posts: Post[] = await getPosts();

        const todos: Todo[] = await getTodos();


        // Display API responses
        console.log("Users:", users);

        console.log("Posts:", posts);

        console.log("Todos:", todos);


        // Display total records
        console.log("Total Users:", users.length);

        console.log("Total Posts:", posts.length);

        console.log("Total Todos:", todos.length);


    } catch (error: unknown) {

        if (error instanceof Error) {

            console.error("API Error:", error.message);

        } else {

            console.error("Unknown Error:", error);

        }

    }

}


// ======================================
// 7. START APPLICATION
// ======================================

main();