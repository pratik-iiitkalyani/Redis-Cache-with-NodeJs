'use strict';
const Express = require('express')
const Fetch = require('node-fetch')
const Redis = require('redis')
const Port = process.env.port || 5000;
const Redis_Port = process.env.port || 6379;

const Client = Redis.createClient(Redis_Port)

const App = Express();

// set setResponse
async function setResponse(username, repos) {
	return `${username} has ${repos} Github repos`
}

// Make request github for data

async function getRepos(req, res, next) {
	try{
		console.log('Fetching data.....')

		const { username } = req.params;

		const response  = await Fetch(`https://api.github.com/users/${username}`);
		const data = await response.json()
		const repos = data.public_repos;

		// set data to redis
		Client.setex(username, 3600, repos)
		setResponse(username, repos).then((value) => {
			console.log("value", value)
			res.send(value)
		})
		// console.log("x", x)
		
	} catch(err) {
		console.log(err);
		res.status(500);
	}
}


//cache middleware
function cache(req, res, next) {
	const { username } = req.params
	Client.get(username, (err, data)=> {
		if(err) throw err;
		if(data !== null) {
			setResponse(username, data).then(res).then((result) => {
				res.send(result)
			})
		}else {
			next();
		}
	})
}

App.get('/repos/:username', cache, getRepos)

// Start the Server
App.listen(Port, ()=>{
	console.log(`server running on port ${Port}`)
})

// module.exports = {
// 	App