const vowels = "aeiouáéíóú";

const validConsGrps = [
    "cl", "cr", "ch", "sh", "sr",
    "ll", "bl", "br", "dr", "gl",
    "gr", "pr", "tr"
];

function hasVowel(wrd) {
    return [...wrd.toLowerCase()].some(seg => vowels.includes(seg));
}

function hasConsGrp(wrd) {
    return true;
}

function normalizeOnomatopoeia(word) {

    word = word.toLowerCase();

    // CASE 1: no vowels
    if (![...word].some(c => vowels.includes(c))) {

        if (new Set(word).size === 1) {

            if (word !== "y") {

                const base = word[0];

                if (word.length <= 2) {
                    return base + "E" + base;
                }
                else {
                    return base + "E" + base + "_".repeat(word.length - 2);
                }
            }
        }
    }

    // CASE 2: long consonant block at beginning
    let firstVowelIdx = [...word].findIndex(c => vowels.includes(c));

    if (firstVowelIdx > 2) {

        let consBlock = word.slice(0, firstVowelIdx);

        if (new Set(consBlock).size === 1) {
            word = "_".repeat(consBlock.length - 1)
                + consBlock[consBlock.length - 1]
                + word.slice(firstVowelIdx);
        }
    }

    // CASE 3: repeated letters
    let result = "";
    let i = 0;

    while (i < word.length) {

        let j = i;

        while (j < word.length && word[j] === word[i]) {
            j++;
        }

        let repeatLength = j - i;

        if (repeatLength > 2) {
            result += word[i] + "_".repeat(repeatLength - 1);
        }
        else {
            result += word.slice(i, j);
        }

        i = j;
    }

    return result;
}

function buildWordInGenesian(word) {

    let vowelsPos = [];
    let letters = [];
    let newWord = [];
    let space = 0;

    word = normalizeOnomatopoeia(word);

    word = word.toLowerCase();

    [...word].forEach((letter, i) => {

        if (hasVowel(letter)) {
            vowelsPos.push(i);
        }

        letters.push(letter);
        newWord.push(letter);
    });

    for (let vowelPos of vowelsPos) {

        let consonants = 0;

        if (space > 0) {
            consonants = vowelsPos[space] - vowelsPos[space - 1] - 1;
        }
        else {
            consonants = 0;
        }

        let updateDif = newWord.length - letters.length;

        if (consonants <= 1) {

            if (consonants !== 0 && space !== 0) {
                newWord.splice(updateDif + vowelPos - consonants, 0, "/");
            }
            else if (consonants === 0 && space > 0) {
                newWord.splice(updateDif + vowelPos, 0, "/");
            }
        }

        else if (consonants === 2) {
            newWord.splice(updateDif + vowelPos - (consonants - 1), 0, "/");
        }

        else if (consonants >= 3) {

            let cluster = letters.slice(vowelPos - consonants, vowelPos);
            let clusterStr = cluster.join("");

            if (consonants === 3) {

                let lastPair = clusterStr.slice(1);

                if (validConsGrps.includes(lastPair)) {
                    let insertPos = updateDif + vowelPos - 2;
                    newWord.splice(insertPos, 0, "/");
                }
                else {
                    let insertPos = updateDif + vowelPos - 1;
                    newWord.splice(insertPos, 0, "/");
                }
            }

            else {

                if (!cluster.includes("_")) {

                    let cBlock = [];

                    for (
                        let i = vowelPos - 1;
                        i > vowelPos - consonants;
                        i -= 2
                    ) {
                        cBlock.push(letters[i]);
                    }

                    cBlock.forEach(c => {

                        let place = newWord.indexOf(c, vowelPos - consonants);

                        newWord.splice(place, 0, "/");
                    });
                }
            }
        }

        if (consonants > 0) {

            let prevSegment = letters.slice(vowelPos - consonants, vowelPos);

            if (prevSegment.includes("_")) {

                let insertPos = updateDif + vowelPos;

                if (newWord[insertPos - 1] !== "/") {
                    newWord.splice(insertPos - 1, 0, "/");
                }
            }
        }

        space += 1;
    }

    word = newWord.join("");

    newWord = word.split("/");

    newWord = newWord.map(segment => {

        let sil = [...segment];

        if (
            !hasVowel(segment)
            && !segment.includes("_")
            && segment !== "y"
        ) {
            sil.splice(1, 0, "E");
        }

        for (let i = 0; i < sil.length; i++) {

            if (hasVowel(sil[i])) {

                for (let j = i + 1; j < sil.length; j++) {
                    sil[j] = sil[j].toUpperCase();
                }

                break;
            }
        }

        return sil.join("");
    });

    return newWord.join("-");
}

function processSentence(sentence) {

    let tokens = sentence.match(/[A-Za-zÁÉÍÓÚáéíóúñÑ]+|[^\w\s]|\s+/g) || [];

    let newTokens = [];
    let prevToken = "";

    tokens.forEach(token => {

        if (/^\s+$/.test(token) && prevToken === ".") {
            return;
        }

        if (token.trim() === "") {
            newTokens.push(token);
        }

        else if (/^[A-Za-zÁÉÍÓÚáéíóúñÑ]+$/.test(token)) {
            newTokens.push(buildWordInGenesian(token));
        }

        else {
            newTokens.push(token);
        }

        prevToken = token;
    });

    return newTokens.join("");
}

const inputBox = document.getElementById("input-box");
const outputBox = document.getElementById("output-box");
const translateBtn = document.getElementById("translate-btn");

function animateOutput(text) {

    outputBox.value = "";

    let i = 0;

    function typeWriter() {

        if (i < text.length) {
            outputBox.value += text.charAt(i);
            i++;
            setTimeout(typeWriter, 10);
        }
    }

    typeWriter();
}

function translateText() {

    const result = processSentence(inputBox.value);

    animateOutput(result);
}

translateBtn.addEventListener("click", translateText);

inputBox.addEventListener("keydown", (e) => {

    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        translateText();
    }
});
