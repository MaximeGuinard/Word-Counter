document.addEventListener("DOMContentLoaded", function () {
  const countButton = document.getElementById("countButton");
  const resultContainer = document.getElementById("resultContainer");
  const copyButton = document.getElementById("copyButton");
  const exportPDFButton = document.getElementById("exportPDFButton");
  const exportCSVButton = document.getElementById("exportCSVButton");

  countButton.addEventListener("click", async function () {
    resultContainer.innerHTML = "Calcul en cours...";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractVisibleText
    });
  });

  copyButton.addEventListener("click", function () {
    const resultText = resultContainer.innerText;
    const textarea = document.createElement("textarea");
    textarea.value = resultText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    alert("Le contenu a été copié !");
  });

  exportCSVButton.addEventListener("click", function () {
    const resultText = resultContainer.innerText;
    const csvData = "Contenu\n" + resultText;
    const blob = new Blob([csvData], { type: "text/csv" });
    const csvURL = window.URL.createObjectURL(blob);
    const tempLink = document.createElement("a");
    tempLink.href = csvURL;
    tempLink.setAttribute("download", "compteur_de_mots.csv");
    tempLink.click();
  });
  function extractVisibleText() {
    const ignoredWords = ["le", "la", "les", "des", "sur", "pour", "condensed", "are", "and", "used", "visitors", "galement", "such", "these", "used", "content", "understand", "word", "words", "dont", "mes", "suis", "quoi", "sert", "avec", "et", "qui", "est", "sont", "dans", "pas", "plus", "mais", "nous", "vous", "ils", "elles", "ce", "cette", "son", "leur", "votre", "vos", "qu'une", "que", "une", "the", "notre", "qualit", "besoin", "besoins", "nos", "march", "faire", "for", "par", "chaque", "aussi", "aux", "nouveau", "nouveaux", "rejoigner", "rejoignez"];
    
    const ignoredPatterns = [/^.{1,2}$/, /\d/, /^[a-zA-Z]*\d+[a-zA-Z]*$/];
    
    const visibleTextNodes = Array.from(document.querySelectorAll("p, h1, h2, h3, h4, h5, h6"))
      .map(element => element.textContent.toLowerCase())
      .join(" ");

    const words = visibleTextNodes.match(/\b[a-zA-Z\u00C0-\u017F]+\b/g);
    
    const validWords = words.filter(word =>
      word.length > 2 &&
      !ignoredWords.includes(word) &&
      !ignoredPatterns.some(pattern => pattern.test(word))
    );

    const wordCount = validWords.length;

    const wordFrequency = {};
    validWords.forEach((word) => {
      if (wordFrequency[word]) {
        wordFrequency[word]++;
      } else {
        wordFrequency[word] = 1;
      }
    });

    const sortedWords = Object.keys(wordFrequency).sort(
      (a, b) => wordFrequency[b] - wordFrequency[a]
    );

    const topWords = sortedWords.slice(0, 20).map(word => `${word} (${wordFrequency[word]} occurrences)`);

    chrome.runtime.sendMessage({ wordCount: wordCount, topWords: topWords });
  }

  chrome.runtime.onMessage.addListener(function (message) {
    if (message.wordCount !== undefined && message.topWords !== undefined) {
      resultContainer.innerHTML = `
        <h1>Résultats :</h1>
        <p>Nombre de mots : ${message.wordCount}</p>
        <p>Mots les plus fréquents :</p>
        <ul>${message.topWords.map(word => `<li>${word}</li>`).join("")}</ul>
      `;
    }
  });
});
