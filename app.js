const STORAGE_KEYS = {
    randomCard: "wowBingo_randomCard",
    randomMarked: "wowBingo_randomMarked",
    chooseCard: "wowBingo_chooseCard",
    chooseMarked: "wowBingo_chooseMarked",
    customCard: "wowBingo_customCard",
    customMarked: "wowBingo_customMarked"
};

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function getRandomItems(items, amount) {
    if (items.length < amount) {
        throw new Error(`Not enough bingo items. Need ${amount}, only have ${items.length}.`);
    }

    return shuffle(items).slice(0, amount);
}

function createCard() {
    const availableItems = bingoItems.filter(item => item !== "LURA DIES");
    const shuffled = shuffle(availableItems);
    const card = [];

    for (let i = 0; i < 25; i++) {
        if (i === 12) {
            card.push("LURA DIES");
        } else {
            card.push(shuffled.shift());
        }
    }

    return card;
}

function createCardFromItems(items) {
    const uniqueItems = [];
    const seen = new Set();

    items.forEach(item => {
        const normalized = item.trim().toLowerCase();

        if (
            item.trim() !== "" &&
            normalized !== "lura dies" &&
            !seen.has(normalized)
        ) {
            seen.add(normalized);
            uniqueItems.push(item.trim());
        }
    });

    if (uniqueItems.length !== 24) {
        return null;
    }

    const card = [];
    let itemIndex = 0;

    for (let i = 0; i < 25; i++) {
        if (i === 12) {
            card.push("LURA DIES");
        } else {
            card.push(uniqueItems[itemIndex]);
            itemIndex++;
        }
    }

    return card;
}

