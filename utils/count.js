function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }

function getNumberQuantity(numQuant){
    let numArray = [];
    for(let i = 0; i <= numQuant; i++){
        let ojbNum = {number: getRandomInt(1,1001),
                      salio: 1}
        let foundNum = false;
        for(let i = 0; i< numArray.length; i++){
            if(ojbNum.number == numArray[i].number){
                numArray[i].salio++;
                foundNum = true;
            }
        }
        if(!foundNum){
            numArray.push(ojbNum);
        }
        foundNum = false;
    }
    return numArray;
    
}


process.on("message", msg=>{
    let cant = parseInt(msg)
    process.send(getNumberQuantity(cant))    
})

