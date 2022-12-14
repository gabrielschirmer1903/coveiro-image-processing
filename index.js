const imageLoader = document.getElementById('upload-input');
const filterChanger = document.getElementsByClassName("filter-changer");
const imageUploaded = false;
let originalImage = new Image();
let filteredImage = new Image();

/**  @type {HTMLCanvasElement} */
const canvaoOriginal = document.getElementById("canvao")
const canvaoComFiltro = document.getElementById("filtered-image")
const contextOriginal = canvaoOriginal.getContext("2d")
const contextComFiltro = canvaoComFiltro.getContext("2d")

const laplace = document.getElementById('laplacian')
const gaussian = document.getElementById('gaussian')
const brightness = document.getElementById('brightness')
const gamma = document.getElementById('gamma')

originalImage.onload = () => {
  canvaoOriginal.width = originalImage.width
  canvaoOriginal.height = originalImage.height
  canvaoComFiltro.width = originalImage.width
  canvaoComFiltro.height = originalImage.height

  contextOriginal.drawImage(originalImage, 0, 0)
  contextComFiltro.drawImage(originalImage, 0, 0)
}

imageLoader.addEventListener('change', function (e) {
  var reader = new FileReader();

  reader.onload = function (event) {
    originalImage.src = event.target.result;
  };

  reader.readAsDataURL(e.target.files[0]);
}, false);

function resetFilters() {
  contextComFiltro.drawImage(originalImage, 0, 0)

  laplace.checked = false
  gamma.checked = false
  gaussian.checked = false
  brightness.checked = false
}


function applyGauss() {
  let pixels = contextComFiltro.getImageData(0, 0, canvaoOriginal.width, canvaoOriginal.height)

  const sigma = 8
  var kernel = makeGaussKernel(sigma);

  // Blur a cahnnel (RGB or Grayscale)
  for (var ch = 0; ch < 3; ch++) {
    gauss_internal(pixels, kernel, ch, false);
  }

  contextComFiltro.putImageData(pixels, 0, 0);
}

/**
* APROXIMACAO UNIDIMENSIONAL
* @param pixels - pixels do canvas
* @param kernel - Kernel do Gaussian Blur
* @param colorChannel - canal de cores onde o blur sera aplicado
* @param grayFlag - flag para mostrar o RGB
* @param ch - canal de cores
* @param kl - tamanho do kernel
*/
function gauss_internal(pixels, kernel, ch, gray) {
  const data = pixels.data;
  const width = pixels.width;
  const heigth = pixels.height;
  let buff = new Uint8Array(width * heigth);
  const mk = Math.floor(kernel.length / 2);
  const kl = kernel.length;

  // Processando colunas
  for (let j = 0, hw = 0; j < heigth; j++, hw += width) {
    for (let i = 0; i < width; i++) {
      let sum = 0;
      for (let k = 0; k < kl; k++) {
        let col = i + (k - mk);
        col = (col < 0) ? 0 : ((col >= width) ? width - 1 : col);
        sum += data[(hw + col) * 4 + ch] * kernel[k];
      }
      buff[hw + i] = sum;
    }
  }

  // Processando linhas
  for (let j = 0, offset = 0; j < heigth; j++, offset += width) {
    for (let i = 0; i < width; i++) {
      let sum = 0;
      for (k = 0; k < kl; k++) {
        let row = j + (k - mk);
        row = (row < 0) ? 0 : ((row >= heigth) ? heigth - 1 : row);
        sum += buff[(row * width + i)] * kernel[k];
      }
      let off = (j * width + i) * 4;
      (!gray) ? data[off + ch] = sum :
        data[off] = data[off + 1] = data[off + 2] = sum;
    }
  }
}


