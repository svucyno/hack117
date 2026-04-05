async function testAPI() {
    const key = '579b464db66ec23bdd000001108728adbc744c2d5dd507e2cc344a7ekey';
    // Try using "filters[commodity]" with Paddy
    const res = await fetch(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${key}&format=json&limit=5&filters[commodity]=Paddy(Dhan)(Common)`);
    const data = await res.json();
    console.log("EXACT MATCH: ", data.records?.length);

    // Try a broad limit
    const res2 = await fetch(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${key}&format=json&limit=2000`);
    const data2 = await res2.json();
    let paddyCount = 0;
    if(data2.records) {
        paddyCount = data2.records.filter(r => r.commodity.toLowerCase().includes('paddy')).length;
    }
    console.log("in 2000 limits, paddy count:", paddyCount);
}
testAPI();
