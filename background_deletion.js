/*
Credit for background subtration algorithm to: 

  BACKGROUND SUBTRACTION USING A PIXEL-WISE
  ADAPTIVE LEARNING RATE
  FOR OBJECT TRACKING INITIALIZATION
  Ka Ki Ng and Edward J. Delp
  Video and Image Processing Laboratories (VIPER)
  School of Electrical and Computer Engineering
  Purdue University
  West Lafayette, Indiana USA

Basic algorithm:
1) BACKGROUND DETECTION AND SUBTRACTION
  Using several (default 100) initial frames of the background, 
  we use intensity and color differences between current frames 
  and initial background frame averages to infer the foreground. 

  I modified the algorithm described in the above paper to include 
  color differences as this algorithm will mainly be used to detect 
  hands.

2) UPDATING BACKGROUND MODEL
  to account for movement/slight changes in the background we weight 
  the probability of a pixel being a background pixel by the temporal 
  duration of the backgorund pixel. ie if it doesnt stay in the 
  foreground for very long, it is probably a background pixel.

3) To do later, time permitting: SUDDEN ILLUMINATION CHANGE AND SHADING MODEL
  to account for lighting changes/camera auto exposure adjustments etc.
  this can also be accounted for largely by disabling autoexposure on webcam though
*/

//this array will contain color and intensity data for each pixel averaged over the inital background frames
//format: [r,g,b,intensity,r,g,b,intensity,...etc]
var backgroundAvg;
//temporal background count: array containing number of frames the pixel has been a background pixel
//format: [#frames,0,0,0,#frames,0,0,0,....etc]
var temporalBCG; 

//averages of intensity and colors to be used in adaptive thresholds
var foremeanI = 0;
var backmeanI = 0;
var foremeanR = 0;
var backmeanR = 0;
var foremeanG = 0;
var backmeanG = 0;
var foremeanB = 0;
var backmeanB = 0;

//number of foreground and background pixels
var numfore = 0;
var numback = 0;

//initial values for intensity and color thresholds
var ithreshold = 127;
var cthreshold = 50;

//number of background frames capture in beginning
var numBackFrames = 100;

//image data and pixel array within image data respectively
var idata; 
var data;

var background; //for debug

//capture background gets average background
function captureBackground() {
  //reset values
  foremeanI = 0;
  backmeanI = 0;
  foremeanR = 0;
  backmeanR = 0;
  foremeanG = 0;
  backmeanG = 0;
  foremeanB = 0;
  backmeanB = 0;
  numfore = 0;
  numback = 0;
  ithreshold = 127;
  cthreshold = 50;

  //get data from stream
  background = backContext.getImageData(0, 0, cw, ch);
  var backgroundData = background.data;
  backgroundAvg = new Array(backgroundData.length);
  temporalBCG = new Array(backgroundData.length).fill(0);

  for (var j = 0; j < numBackFrames; j++){

    backContext.drawImage(video, 0, 0, cw, ch);
    background = backContext.getImageData(0, 0, cw, ch);
    backgroundData = background.data;

    for(var i = 0; i < backgroundData.length ; i+=4) {
      if (video.readyState === video.HAVE_ENOUGH_DATA){
        var r = backgroundData[i];
        var g = backgroundData[i+1];
        var b = backgroundData[i+2];
        var brightness = (3*r+4*g+b)>>>3;
        if (backgroundAvg[i] === undefined){
          backgroundAvg[i] = r;
        } else {
          backgroundAvg[i] += r;
        }
        if (backgroundAvg[i+1] === undefined){
          backgroundAvg[i+1] = g;
        } else {
          backgroundAvg[i+1] += g;
        }
        if (backgroundAvg[i+2] === undefined){
          backgroundAvg[i+2] = b;
        } else {
          backgroundAvg[i+2] += b;
        }
        if (backgroundAvg[i+3] === undefined){
          backgroundAvg[i+3] = brightness;
        } else {
          backgroundAvg[i+3] += brightness;
        }
      } else {
        sleep(20);
      }
    }
  }

  for (var k = 0; k < backgroundAvg.length; k++){
    backgroundAvg[k] /= numBackFrames;
  }

  update();
}

