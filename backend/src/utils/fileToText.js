const fs = require("fs");
const textract = require("textract");

async function extractPdfText(buffer) {
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        text += pageText + "\n";
    }
    return text.trim();
}

async function fileToText(file) {
    let isPdf = false;

    // If file is a string (path)
    if (typeof file === "string") {
        isPdf = file.toLowerCase().endsWith(".pdf");
    }

    // If file is an object (e.g., Multer upload)
    if (typeof file === "object" && file.mimetype) {
        isPdf = file.mimetype === "application/pdf";
    }

    if (isPdf) {
        const buffer = file.buffer || fs.readFileSync(file);
        return await extractPdfText(buffer);
    }

    // Other file types → textract
    return new Promise((resolve, reject) => {
        if (typeof file === "string") {
            textract.fromFileWithPath(file, (err, text) =>
                err ? reject(err) : resolve(text || "")
            );
        } else if (file && file.buffer && file.mimetype) {
            textract.fromBufferWithMime(file.mimetype, file.buffer, (err, text) =>
                err ? reject(err) : resolve(text || "")
            );
        } else {
            reject(new Error("Invalid file input"));
        }
    });
}

module.exports = fileToText;