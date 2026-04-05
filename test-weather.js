import fetch from 'node-fetch';

async function testKey() {
    const lat = 28.6139;
    const lon = 77.2090;
    const key = "833a27cd8eb51c7c6fe21745b26eb6f7";
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`);
    console.log("Status:", res.status);
    console.log(await res.text());
}
testKey();
