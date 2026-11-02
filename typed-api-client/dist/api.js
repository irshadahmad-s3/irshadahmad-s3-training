// ======================================
// GENERIC API FETCH FUNCTION
// ======================================
export async function fetchData(url) {
    const response = await fetch(url);
    // Check API response
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    // Convert response into JSON
    const data = await response.json();
    return data;
}
