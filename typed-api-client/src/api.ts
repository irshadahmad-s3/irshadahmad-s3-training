// ======================================
// GENERIC API FETCH FUNCTION
// ======================================

export async function fetchData<T>(url: string): Promise<T> {

    const response = await fetch(url);

    // Check API response
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    // Convert response into JSON
    const data: T = await response.json();

    return data;
}