/**
* APROXIMACAO UNIDIMENSIONAL
* Cria um array unidimensional, tamanho do filtro com seus coeficientes
*/
function makeGaussKernel(sigma) {
  const GAUSSKERN = 6.0;
  const dim = parseInt(Math.max(3.0, GAUSSKERN * sigma));
  const sqrtSigmaPi2 = Math.sqrt(Math.PI * 2.0) * sigma;
  const s2 = 2.0 * sigma * sigma;
  let sum = 0.0;

  let kernel = new Float32Array(dim - !(dim & 1)); // Transforma em impar
  const half = parseInt(kernel.length / 2);
  for (let j = 0, i = -half; j < kernel.length; i++, j++) {
    kernel[j] = Math.exp(-(i * i) / (s2)) / sqrtSigmaPi2;
    sum += kernel[j];
  }
  // Normalizando o kernel para previnir brilho ou escurecimento da imagem
  for (let i = 0; i < dim; i++) {
    kernel[i] /= sum;
  }
  return kernel;
}

// Laplace funcs
function applyLaplace() {
  let pixels = contextComFiltro.getImageData(0, 0, canvaoOriginal.width, canvaoOriginal.height)

  applyGrayScale(pixels)

  pixels = contextOriginal.getImageData(0, 0, canvaoOriginal.width, canvaoOriginal.height)

  const weights = [0, -1, 0,
    -1, 4, -1,
    0, -1, 0]

  var side = Math.round(Math.sqrt(weights.length)),
    halfSide = Math.floor(side / 2),
    src = pixels.data,
    canvasWidth = pixels.width,
    canvasHeight = pixels.height,
    outputData = contextComFiltro.createImageData(canvasWidth, canvasHeight)

  for (let y = 0; y < canvasHeight; y++) {

    for (let x = 0; x < canvasWidth; x++) {

      let dstOff = (y * canvasWidth + x) * 4,
        sumReds = 0,
        sumGreens = 0,
        sumBlues = 0

      for (let kernelY = 0; kernelY < side; kernelY++) {
        for (let kernelX = 0; kernelX < side; kernelX++) {

          let currentKernelY = y + kernelY - halfSide,
            currentKernelX = x + kernelX - halfSide

          if (currentKernelY >= 0 &&
            currentKernelY < canvasHeight &&
            currentKernelX >= 0 &&
            currentKernelX < canvasWidth) {

            let offset = (currentKernelY * canvasWidth + currentKernelX) * 4,
              weight = weights[kernelY * side + kernelX]

            sumReds += src[offset] * weight
            sumGreens += src[offset + 1] * weight
            sumBlues += src[offset + 2] * weight
          }
        }
      }

      outputData.data[dstOff] = sumReds
      outputData.data[dstOff + 1] = sumGreens
      outputData.data[dstOff + 2] = sumBlues
      outputData.data[dstOff + 3] = 255
    }
  }
  contextComFiltro.putImageData(outputData, 0, 0)
}

function applyGrayScale(pixels) {
  let data = pixels.data

  for (let i = 0; i < data.length; i += 4) {
    let count = data[i] + data[i + 1] + data[i + 2];
    let colour = 0;
    if (count > 510) colour = 255;
    else if (count > 255) colour = 127.5;

    data[i] = colour;
    data[i + 1] = colour;
    data[i + 2] = colour;
    data[i + 3] = 255;
  }
  contextComFiltro.putImageData(pixels, 0, 0)
}

//Brilho Funcs
function applyBrilho() {
  const imageData = contextComFiltro.getImageData(0, 0, canvaoOriginal.width, canvaoOriginal.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] + 100;
    data[i + 1] = data[i + 1] + 100;
    data[i + 2] = data[i + 2] + 100;
  }

  contextComFiltro.putImageData(imageData, 0, 0);
}

function applyGamma() {
  const imageData = contextComFiltro.getImageData(0, 0, canvaoOriginal.width, canvaoOriginal.height);
  const data = imageData.data;

  let gamma = 0.5;
  let gammaCorrection = 1 / gamma;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 * Math.pow((data[i] / 255), gammaCorrection);
    data[i + 1] = 255 * Math.pow((data[i + 1] / 255), gammaCorrection);
    data[i + 2] = 255 * Math.pow((data[i + 2] / 255), gammaCorrection);
  }

  contextComFiltro.putImageData(imageData, 0, 0);
}

function downloadNewImage() {
  const link = document.createElement("a")
  let currentDate = new Date()

  link.download = 'new_image_' + currentDate.getTime().toString() + '.png'
  link.href = canvaoComFiltro.toDataURL('image/png', 1.0).replace('image/png', 'image/octet-strem')
  link.click()
}