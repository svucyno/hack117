async function getLivePrices() {
  const apiKey = "579b464db66ec23bdd000001108728adbc744c2d5dd507e2cc344a7e";
  const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=5`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data.records, null, 2));
  } catch (e) {
    console.error(e);
  }
}

getLivePrices();
