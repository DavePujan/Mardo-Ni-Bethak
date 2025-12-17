const LANG = {
    js: 63,
    cpp: 54,
    c: 50,
    python: 71,
    java: 62
};

module.exports = {
    "add-two": {
        title: "Add Two",
        functionName: "addTwo",
        langMap: LANG,
        testCases: {
            public: [
                { input: "2 3", output: "5" }
            ],
            hidden: [
                { input: "999 1", output: "1000" },
                { input: "-5 5", output: "0" }
            ]
        }
    }
};
