class FT {

  constructor(rad, x, y){
    this.candidate;
    this.tracker = new HT.Tracker();
    this.contour = [];
    this.hull = [];
    this.defects = [];

    this.palmCenter = {x:0, y:0};
    this.tips = [];

    this.boundary = {rad:rad, x:x, y:y};
  }

  analyzeImg(shortimg){
    this.candidate = this.tracker.detect(shortimg);
    if (this.candidate !== undefined){
      this.contour = this.candidate.contour;
      this.hull = this.candidate.hull;
      this.defects = this.candidate.defects;

      var cnt = 0;
      this.palmCenter = {x:0, y:0};
      for (var i = 0; i < this.defects.length; i++){
        this.palmCenter.x += this.defects[i].depthPoint.x;
        this.palmCenter.y += this.defects[i].depthPoint.y;
        cnt++;
      }

      this.palmCenter.x = Math.round(this.palmCenter.x/cnt);
      this.palmCenter.y = Math.round(this.palmCenter.y/cnt);
    }
  }

  showPalmCenter(context, shortimg){
    context.strokeStyle = "green";
    context.strokeRect(this.palmCenter.x-2, this.palmCenter.y-2, 4, 4);
    console.log(this.palmCenter.x);
  }

  showHull(context, shortimg){
    var hullArray = [];
    if (this.hull.length > 0){
      hullArray.push({dist:Math.hypot(this.hull[0].x-this.palmCenter.x, this.hull[0].y-this.palmCenter.y), x:this.hull[0].x, y:this.hull[0].y})
      for (var i = 1; i < this.hull.length; i++){
        if (this.farEnough(this.hull[i].x, this.hull[i].y, hullArray)){
          hullArray.push({dist:Math.hypot(this.hull[i].x-this.palmCenter.x, this.hull[i].y-this.palmCenter.y), x:this.hull[i].x, y:this.hull[i].y});
        }
      }
      hullArray.sort(function(a, b){
        if(a.dist < b.dist) return -1;
        if(a.dist > b.dist) return 1;
        return 0;
      });
      hullArray = hullArray.slice(0,5);
      for (var j = 0; j < hullArray.length; j++){
        if (Math.hypot(hullArray[j].x - this.boundary.x, hullArray[j].y - this.boundary.y) > this.boundary.rad){
          hullArray[j] = this.tips[j];
        }
      }
      if (hullArray.length <= 5){
        for (var j = 0; j < hullArray.length; j++){
          context.strokeStyle = "yellow";
          context.lineWidth = 2;
          context.strokeRect(hullArray[j].x-4,hullArray[j].y-4,8,8);
        }
      }
      // var colors = ["red", "yellow", "green", "blue", "purple"];
      // var indexOfSmallest;
      // var min;
      // var closest;
      // for (var i = 4; i >= 0; i--){
      //   min = 400;
      //   indexOfSmallest = 0;
      //   closest = {dist:Math.hypot(hullArray[0].x - this.tips[i].x, hullArray[0].y - this.tips[i].y), x:hullArray[0].x, y:hullArray[0].y};
      //   for (var j = 1; j <= i; j++){
      //     min = Math.min(Math.hypot(hullArray[j].x - this.tips[i].x, hullArray[j].y - this.tips[i].y),closest.dist);
      //     if (min !== closest.dist){
      //       closest = {dist:min, x:hullArray[j].x, y:hullArray[j].y};
      //       indexOfSmallest = j;
      //     }
      //   }
      //   posFingertips[i] = {x:closest.x, y:closest.y}
      //   context.strokeStyle = colors[i];
      //   context.lineWidth = 4;
      //   context.strokeRect(posFingertips[i].x-4, posFingertips[i].y-4, 8, 8);
      //   hullArray = hullArray.slice(0,indexOfSmallest).concat(hullArray.slice(indexOfSmallest+1,i+1));
      // }
      // offsets = [];
      // for (var m = 0; m < 5; m++){
      //   offsets.push({x:tips[m].x - posFingertips[m].x, y:tips[m].y - posFingertips[m].y});
      //   // console.log(" posFingertips: " + offsets[m].x + " " + (offsets[m].y));
      // }
    }
  }

  showDefects(context, shortimg){
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = "blue";
    for (var j = 0; j < this.defects.length; j++){
      context.strokeRect(this.defects[j].depthPoint.x-2, this.defects[j].depthPoint.y-2, 4, 4);
    }
  }

  showContour(context, shortimg){
    if (this.contour.length > 0){
      context.beginPath();
      context.lineWidth = 2;
      context.strokeStyle = "red";
      context.moveTo(this.contour[0].x, this.contour[0].y);
      for (var i = 0; i < this.contour.length; ++ i){
        context.lineTo(this.contour[i].x, this.contour[i].y);
      }
      context.lineTo(this.contour[0].x, this.contour[0].y);
      context.stroke();
      context.closePath();
    }
  }

  displayBinImg(context, shortimg){
    var idata = context.getImageData(0,0,shortimg.width,shortimg.height);
    var data = idata.data;
    for (var i = 0; i < data.length; i+=4){
      if (shortimg.data[i/4] === 0) {
        data[i] = 0;
        data[i+1] = 0;
        data[i+2] = 0;
      } else {
        data[i] = 255;
        data[i+1] = 255;
        data[i+2] = 255;
      }
    }
    context.putImageData(idata,0,0);
  }

  farEnough(x, y, List){
    for (var i = 0; i < List.length; i++){
      if (Math.hypot(x-List[i].x, y-List[i].y) < 20){
        return false;
      }
    }
    return true;
  }
}