import axios from 'axios';

async function testJudge0() {
    console.log("Testing Judge0 Connectivity...");
    try {
        const res = await axios.get('http://127.0.0.1:2358/about');
        console.log("Status: OK");
        console.log("Version:", res.data.version);
        console.log("Connectivity Test PASSED ✅");
    } catch (error) {
        console.error("Connectivity Test FAILED ❌");
        console.error("Error:", error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log("\nMake sure your Docker container is running!");
        }
    }
}

testJudge0();
