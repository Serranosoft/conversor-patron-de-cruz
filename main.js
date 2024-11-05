

// Class declarations
class Rgb {
    constructor(color) {
        const c = Array.isArray(color)
            ? this.fromArray(color)
            : typeof color === "string"
                ? this.parce(color)
                : color;

        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
    }
    r = 0;
    g = 0;
    b = 0;

    parce(color) {
        const matchColors = /(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})/;
        const match = matchColors.exec(color);

        if (match !== null) {
            return this.fromArray(match.slice(1));
        }
        return { r: 0, g: 0, b: 0 };
    }

    fromArray(array) {
        if (array.length >= 3) {
            return { r: array[0], g: array[1], b: array[2] };
        }
        return { r: 0, g: 0, b: 0 };
    }

    get value() {
        return {
            r: this.r,
            g: this.g,
            b: this.b,
        };
    }

    toString() {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }
}

class ColorConverter {
    static bpp8to24bpp(color) {
        const encodedData =
            (Math.floor(color.r / 32) << 5) +
            (Math.floor(color.g / 32) << 2) +
            Math.floor(color.b / 64);
        const r = (encodedData >> 5) * 32;
        const g = ((encodedData & 28) >> 2) * 32;
        const b = (encodedData & 3) * 64;
        return { r, g, b };
    }
}

class FileDialog {
    constructor(filter = `image/*`, multiple = true) {
        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this.accept = filter;
        this.multiple = multiple;
        this.initChange();
    }

    get accept() {
        return this._accept;
    }

    set accept(v) {
        this._accept = v;
        this._fileInput.accept = v;
    }

    get multiple() {
        return this._multiple;
    }

    set multiple(v) {
        this._multiple = v;
        this._fileInput.multiple = v;
    }

    initChange() {
        this._fileInput.onchange = (e) => {
            const target = e.target;
            const files = target.files;

            if (!files) return;

            const fileOk = new CustomEvent("fileOk", {
                detail: { files },
            });
            window.dispatchEvent(fileOk);
        };
    }

    showDialog() {
        this._fileInput.click();
    }

    dispose() {
        this._fileInput.value = "";
    }
}

class CanvasRender {
    constructor(width = 800, height = 600) {
        this._w = width;
        this._h = height;
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        this.width = width;
        this.height = height;
    }

    set width(v) {
        this._w = v;
        this.canvas.width = this.width;
    }

    get width() {
        return this._w;
    }

    set height(v) {
        this._h = v;
        this.canvas.height = this.height;
    }

    get height() {
        return this._h;
    }

    get imageData() {
        return this.context.getImageData(0, 0, this.width, this.height);
    }

    render(image, smoothing = false) {
        this.context.imageSmoothingEnabled = smoothing;
        this.context.drawImage(
            image,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
            0,
            0,
            this.width,
            this.height
        );
    }

    static calculateAspectRatioFit(srcWidth, srcHeight, maxWidth = 128, maxHeight = 128) {
        if (srcWidth <= 0 || srcHeight <= 0) return { width: 0, height: 0 };

        const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

        return {
            width: Math.ceil(srcWidth * ratio),
            height: Math.ceil(srcHeight * ratio),
        };
    }
}

class CrossStitch {
    constructor() { }

    static toCrossStitchData(imageData, is8bit = true) {
        const groups = [];
        const data = imageData.data;
        const w = imageData.width;
        const h = imageData.height; // Fixed from width to height

        return new Promise((resolve, reject) => {
            const L = imageData.data.length;

            for (let i = 0; i < L; i += 4) {
                const a = data[i + 3];
                if (a === 0) continue;

                const x = (i / 4) % w;
                const y = Math.floor(i / 4 / w);

                const c = new Rgb([data[i], data[i + 1], data[i + 2]]);
                const color = is8bit ? new Rgb(ColorConverter.bpp8to24bpp(c)) : c;
                let g;

                const temtG = groups.find((i) => i.color === color.toString());

                if (temtG) {
                    g = temtG;
                } else {
                    g = {
                        id: 1,
                        color: color.toString(),
                        items: [],
                    };
                    groups.push(g);
                }

                g.items.push({ x, y });
            }

            groups.sort((a, b) => b.items.length - a.items.length);

            resolve({ width: w, height: h, data: groups });
        });
    }
}

// Type declarations
// Since JavaScript does not have a built-in type system like TypeScript, we will comment them out.
const dialog = new FileDialog("image/*", false);
const image = document.querySelector("#image");
const svg = document.querySelector("#svg");
const details = document.querySelector("#details");
const is8bit = document.querySelector("#is8bit");
const svgResult = document.querySelector("#svgResult");
const colores = document.querySelector("#colors");

let maxSize = 64;

// Main logic
window.addEventListener("fileOk", (e) => {
    const files = e.detail.files;
    if (!files) return;

    const file = files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        image.src = reader.result;
    };
});

image.addEventListener("load", (e) => {
    render();
});

const removeDuplicates = (colors) => {
    return [...new Set(colors)];
};


// Función para convertir 'rgb(r, g, b)' a un array de números [r, g, b]
const rgbToArray = (rgb) => rgb.match(/\d+/g).map(Number);

// Función para calcular la distancia Euclidiana entre dos colores
const colorDistance = (color1, color2) => {
    console.log(color1);
    console.log(color2);
    const [r1, g1, b1] = rgbToArray(color1);
    const [r2, g2, b2] = rgbToArray(color2);
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
};

// Umbral de similitud
const THRESHOLD = 35;

const removeSimilarColors = (colors) => {
    const uniqueColors = [];

    for (const item of colors) {
        const color = item;
        // Comprobar si el color es similar a alguno en uniqueColors
        const isSimilar = uniqueColors.some(uniqueColor => {
            console.log(colorDistance(color, uniqueColor));
            return colorDistance(color, uniqueColor) < THRESHOLD;
        });

        if (!isSimilar) {
            uniqueColors.push(item);
        }
    }

    return uniqueColors;
};


function render() {
    maxSize = details.value;
    maxSize = Math.min(image.naturalWidth, maxSize);
    const scaledSize = CanvasRender.calculateAspectRatioFit(
        image.naturalWidth,
        image.naturalHeight,
        maxSize,
        maxSize
    );

    const canvasRender = new CanvasRender(scaledSize.width, scaledSize.height);
    canvasRender.render(image);

    CrossStitch.toCrossStitchData(canvasRender.imageData, is8bit.checked).then((data) => {
        // console.log(data);
        svg.setAttribute('viewBox', `0 0 ${scaledSize.width} ${scaledSize.height}`);
        svgResult.innerHTML = getGroupMarkupString(data.data);

        const colorsArray = data.data.map(item => item.color);
        console.log(colorsArray);
        const uniqueColors = removeDuplicates(colorsArray);
        const similarColorsRemoved = removeSimilarColors(uniqueColors);
        console.log(similarColorsRemoved);

        if (window.ReactNativeWebView) { // ensure window.ReactNativeWebView is there, otherwise, web app might crash if is not there
            window.ReactNativeWebView.postMessage(JSON.stringify(similarColorsRemoved))
        }
    });

    document.querySelector(".toolbar").classList.add("hide");
}

function getGroupMarkupString(groups) {
    let res = '';
    groups.forEach(g => {
        res += `<g color="${g.color}">`;
        g.items.forEach(i => {
            res += `<use href="#x" x="${i.x}" y="${i.y}"></use>`;
        });
        res += `</g>`;
    });
    return res;
}


setInterval(() => {
    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage("keepAlive");
    }
}, 3000);