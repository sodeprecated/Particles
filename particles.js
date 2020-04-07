
class Point{
    constructor(_x,_y,_angle,_speed){
        if(!Point._id){
            Point._id = 0;
        }
        this.id = Point._id++;
        this.x = _x;
        this.y = _y;
        this.angle = _angle;
        this.speed = _speed;
        this.time = performance.now();
        this.radius = Random(3,4.5);
    }
}

let mouseX = 0,mouseY = 0;

const Random = (start,end) => {
    return start + Math.random()*(end - start);
}

const fill = (r,g,b,a = 1) => {
    let ctx = Canvas.context;
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
}

const stroke = (r,g,b,a = 1) => {
    let ctx = Canvas.context;
    ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
}

const strokeWidth = (w) => {
    let ctx = Canvas.context;
    ctx.lineWidth = w;
}

const circle = (x,y,r) => {
    let ctx = Canvas.context;
    ctx.beginPath();
    ctx.arc(x,y,r,0,2*Math.PI);
    ctx.stroke();
    ctx.fill();
}

const line = (x1,y1,x2,y2) =>{
    let ctx = Canvas.context;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}


function fps(){
    return 1./Time.deltaTime;
}



const Points = {};
const Canvas = {};
let MaxPoints = 100;
const Speed = 100;
const Radius = 160;
const EstimatedFPS = 35;
const MaxDist = 160;
const Time = {
    deltaTime:1./EstimatedFPS
}


function createCanvas(_width,_height){
    Canvas.width = _width;
    Canvas.height = _height;
    Canvas.canvas = document.createElement('canvas');
    document.body.append(Canvas.canvas);
    Canvas.canvas.width = _width;
    Canvas.canvas.height = _height;
    Canvas.context = Canvas.canvas.getContext("2d");
    MaxPoints = Math.floor(Canvas.width*Canvas.height/11000);
}


function resizeCanvas(_width,_height){
    Canvas.width = _width;
    Canvas.height = _height;
    Canvas.canvas.width = _width;
    Canvas.canvas.height = _height;
}

function generatePoint(){
    let edge = Math.floor(Math.random()*4);

    /**
     * 0 - top
     * 1 - right
     * 2 - bottom
     * 3 - left
     */

    let x,y; 
    let p;
    if(edge == 0){
        y = -MaxDist - 10;
        x = Math.random()*Canvas.width;
        p = new Point(x,y,Random(Math.PI,2*Math.PI),Random(Speed - Speed*0.2,Speed + Speed*0.2))
    }else if(edge == 1){
        x = Canvas.width + 10 + MaxDist;
        y = Math.random()*Canvas.height;
        p = new Point(x,y,Random(Math.PI*0.5,1.5*Math.PI),Random(Speed - Speed*0.2,Speed + Speed*0.2))
    }else if(edge == 2){
        y = Canvas.height + 10 + MaxDist;
        x = Math.random()*Canvas.width;
        p = new Point(x,y,Random(0,Math.PI),Random(Speed - Speed*0.2,Speed + Speed*0.2))
    }else{
        x = -MaxDist - 10;
        y = Math.random()*Canvas.height;
        p = new Point(x,y,Random(-0.5*Math.PI,0.5*Math.PI),Random(Speed - Speed*0.2,Speed + Speed*0.2))
    }
    
    Points[p.id] = p;
}




function setup(){    
    
    createCanvas(window.innerWidth,window.innerHeight);
    Canvas.canvas.style.backgroundImage = `url(https://picsum.photos/${Canvas.width}/${Canvas.height})`;
    for(let i = 0; i < MaxPoints;++i){
        generatePoint();
    }

    for(let i in Points){
        Points[i].x = Random(0,Canvas.width);
        Points[i].y = Random(0,Canvas.height);
    }

}




