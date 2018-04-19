var request = require('request');
var https = require("https");
var http = require("http");
var cheerio = require('cheerio');
var express = require('express');
var fs = require('fs');
var app     = express();
var filterdomains=["youtube.com","metrolyrics.com"];
var counter=1;
//var obj = JSON.parse(fs.readFileSync('lyricindex.dat', 'utf8'));

var bojanapu={data:[]};
var rankedurls=[];

app.get('/bing', function(req, res){
var searchTerm= req.query.q.replace(/ /g, '+')
var artist = req.query.a;
var year = req.query.y;
var album = req.query.alb;
var rankedurls=[];
var resbody;
var hosteng="www.bing.com";
var srselector;


if(counter == 1){
counter++;
hosteng="www.google.co.in";
srselector=".r";

}else if(counter == 2){
counter++;
hosteng = "search.yahoo.com";
srselector="ol.mb-15 li"
}else if(counter ==3){
counter=1;
srselector = "#b_results li.b_algo";
}
var options = {
    protocol: 'https:',
        host: hosteng,
        path: '/search?q='+searchTerm+''
    };
var body = '';
//console.log(options);
    https.get(options, function(responseFromRemoteApi) {
        responseFromRemoteApi.on('data', function(chunk) {
            body += chunk;
        });
        responseFromRemoteApi.on('end', function() {
        $ = cheerio.load(body);
        rankedurls=[];
                links = $(srselector); //jquery get all Search Results
                $(links).each(function(i, link){
                   rankedurls.push({link:$(link).find('a').attr('href').replace("/url?q=",""),weight:rankURL(searchTerm,$(link).find('a').attr('href').replace("/url?q=",""),artist,year,album,$(link).text())});
                  });
var urlt = rankedurls.sort(dynamicSort("weight"));
console.log(urlt[0]);
if(urlt.length==0){
res.end();
}
var options = {
        protocol:'http:',
        host: 'jws-app-nbojanapuae.1d35.starter-us-east-1.openshiftapps.com',
        path: '/api/v1/content?url='+urlt[0].link
    };

    body = '';

    http.get(options, function(responseFromRemoteApi) {
        responseFromRemoteApi.on('data', function(chunk) {
            body += chunk;
        });
        responseFromRemoteApi.on('end', function() {
//    res.writeHead(200, { 'Content-type': 'text/html' });
            res.write(body);
        res.end();

        });
    }).on('error', function(e) {
        console.log('Error when calling remote API: ' + e.message);


    });
//  res.end('Searching for:'+searchTerm+":"+artist+":"+year+":"+album+":\n");
})
})
})

app.set('port', ($OPENSHIFT_Cart_Name_PORT || 8080));

app.listen(app.get('port'))

console.log('Magic happens on port ',app.get('port'));

exports = module.exports = app;


function addEntry(searchTerm,link,artist,year,album){
//    bojanapu.data.push("album":"","song":searchTerm,"link":link,"artist":artist,"year":year);
}



function rankURL(searchTerm,link,artist,year,album,urlentry){
var explodeartist = artist.split(",");
var i,j,fa;
var aw=45,bw=45,artw=0,tw=0,yw=0;
   if(urlentry.toLowerCase().indexOf(album.toLowerCase())!=-1){
       aw=35;
       bw=25;
   }

   for (i = 0; i < explodeartist.length; i++) {
    if(urlentry.toLowerCase().indexOf(explodeartist[i].toLowerCase())!=-1){
        
        artw = artw + (bw/explodeartist.length)    //artw considering as 45
    }else{
        tw=0;
        fa = explodeartist[i].split(" ");
        for (j=0;j<fa.length;j++){
            
        if(urlentry.toLowerCase().indexOf(fa[j].toLowerCase())!=-1){
                tw = (bw/(explodeartist.length*fa.length));
            }

         }
    artw = artw + tw;
        
    }

   }

if(link.toLowerCase().indexOf("blogspot")!=-1 || link.toLowerCase().indexOf("wordpress")!=-1){
                aw=aw+25;
        }
   if(link.toLowerCase().indexOf("lyric")!=-1){
      aw=aw+15;
   }
   if(urlentry.toLowerCase().indexOf(year.toLowerCase())!=-1){
      yw=10;
   }
var totalrank = 0;
if(filterdomains.indexOf(extractHostname(link.toLowerCase())) ==-1){
totalrank= aw+artw+yw;
}
if(link.toLowerCase().endsWith(".pdf") || link.toLowerCase().endsWith(".doc") || link.toLowerCase().indexOf("video")!=-1){
totalrank=0;
}
return totalrank;
}

function extractHostname(url) {
    var hostname;
    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }
    hostname = hostname.split(':')[0];
    hostname = hostname.split('?')[0];
    return hostname.replace("www.","");
}

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] > b[property]) ? -1 : (a[property] < b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}
