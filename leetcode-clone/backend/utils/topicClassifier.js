const tf = require('@tensorflow/tfjs');
const natural = require('natural');
const fs = require('fs');
const path = require('path');

let model;
let wordIndex;
let tokenizer;
const MODEL_PATH = 'file://' + path.join(__dirname, '../model/model.json');
const VOCAB_PATH = path.join(__dirname, '../model/vocab.json');

const MAX_VOCAB = 2000; // Must match training

async function loadModel() {
    if (model) return;
    try {
        console.log("Loading TFJS model...");
        const modelJsonPath = path.join(__dirname, '../model/model.json');
        const weightsPath = path.join(__dirname, '../model/weights.bin');

        const loadHandler = {
            load: async () => {
                const modelJson = JSON.parse(fs.readFileSync(modelJsonPath));
                const weightData = new Uint8Array(fs.readFileSync(weightsPath)).buffer;
                return {
                    modelTopology: modelJson.modelTopology,
                    weightSpecs: modelJson.weightsManifest[0].weights,
                    weightData: weightData
                };
            }
        };

        model = await tf.loadLayersModel(loadHandler);

        const vocabData = fs.readFileSync(VOCAB_PATH, 'utf8');
        wordIndex = JSON.parse(vocabData);
        tokenizer = new natural.WordTokenizer();
        console.log("Model loaded.");
    } catch (e) {
        console.error("Failed to load model:", e);
    }
}

function vectorize(text) {
    const vec = new Array(MAX_VOCAB).fill(0);
    tokenizer.tokenize(text.toLowerCase()).forEach(word => {
        if (wordIndex[word] !== undefined) {
            vec[wordIndex[word]] += 1;
        }
    });
    return vec;
}

async function classifyQuestion(text) {
    if (!model) await loadModel();
    if (!model) return { topicId: 8, confidence: 0 }; // Default to Other

    const input = tf.tensor2d([vectorize(text)]);
    const prediction = model.predict(input);
    const probs = prediction.dataSync(); // Float32Array

    // Find max index
    let maxProb = -1;
    let topicId = 8; // Default Other
    for (let i = 0; i < probs.length; i++) {
        if (probs[i] > maxProb) {
            maxProb = probs[i];
            topicId = i;
        }
    }

    return { topicId, confidence: parseFloat(maxProb.toFixed(4)) };
}

module.exports = { classifyQuestion };
