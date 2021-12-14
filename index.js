const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();  

//setRes function
function setResponse(uname, repos){
    return `<h1>${uname} has ${repos} git repos</h1>`
}

async function getRepost(req, res, next){
    try{
        console.log('Fetching Data....');

        const {username} = req.params;

        const response = await fetch(`http://api.github.com/users/${username}`);

        const data = await response.json();

        const repos = data.public_repos;

        //set data to redis
        client.setex(username,3600,repos); 
    
        res.send(setResponse(username,repos));
    }catch (err){
        console.log("error :",err);
        res.status(500);
    }
    
}

//cache meddileware
function cache(req,res,next){
    const { username } = req.params;

    client.get(username , (err,data) => {
        if(err) throw err;
        
        if(data !== null){
            res.send(setResponse(username, data));
        }else{
            next();
        }
    });
}


app.get("/repos/:username", cache, getRepost);

app.listen(PORT,() => {
    console.log(`App listning at port number ${PORT}`);
});
