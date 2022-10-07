var imageLoader = document.getElementById('img-uploader');
var filterChanger = document.getElementsByClassName("filter-changer");
var imageUploaded = false;
let originalImage = new Image();
let filteredImage = new Image();

/**  @type {HTMLCanvasElement} */
const canvaoOriginal = document.getElementById("canvao")
const canvaoComFiltro = document.getElementById("filtered-image")
const contextOriginal = canvaoOriginal.getContext("2d")
const contextComFiltro = canvaoComFiltro.getContext("2d")



originalImage.onload = () => {
  // sets canvas size to fit images
  canvaoOriginal.width = originalImage.width
  canvaoOriginal.height = originalImage.height
  canvaoComFiltro.width = originalImage.width
  canvaoComFiltro.height = originalImage.height

  // draw original image
  contextOriginal.drawImage(originalImage, 0, 0)
  contextComFiltro.drawImage(originalImage, 0, 0)

}


// Handle image upload into img tag
imageLoader.addEventListener('change', function (e) {
  var reader = new FileReader();

  reader.onload = function (event) {
    originalImage.src = event.target.result;
  };

  reader.readAsDataURL(e.target.files[0]);
}, false);

let laplace = document.getElementById('laplacian')
let gaussian = document.getElementById('gaussian')
let brightness = document.getElementById('brightness')
let gamma = document.getElementById('gamma')

function applyFilter(e) {

}


function applyGauss() {
  let pixels = contextComFiltro.getImageData(0, 0, canvaoOriginal.width, canvaoOriginal.height)

  const sigma = 8
  var kernel = makeGaussKernel(sigma);

  // Blur a cahnnel (RGB or Grayscale)
  for (var ch = 0; ch < 3; ch++) {
    gauss_internal(pixels, kernel, ch, false);
  }
  // Apply the modified pixels
  contextComFiltro.putImageData(pixels, 0, 0);
}

/**
* Internal helper method
* @param pixels - the Canvas pixles
* @param kernel - the Gaussian blur kernel
* @param ch - the color channel to apply the blur on
* @param gray - flag to show RGB or Grayscale image
*/
function gauss_internal(pixels, kernel, ch, gray) {
  var data = pixels.data;
  var width = pixels.width;
  var heigth = pixels.height;
  var buff = new Uint8Array(width * heigth);
  var mk = Math.floor(kernel.length / 2);
  var kl = kernel.length;

  // First step process columns
  for (var j = 0, hw = 0; j < heigth; j++, hw += width) {
    for (var i = 0; i < width; i++) {
      var sum = 0;
      for (var k = 0; k < kl; k++) {
        var col = i + (k - mk);
        col = (col < 0) ? 0 : ((col >= width) ? width - 1 : col);
        sum += data[(hw + col) * 4 + ch] * kernel[k];
      }
      buff[hw + i] = sum;
    }
  }

  // Second step process rows
  for (var j = 0, offset = 0; j < heigth; j++, offset += width) {
    for (var i = 0; i < width; i++) {
      var sum = 0;
      for (k = 0; k < kl; k++) {
        var row = j + (k - mk);
        row = (row < 0) ? 0 : ((row >= heigth) ? heigth - 1 : row);
        sum += buff[(row * width + i)] * kernel[k];
      }
      var off = (j * width + i) * 4;
      (!gray) ? data[off + ch] = sum :
        data[off] = data[off + 1] = data[off + 2] = sum;
    }
  }
}

function makeGaussKernel(sigma) {
  const GAUSSKERN = 6.0;
  var dim = parseInt(Math.max(3.0, GAUSSKERN * sigma));
  var sqrtSigmaPi2 = Math.sqrt(Math.PI * 2.0) * sigma;
  var s2 = 2.0 * sigma * sigma;
  var sum = 0.0;

  var kernel = new Float32Array(dim - !(dim & 1)); // Make it odd number
  const half = parseInt(kernel.length / 2);
  for (var j = 0, i = -half; j < kernel.length; i++, j++) {
    kernel[j] = Math.exp(-(i * i) / (s2)) / sqrtSigmaPi2;
    sum += kernel[j];
  }
  // Normalize the gaussian kernel to prevent image darkening/brightening
  for (var i = 0; i < dim; i++) {
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

  for (var y = 0; y < canvasHeight; y++) {

    for (var x = 0; x < canvasWidth; x++) {

      var dstOff = (y * canvasWidth + x) * 4,
        sumReds = 0,
        sumGreens = 0,
        sumBlues = 0

      for (var kernelY = 0; kernelY < side; kernelY++) {
        for (var kernelX = 0; kernelX < side; kernelX++) {

          var currentKernelY = y + kernelY - halfSide,
            currentKernelX = x + kernelX - halfSide

          if (currentKernelY >= 0 &&
            currentKernelY < canvasHeight &&
            currentKernelX >= 0 &&
            currentKernelX < canvasWidth) {

            var offset = (currentKernelY * canvasWidth + currentKernelX) * 4,
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
  var width = pixels.width;
  var height = pixels.height;

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
const applyBrilho = () => {
  const imageData = contextComFiltro.getImageData(0, 0, canvaoOriginal.width, canvaoOriginal.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] + 100;
    data[i + 1] = data[i + 1] + 100;
    data[i + 2] = data[i + 2] + 100;
    // data[i + 3] = 255;
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