function update(){

  requestAnimationFrame(update);

  if (video.readyState === video.HAVE_ENOUGH_DATA){
    //get the stream as a binary image
    computeImage();
    //update and draw data on webpage
    idata.data = data;
    context.putImageData(idata,0,0);

    candidate = tracker.detect(idata);

    if (candidate !== undefined){
      contour = candidate.contour;
    }

    if (contour.length > 0){
      context.beginPath();
      context.lineWidth = 5;
      context.strokeStyle = "green";

      context.moveTo(contour[0].x, contour[0].y);
      for (i = 0; i < contour.length; ++ i){
        context.lineTo(contour[i].x, contour[i].y);
      }

      context.stroke();
      context.closePath();
    }
  }
}

//makes a binary image, subtracts background, etc
function computeImage() {

  //get data from video stream
  backContext.drawImage(video,0,0,cw,ch);

  idata = backContext.getImageData(0,0,cw,ch);
  data = idata.data;

  //loop through pixels 
  //compare color and intensity data of each pixel at location (x,y) to the average background pixel at location (x,y)
  for(var i = 0; i < data.length; i+=4) {
    var r = data[i];
    var g = data[i+1];
    var b = data[i+2];

    var currI = (3*r+4*g+b)>>>3;
    var backI = backgroundAvg[i+3];
    var iDiff = Math.abs(currI - backI);

    var rDiff = Math.abs(r - backgroundAvg[i]);
    var gDiff = Math.abs(g - backgroundAvg[i+1]);
    var bDiff = Math.abs(b - backgroundAvg[i+2]);
    var totalColorDiff = rDiff + gDiff + bDiff;

    if (iDiff < ithreshold && totalColorDiff < cthreshold) { //background

      //make background pixels black
      data[i] = 0;
      data[i+1] = 0;
      data[i+2] = 0;

      //add color/intensity data about each pixel for average frame background color/intensity
      backmeanI += backI;
      backmeanR += backgroundAvg[i];
      backmeanG += backgroundAvg[i+1];
      backmeanB += backgroundAvg[i+2];
      numback ++;

      //update temporalBCG, this pixel has been a background pixel for +1 more frames
      temporalBCG[i] += 1;

      //to make things faster, dont call updateBackgroundModel
      updateBackgroundModel(currI, backI, i);


    } else { //foreground
      //make foreground pixels white
      data[i] = 255;
      data[i+1] = 255;
      data[i+2] = 255;

      //add color/intensity data about each pixel for average frame foreground color/intensity
      foremeanI += currI;
      foremeanR += r;
      foremeanG += g;
      foremeanB += b;            
      numfore ++;

      //reset temporalBCG, this pixel has been a background pixel for 0 frames (its in the foreground now)
      temporalBCG[i] = 0;
    }
  }

  //adapt the intensity threshold
  ithreshold = ((foremeanI/numfore) + (backmeanI/numback))/2;

  //adapt the color threshold
  var redMid = ((foremeanR/numfore) + (backmeanR/numback))/2;
  var greenMid = ((foremeanG/numfore) + (backmeanG/numback))/2;
  var blueMid = ((foremeanB/numfore) + (backmeanB/numback))/2;
  cthreshold = Math.min(redMid, blueMid, greenMid);

}

// you can ignore this gnarly math stuff, most of it is just constants have had been empirically determined
// if you really wanna understand it, read the paper referenced above
function updateBackgroundModel(currI, backI, i){
  var iDiff = Math.abs(currI - backI);
  var cbg = Math.min(150,temporalBCG[i]);

  //a1 weights the probability of the background pixel based on how high the difference in intensity is;         
  var exp1 = ((-5) * Math.pow(iDiff,2))/(2 * ithreshold);
  var a1 = Math.pow(Math.E, exp1);
  
  //a2 weights the probability of the background pixel based on how long the background pixel has been a background pixel;
  var exp2 = -Math.pow((150 - cbg),2)/450;
  var a2 = Math.pow(Math.E, exp2);
  
  //weight intensity probability and temporal probability, you can change the weights tho as long as w1 + w2 <= 1
  var alpha = (0.75 * a1) + (0.25 * a2);
  backgroundAvg[i+3] = (alpha * currI) + ((1 - alpha) * backI);
}
