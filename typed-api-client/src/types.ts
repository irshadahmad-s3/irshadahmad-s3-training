// ======================================
// 1. USER INTERFACE
// ======================================

export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
    website: string;
}


// ======================================
// 2. POST INTERFACE
// ======================================

export interface Post {
    userId: number;
    id: number;
    title: string;
    body: string;
}


// ======================================
// 3. TODO INTERFACE
// ======================================

export interface Todo {
    userId: number;
    id: number;
    title: string;
    completed: boolean;
}