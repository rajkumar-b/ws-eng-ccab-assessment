import { performance } from "perf_hooks";
import supertest from "supertest";
import { buildApp } from "./app";

const app = supertest(buildApp());

async function basicLatencyTest() {
    await app.post("/reset").expect(204);
    const start = performance.now();
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    console.log(`Latency: ${performance.now() - start} ms`);
}

async function failUnderchargeTest() {
    const account = "testAccount";
    await app.post("/reset").send({ account}).expect(204);
    const chargeAmount = 105;
    const start = performance.now();
    await app.post("/charge").send({ account, charges: chargeAmount }).expect(200);
    try{
        await app.post("/charge").send({ account, charges: chargeAmount }).expect(200);
        console.log("Test case should have failed.")
    } catch (e) {
        console.log("Test case failed successfully.")
    } finally {
        console.log(`Latency: ${performance.now() - start} ms`);
    }
}

async function concurrencyTest(chargeAmount=10, numRequests=10) {
    const account = "concurrentAccount";
    await app.post("/reset").send({ account}).expect(204);
    const start = performance.now();
    const requestPromises = [];

    for (let index = 0; index < numRequests; index++) {
        requestPromises[index] = app.post("/charge").send({ account, charges: chargeAmount }).expect(200);
    }
    await Promise.all(requestPromises);
    await app.post("/charge").send({ account, charges: chargeAmount }).expect(200);

    console.log(`Latency: ${performance.now() - start} ms`);
}


async function runTests() {
    console.log('Basic Latency Test:\n');
    await basicLatencyTest();
    console.log('\n\nUndercharge Test:\n');
    await failUnderchargeTest();
    console.log('\n\nBasic Concurrency Test:\n');
    await concurrencyTest(70, 10);
    console.log('\n\nBasic Concurrency Test 2:\n');
    await concurrencyTest(10, 12);
}

runTests().catch(console.error);
