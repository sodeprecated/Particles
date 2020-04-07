
class KDNode{
    // axis : 0 - x, 1 - y bitmask
    constructor(axis, mid,left,right, array,sz,aabb){
        this.size = sz;
        this.axis = axis;
        this.val = mid;
        this.left = left;
        this.right = right;
        this.array = array.map(a=>a);
        this.bb = aabb;
    }
}

function Median(l,pivot_fn = PickPivot){
    if(l.length % 2 == 1)
        return QuickSelect(l,l.length/2,pivot_fn);
    else return 0.5*(QuickSelect(l,l.length/2,pivot_fn)+QuickSelect(l,l.length/2-1,pivot_fn));
}

function QuickSelect(l,k,pivot_fn){

    k = Math.floor(k);


    if(l.length == 1){
        if(k != 0) throw new Error("k is out of range");
        return l[0];
    }

    let pivot = pivot_fn(l);

    let lows = [],highs = [],pivots = [];
    for(let i = 0; i < l.length; ++i){
        if(l[i] < pivot) lows.push(l[i]);
        else if(l[i] > pivot) highs.push(l[i]);
        else pivots.push(l[i]);
    }

    if(k < lows.length){
        return QuickSelect(lows,k,pivot_fn);
    }else if(k < lows.length + pivots.length){
        return pivots[0];
    }else{
        return QuickSelect(highs,k - lows.length - pivots.length,pivot_fn);
    }
}

function PickPivot(l){
    if(l.length == 0){
        throw new Error("Empty array");
    }

    if(l.length < 5){
        l.sort((a,b)=>{
            if(a < b) return -1;
            else if(a > b) return 1;
            else return 0;
        });
        if(l.length % 2 == 1) return l[l.length/2];
        else return 0.5*(l[l.length/2] + l[l.length/2-1]);
    }

    let chunks = Chunked(l,5);

    let full_chunks = [];
    for(let i of chunks){
        if(i.length == 5){
            i.sort((a,b)=>{
                if(a < b) return -1;
                else if(a > b) return 1;
                else return 0;
            });
            full_chunks.push(i);
        }
    }

    let medians = [];
    for(let i = 0; i < full_chunks.length; ++i){
        medians.push(full_chunks[i][2]);
    }

    let median_of_medians = Median(medians,PickPivot);

    return median_of_medians;

}

function Chunked(l,chunk_size){
    let chunks = [[]];
    let j = 0,cur = 0;
    for(let i = 0; i < l.length; ++i){
        if(cur < chunk_size){
            chunks[j].push(l[i]);
            ++cur;
        }else
        {
            cur = 1;
            ++j;
            chunks.push([]);
            chunks[j].push(l[i]);
        }
    }
    return chunks;
}



function DevideX(points){
    let l = points.map(a=>a.x);
    let m = Median(l);
    let left = points.filter(a=>a.x < m),
        right = points.filter(a=>a.x > m),
        mid = points.filter(a=>a.x==m);
    return {pivot: m,low: left, high: right, center: mid};
}


function DevideY(points){
    let l = points.map(a=>a.y);
    let m = Median(l);
    let left = points.filter(a=>a.y < m),
        right = points.filter(a=>a.y > m),
        mid = points.filter(a=> (a.y === m));
    //console.log(mid,m);
    return {pivot: m,low: left, high: right, center: mid};
}

function BuildKDTree(set,bb){

    if(set.length == 0){
        return null;
    }

    if(set.length <= 1){
        return new KDNode(0,0,null,null,set,1,bb);
    }

    let divisionX = DevideX(set), divisionY = DevideY(set);

    if(divisionX.center.length <= divisionY.center.length){
        return new KDNode(0,divisionX.pivot,BuildKDTree(divisionX.low,{x:bb.x,y: bb.y,width:divisionX.pivot - bb.x,height:bb.height}),
                                            BuildKDTree(divisionX.high,{x:divisionX.pivot,y:bb.y,width: bb.x + bb.width - divisionX.pivot,height:bb.height}),divisionX.center,set.length,bb);
    }else{
        return new KDNode(1,divisionY.pivot,BuildKDTree(divisionY.low,{x:bb.x,y:divisionY.pivot,width:bb.width,height:divisionY.pivot - bb.y + bb.height}),
                                            BuildKDTree(divisionY.high,{x:bb.x,y:bb.y,width:bb.width,height:bb.y - divisionY.pivot}),divisionY.center,set.length,bb);
    }
}



function Dist(p, point){
    return Math.sqrt((p.x - point.x)*(p.x - point.x) + (p.y - point.y)*(p.y - point.y));
}

function CheckRadius(p,r,bb){
    let dx,dy;
    dx = p.x - Math.max(bb.x,Math.min(p.x,bb.x + bb.width));
    dy = Math.max(bb.y - bb.height,Math.min(p.y,bb.y)) - p.y;
    return ((dx*dx + dy*dy) <= r*r);
}


function InRadius(point,radius,node){
    if(node == null){
        return [];
    }
    if(!node.left && !node.right){
        return node.array.filter(a => Dist(point,a) <= radius);
    }

    if(node.axis == 0){
        if(point.x < node.val){
            let r = InRadius(point,radius,node.left).concat(node.array.filter(a => Dist(point,a) <= radius));
            if(node.right && CheckRadius(point,radius,node.right.bb)){
                r = r.concat(InRadius(point,radius,node.right));
            }
            return r;
        }else{
            let r = InRadius(point,radius,node.right).concat(node.array.filter(a => Dist(point,a) <= radius));
            if(node.left && CheckRadius(point,radius,node.left.bb)){
                r = r.concat(InRadius(point,radius,node.left));
            }
            return r;
        }
    }else{
        if(point.y < node.val){
            let r = InRadius(point,radius,node.left).concat(node.array.filter(a => Dist(point,a) <= radius));
            if(node.right && CheckRadius(point,radius,node.right.bb)){
                r = r.concat(InRadius(point,radius,node.right));
            }
            return r;
        }else{
            let r = InRadius(point,radius,node.right).concat(node.array.filter(a => Dist(point,a) <= radius));
            if(node.left && CheckRadius(point,radius,node.left.bb)){
                r = r.concat(InRadius(point,radius,node.left));
            }
            return r;
        }
    }
}