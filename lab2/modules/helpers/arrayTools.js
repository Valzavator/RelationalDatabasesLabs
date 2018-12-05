module.exports.compareArrays = function (thisArr, otherArrr) {
    // if the other otherArrr is a falsy value, return
    if (!otherArrr)
        return false;

    // compare lengths - can save a lot of time 
    if (thisArr.length != otherArrr.length)
        return false;

    for (var i = 0, l=thisArr.length; i < l; i++) {
        // Check if we have nested otherArrrs
        if (thisArr[i] instanceof Array && otherArrr[i] instanceof Array) {
            // recurse into the nested otherArrrs
            if (!thisArr[i].equals(otherArrr[i]))
                return false;       
        }           
        else if (thisArr[i] != otherArrr[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}