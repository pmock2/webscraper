var result = '{"match":true,"cases":{"F-94-027085":{"fileDate":"08/11/1994","charges":{"0":{"charge":"COCAINE/POSSESSION","chargeType":"FELONY"},"1":{"charge":"DRUG PARAPHERNA/POSN","chargeType":"MISDEMEANOR"}}}},"first":"JOHN","last":"SMITH","DOB":{"day":"09","month":"12","year":"1957"}}'
var match;
var first;
var last;
var DOB;
var cases;


function test() {
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
    
    var resultObj = JSON.parse(result);
    
    match = resultObj.match;
    first = resultObj.first;
    last = resultObj.last;
    DOB = resultObj.DOB;
    cases = resultObj.cases;
    
    
    var container = document.createElement('DIV');
    
    for (var i = 0; i < cases.keys.length; i++) {
        // var case
    }
}