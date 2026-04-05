async function testGovAPI() {
    const apiKey = '579b464db66ec23bdd000001108728adbc744c2d5dd507e2cc344a7ekey';
    
    // First let's query the catalog or an endpoint we know
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=5`;
    
    try {
        console.log(`Testing: ${url}`);
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            console.log("SUCCESS:", JSON.stringify(data, null, 2).substring(0, 1000));
        } else {
            console.log(`Failed: ${res.status} ${res.statusText}`);
            console.log(await res.text());
        }
    } catch(e) {
        console.error(e);
    }
}

testGovAPI();
