var imageLoader = document.getElementById('img-uploader');
var originalImage = document.getElementById("original-image");
var filteredImageCanvas = document.getElementById("filtered-image");
var filterChanger = document.getElementsByClassName("filter-changer");
var imageUploaded = false;
let i

// Handle image upload into img tag
imageLoader.addEventListener('change', function(e){
		var reader = new FileReader();
    
    reader.onload = function(event){
        originalImage.onload = function(){
             console.log("Image Succesfully Loaded");
             imageUploaded = true;
        };
        originalImage.src = event.target.result;
    };
    
    reader.readAsDataURL(e.target.files[0]);   
}, false);

let laplace = document.getElementById('laplacian')
let gaussian = document.getElementById('gaussian')
let brightness = document.getElementById('brightness')
let gamma = document.getElementById('gamma')

function applyFilter(e)  {
  console.log("asd");
  	
  if((imageUploaded) && (laplace.checked || gaussian.checked)){
    
    let modifiedImage = originalImage

    if (i === 0) {
      i++
      LenaJS.filterImage(filteredImageCanvas, LenaJS[e.value], modifiedImage);
    } else {
      LenaJS.redrawCanvas(filteredImageCanvas, LenaJS[e.value]);
    }
  	
  	if(laplace.checked)LenaJS.filterImage(filteredImageCanvas, LenaJS[laplace.value], modifiedImage);
  	if(gaussian.checked)LenaJS.filterImage(filteredImageCanvas, LenaJS[gaussian.value], modifiedImage);

    console.log(modifiedImage);
  }
}