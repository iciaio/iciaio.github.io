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

Using several (default 100) initial frames of the background, 
we use intensity and color differences to infer the foreground. 

I modified the algorithm described in the above paper to include 
color differences as this algorithm will mainly be used to detect hands.
*/

//this array will contain an average of red, green, blue, and intensity for each pixel in the background frames
//[1,2,3,4,5,6,7,8] means the average red in the first pixel across 100 captured background frames is 1, the average blue across 100 frames is 2 etc..
var backgroundAvg;

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

function draw() {

   backContext.drawImage(video,0,0,cw,ch);

   var idata = backContext.getImageData(0,0,cw,ch);
   var data = idata.data;

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
         data[i] = 0;
         data[i+1] = 0;
         data[i+2] = 0;

         backmeanI += backI;
         backmeanR += backgroundAvg[i];
         backmeanG += backgroundAvg[i+1];
         backmeanB += backgroundAvg[i+2];
         numback ++;

      } else { //foreground
         data[i] = 255;
         data[i+1] = 255;
         data[i+2] = 255;

         foremeanI += currI;
         foremeanR += r;
         foremeanG += g;
         foremeanB += b;            
         numfore ++;
      }
   }

   ithreshold = ((foremeanI/numfore) + (backmeanI/numback))/2;
   
   var redMid = ((foremeanR/numfore) + (backmeanR/numback))/2;
   var greenMid = ((foremeanG/numfore) + (backmeanG/numback))/2;
   var blueMid = ((foremeanB/numfore) + (backmeanB/numback))/2;
   cthreshold = Math.min(redMid, blueMid, greenMid);

   idata.data = data;
   context.putImageData(idata,0,0);
   setTimeout(draw);
}

function captureBackground() {

   var background = backContext.getImageData(0, 0, cw, ch);
   var backgroundData = background.data;
   backgroundAvg = new Array(backgroundData.length);

   for (var j = 0; j < numBackFrames; j++){

      backContext.drawImage(video, 0, 0, cw, ch);
      background = backContext.getImageData(0, 0, cw, ch);
      backgroundData = background.data;

      for(var i = 0; i < backgroundData.length ; i+=4) {
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
      }
      while (video.readyState !== video.HAVE_ENOUGH_DATA){
         sleep(20);
      }
   }

   for (var k = 0; k < backgroundAvg.length; k++){
      backgroundAvg[k] /= numBackFrames;
   }

   draw();
}