function isValidCard(card) {
    return (
        Array.isArray(card) &&
        card.length === 25 &&
        card[12] === "LURA DIES" &&
        new Set(
            card.map(item => item.trim().toLowerCase())
        ).size === 25
    );
}

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadJSON(key, fallback = null) {
    const value = localStorage.getItem(key);

    if (!value) {
        return fallback;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function renderCard(card, marked, cardElement, markedKey) {
    if (!cardElement) {
        return;
    }

    cardElement.innerHTML = "";

    card.forEach((item, index) => {
        const square = document.createElement("div");

        square.className = "bingo-square";
        square.textContent = item;

        if (marked.includes(index)) {
            square.classList.add("marked");
        }

        square.addEventListener("click", () => {
            const position = marked.indexOf(index);

            if (position === -1) {
                marked.push(index);
            } else {
                marked.splice(position, 1);
            }

            square.classList.toggle("marked");
            saveJSON(markedKey, marked);
            updateBingoStatus(marked);
        });

        cardElement.appendChild(square);
    });

    updateBingoStatus(marked);
}

function updateBingoStatus(marked) {
    const message = document.querySelector(".bingo-message");

    if (!message) {
        return;
    }

    const markedSet = new Set(marked);

    const winningLines = [
        [0, 1, 2, 3, 4],
        [5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24],
        [0, 5, 10, 15, 20],
        [1, 6, 11, 16, 21],
        [2, 7, 12, 17, 22],
        [3, 8, 13, 18, 23],
        [4, 9, 14, 19, 24],
        [0, 6, 12, 18, 24],
        [4, 8, 12, 16, 20]
    ];

    const bingo = winningLines.some(line =>
        line.every(index => markedSet.has(index))
    );

    message.textContent = bingo ? "🎉 BINGO!" : "";
}

function resetStorage(cardKey, markedKey) {
    localStorage.removeItem(cardKey);
    localStorage.removeItem(markedKey);
}

function initRandomCard() {
    const cardElement = document.getElementById("bingoCard");

    if (!cardElement) {
        return;
    }

    let card = loadJSON(STORAGE_KEYS.randomCard);
    let marked = loadJSON(STORAGE_KEYS.randomMarked, []);

    if (!isValidCard(card)) {
        card = createCard();
        marked = [];

        saveJSON(STORAGE_KEYS.randomCard, card);
        saveJSON(STORAGE_KEYS.randomMarked, marked);
    }

    renderCard(
        card,
        marked,
        cardElement,
        STORAGE_KEYS.randomMarked
    );

    document.getElementById("rerollButton")?.addEventListener("click", () => {
        const newCard = createCard();
        const newMarked = [];

        saveJSON(STORAGE_KEYS.randomCard, newCard);
        saveJSON(STORAGE_KEYS.randomMarked, newMarked);

        renderCard(
            newCard,
            newMarked,
            cardElement,
            STORAGE_KEYS.randomMarked
        );
    });

    document.getElementById("resetButton")?.addEventListener("click", () => {
        if (!confirm("Reset this card?")) {
            return;
        }

        resetStorage(
            STORAGE_KEYS.randomCard,
            STORAGE_KEYS.randomMarked
        );

        location.reload();
    });

    initShareButton();
}

function initChooseCard() {
    const list = document.getElementById("itemList");
    const setupCard = document.getElementById("setupCard");

    if (!list || !setupCard) {
        return;
    }

    let savedCard = loadJSON(STORAGE_KEYS.chooseCard, []);

    if (
        Array.isArray(savedCard) &&
        savedCard.length === 25 &&
        savedCard[12] === "LURA DIES"
    ) {
        savedCard = savedCard.filter(
            (item, index) => index !== 12
        );
    }
    let enabled = loadJSON("wowBingo_chooseEnabled", false);

    if (!Array.isArray(savedCard)) {
        savedCard = [];
    }

    if (savedCard.length === 25 && savedCard[12] === "LURA DIES") {
        savedCard = savedCard.filter((item, index) => index !== 12);
    }

    savedCard = savedCard.filter(
        item => item.trim().toLowerCase() !== "lura dies"
    );

    savedCard = savedCard.slice(0, 24);

    function renderSetupCard() {
        setupCard.innerHTML = "";

        for (let i = 0; i < 25; i++) {
            const square = document.createElement("div");

            square.className = "setup-square";

            if (i === 12) {
                square.classList.add("center-square");
                square.textContent = "LURA DIES";
            } else {
                const itemIndex = i > 12 ? i - 1 : i;
                const item = savedCard[itemIndex];

                if (item) {
                    square.classList.add("filled");
                    square.textContent = item;
                    square.dataset.index = itemIndex;

                    if (!enabled) {
                        square.addEventListener("click", () => {
                            const index = Number(square.dataset.index);

                            savedCard.splice(index, 1);

                            saveJSON(
                                STORAGE_KEYS.chooseCard,
                                savedCard
                            );

                            renderSetupCard();
                            renderAvailableItems();
                            updateSelectionCount();
                        });
                    }
                } else {
                    square.textContent = "Drop Here";
                    square.dataset.index = i;

                    if (!enabled) {
                        square.addEventListener("dragover", event => {
                            event.preventDefault();
                            square.classList.add("drop-hover");
                        });

                        square.addEventListener("dragleave", () => {
                            square.classList.remove("drop-hover");
                        });

                        square.addEventListener("drop", event => {
                            event.preventDefault();

                            square.classList.remove("drop-hover");

                            const item = event.dataTransfer.getData("text/plain");

                            if (!item) {
                                return;
                            }

                            if (
                                savedCard.some(
                                    value =>
                                        value.toLowerCase() === item.toLowerCase()
                                )
                            ) {
                                return;
                            }

                            const position = i > 12 ? i - 1 : i;

                            savedCard.splice(position, 0, item);

                            saveJSON(
                                STORAGE_KEYS.chooseCard,
                                savedCard
                            );

                            renderSetupCard();
                            renderAvailableItems();
                            updateSelectionCount();
                        });
                    }
                }
            }

            setupCard.appendChild(square);
        }
    }

    function renderAvailableItems() {
        list.innerHTML = "";

        bingoItems
            .filter(
                item =>
                    item.trim().toLowerCase() !== "lura dies"
            )
            .forEach(item => {
                const div = document.createElement("div");

                div.className = "drag-item";
                div.textContent = item;
                div.draggable = !enabled;

                const used = savedCard.some(
                    value =>
                        value.toLowerCase() === item.toLowerCase()
                );

                if (used) {
                    div.classList.add("used");
                }

                if (!enabled) {
                    div.addEventListener("dragstart", event => {
                        event.dataTransfer.setData(
                            "text/plain",
                            item
                        );
                    });
                }

                list.appendChild(div);
            });
    }

    function updateSelectionCount() {
        const count = document.getElementById("selectionCount");
        const enableButton = document.getElementById("enableCardButton");

        if (count) {
            count.textContent = `${savedCard.length} / 24 Squares Placed`;
        }

        if (enableButton) {
            enableButton.disabled =
                savedCard.length !== 24 || enabled;

            enableButton.textContent =
                enabled ? "Card Enabled" : "Enable Card";
        }
    }

    renderSetupCard();
    renderAvailableItems();
    updateSelectionCount();

    document
        .getElementById("enableCardButton")
        ?.addEventListener("click", () => {
            if (savedCard.length !== 24) {
                alert("Please place all 24 squares first.");
                return;
            }

            const card = createCardFromItems(savedCard);

            if (!card) {
                alert("Your card contains duplicate squares.");
                return;
            }

            enabled = true;

            saveJSON(
                STORAGE_KEYS.chooseCard,
                card
            );

            saveJSON(
                STORAGE_KEYS.chooseMarked,
                []
            );

            saveJSON(
                "wowBingo_chooseEnabled",
                true
            );

            window.location.href = "ChooseCard.html?card=1";
        });

    const params = new URLSearchParams(
        window.location.search
    );

    if (
        params.get("card") === "1" &&
        isValidCard(savedCard)
    ) {
        document
            .getElementById("selectionArea")
            ?.classList.add("hidden");

        document
            .getElementById("generatedArea")
            ?.classList.remove("hidden");

        const marked = loadJSON(
            STORAGE_KEYS.chooseMarked,
            []
        );

        renderCard(
            savedCard,
            marked,
            document.getElementById("generatedCard"),
            STORAGE_KEYS.chooseMarked
        );

        initGeneratedCardControls();
    }
}

function initGeneratedCardControls() {
    document.getElementById("backToChoose")?.addEventListener("click", () => {
        window.location.href = "ChooseCard.html";
    });

    document.getElementById("resetButton")?.addEventListener("click", () => {
        if (!confirm("Reset your selected card?")) {
            return;
        }

        resetStorage(
            STORAGE_KEYS.chooseCard,
            STORAGE_KEYS.chooseMarked
        );

        window.location.href = "ChooseCard.html";
    });

    initShareButton();
}

function initCustomCard() {
    const form = document.getElementById("customForm");

    if (!form) {
        return;
    }

    const inputs = Array.from(
        document.querySelectorAll(".custom-input")
    );

    const savedCard = loadJSON(
        STORAGE_KEYS.customCard,
        []
    );

    if (savedCard.length === 25 && savedCard[12] === "LURA DIES") {
        let inputIndex = 0;

        inputs.forEach((input, index) => {
            if (index === 12) {
                input.value = "LURA DIES";
                input.disabled = true;
                input.placeholder = "LURA DIES";
            } else {
                if (savedCard[inputIndex]) {
                    input.value = savedCard[inputIndex];
                }

                inputIndex++;
            }
        });
    } else {
        inputs.forEach((input, index) => {
            if (index === 12) {
                input.value = "LURA DIES";
                input.disabled = true;
                input.placeholder = "LURA DIES";
            }
        });
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        const values = inputs
            .filter((input, index) => index !== 12)
            .map(input => input.value.trim());

        if (values.some(value => value === "")) {
            alert("Please fill in all 24 custom squares.");
            return;
        }

        const normalized = values.map(
            value => value.toLowerCase()
        );

        const hasDuplicates = normalized.some(
            (value, index) => normalized.indexOf(value) !== index
        );

        if (hasDuplicates) {
            alert("Your card contains duplicate squares.");
            return;
        }

        const card = createCardFromItems(values);

        if (!card) {
            alert("Your card contains duplicate squares.");
            return;
        }

        saveJSON(
            STORAGE_KEYS.customCard,
            card
        );

        saveJSON(
            STORAGE_KEYS.customMarked,
            []
        );

        window.location.href = "CustomCard.html?card=1";
    });

    const params = new URLSearchParams(window.location.search);

    if (params.get("card") === "1") {
        let generatedCard = loadJSON(
            STORAGE_KEYS.customCard,
            []
        );

        if (!isValidCard(generatedCard)) {
            const items = generatedCard.filter(
                item => item.trim().toLowerCase() !== "lura dies"
            );

            generatedCard = createCardFromItems(items);

            if (generatedCard) {
                saveJSON(
                    STORAGE_KEYS.customCard,
                    generatedCard
                );
            }
        }

        if (generatedCard && isValidCard(generatedCard)) {
            form.classList.add("hidden");
            document.getElementById("generatedArea")?.classList.remove("hidden");

            renderCard(
                generatedCard,
                loadJSON(STORAGE_KEYS.customMarked, []),
                document.getElementById("generatedCard"),
                STORAGE_KEYS.customMarked
            );

            initCustomGeneratedControls();
        }
    }
}

function initCustomGeneratedControls() {
    document.getElementById("editCard")?.addEventListener("click", () => {
        window.location.href = "CustomCard.html";
    });

    document.getElementById("resetButton")?.addEventListener("click", () => {
        if (!confirm("Reset your custom card?")) {
            return;
        }

        resetStorage(
            STORAGE_KEYS.customCard,
            STORAGE_KEYS.customMarked
        );

        window.location.href = "CustomCard.html";
    });

    initShareButton();
}

async function shareCard() {
    const card = document.querySelector(".bingo-wrapper");

    if (!card || typeof html2canvas === "undefined") {
        alert("Couldn't create the card image.");
        return;
    }

    try {
        const canvas = await html2canvas(card, {
            backgroundColor: "#090b10",
            scale: 2
        });

        if (navigator.clipboard && window.ClipboardItem) {
            const blob = await new Promise(resolve =>
                canvas.toBlob(resolve, "image/png")
            );

            await navigator.clipboard.write([
                new ClipboardItem({
                    "image/png": blob
                })
            ]);

            alert("Card image copied to clipboard!");
        } else {
            const link = document.createElement("a");

            link.download = "wow-bingo-card.png";
            link.href = canvas.toDataURL("image/png");

            link.click();

            alert("Your browser doesn't support copying images directly. The card was downloaded instead.");
        }
    } catch (error) {
        console.error(error);
        alert("Couldn't copy the card image.");
    }
}

function initShareButton() {
    document.getElementById("shareButton")?.addEventListener(
        "click",
        shareCard
    );
}

document.addEventListener("DOMContentLoaded", () => {
    initRandomCard();
    initChooseCard();
    initCustomCard();
});