function draw(){
    if(!Canvas.canvas) return;
    let ctx = Canvas.context;
    
    stroke(255,255,255,255);

    ctx.clearRect(0,0,Canvas.width,Canvas.height);
    let point;

    for(let i = Object.keys(Points).length; i < MaxPoints; ++i){
        generatePoint();
    }


    let set = [];
    let left = Infinity,right = -Infinity,top = -Infinity,down = Infinity;

    for(let i in Points){
        let point = Points[i];
        
        point.x += Math.cos(point.angle)*Time.deltaTime*point.speed;
        point.y -= Math.sin(point.angle)*Time.deltaTime*point.speed;

        left = Math.min(left,point.x);
        right = Math.max(right,point.x);
        top = Math.max(top,point.y);
        down = Math.min(down,point.y);

        set.push({x:point.x,y:point.y,id:point.id});
    }

    let tree = BuildKDTree(set,{x:left,y:top,width: right - left,height: top - down});

    for(let i of InRadius({x:mouseX,y:mouseY},Radius,tree)){
        let point = i;
        let d = Math.sqrt((point.x - mouseX)*(point.x - mouseX) + (point.y - mouseY)*(point.y - mouseY));
        let dx = (point.x - mouseX)/d,dy = (point.y - mouseY)/d;
        if(d <= Radius){
            Points[i.id].x = (Radius+0.0000)*dx + mouseX;
            Points[i.id].y = (Radius+0.0000)*dy + mouseY;
        }
    }
    const map = new Map();

    let idToDelete = [];
    for(let i in Points){
        
        point = Points[i];

        let checkPoint = function(p){
            if(p.x > Canvas.width+10 || p.x < -10 || p.y > Canvas.height + 10 || p.y < -10){
                return true;
            }
        }

        if(checkPoint(point) && checkPoint({x:point.x + Math.cos(point.angle)*(MaxDist+20),y:point.y - Math.sin(point.angle)*(MaxDist+20)})){
            idToDelete.push(i);
        }


        

        for(let j of InRadius(point,MaxDist,tree)){
            if(j.id == point.id) continue;


            //console.log(map.get(`${Math.min(j.id,point.id)}-${Math.min(j.id,point.id)}`));

            if(map.get(`${Math.min(j.id,point.id)}-${Math.max(j.id,point.id)}`) != undefined) continue;

            map.set(`${Math.min(j.id,point.id)}-${Math.max(j.id,point.id)}`,true);
            let a = j;
            let d = Math.sqrt((point.x - a.x)*(point.x - a.x) + (point.y - a.y)*(point.y - a.y));
            


            strokeWidth((1.-d/MaxDist) * 1.5);
            line(a.x,a.y,point.x,point.y);

        }


        fill(255,255,255,255);
        strokeWidth(0);
        //strokeWidth(point.radius*1);
        circle(point.x,point.y,point.radius);
    }

    for(let i of idToDelete){
        delete Points[i];
    }
}



window.onresize = () =>{
    resizeCanvas(window.innerWidth,window.innerHeight);
    Canvas.canvas.style.backgroundImage = `url(https://picsum.photos/${Canvas.width}/${Canvas.height})`;
    MaxPoints = Math.floor(Canvas.width*Canvas.height/11000);
}







 function interval(duration, fn){
    this.baseline = undefined
    
    this.run = function(){
      if(this.baseline === undefined){
        this.baseline = performance.now()
      }
      fn()
      var end = performance.now()
      this.baseline += duration
   
      var nextTick = duration - (end - this.baseline)
      if(nextTick<0){
        nextTick = 0
      }
      (function(i){
          i.timer = setTimeout(function(){
          i.run(end)
        }, nextTick)
      }(this))
    }
  
  this.stop = function(){
     clearTimeout(this.timer)
   }
  }



  let last = performance.now();
  let _start = false;
  var MainLoop = new interval(1000./EstimatedFPS, function(){
    if(!_start && window.setup){
      setup();
      _start = true;
      jQuery(function($) {
      var x,y;
      $("canvas").mousemove(function(event) {
        var offset = $(this).offset();
        x = event.pageX- offset.left;
        y = event.pageY- offset.top;
        mouseX = x;
        mouseY = y;
       // $("#div1").html("(X: "+x+", Y: "+y+")");
     });
    });
    }
    Time.deltaTime = (performance.now() - last)*0.001;
    last = performance.now();
    if(window.draw)
      draw();


  })
  MainLoop.run()