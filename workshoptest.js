const bodyParser = require("body-parser");
const express = require("express");
const app = express();

app.set("port", 8080);

app.use(bodyParser.json({ type: "application/json" }));
app.use(bodyParser.urlencoded({ extended: true }));

const Pool = require("pg").Pool;
const config = {
	host: "localhost",
	user: "tester",
	password: "hello123",
	database: "tester"
};


const pool = new Pool(config);

app.get("/hello", (req, res) => {
	res.json("Hello Ryan");
});


app.get("/api", async (req, res) => {
	try{
		if(req.query.workshop){
			const t2 = "select attendee from attendees where workshop = $1";
			const r2 = await pool.query(t2, [req.query.workshop]);

			let list = [];
			for(let i = 0; i < r2.rowCount; i++){
				console.log(r2.rows[i]);
				list.push(r2.rows[i].attendee);
			}
			if(r2.rowCount == 0){
				res.json({error: "workshop not found"});
			} else {
				res.json({attendees: list});
			}
		} else {
			const t1 = "select workshop from attendees";
			const r1 = await pool.query(t1);
			let l2 = [];
			for(let i = 0; i < r1.rowCount; i++){
				console.log(r1.rows[i]);
				l2.push(r1.rows[i].workshop);
			}
			if(r1.rowCount == 0){
				res.json({status: "workshop not found", searchTerm: req.body.q});
			} else {
				res.json({workshops: l2})
			}
		}
	}
	catch(err){
			console.log(err);
	}	
});


app.post("/api", async (req, res) => {
	const attendee = req.body.attendee;
	const workshop = req.body.workshop;
	console.log(attendee)
	console.log(workshop)

	if(workshop == undefined || attendee == undefined){
		res.json({error: 'parameters not given'});
	} 
	else {
		try{
			const template = "SELECT attendee FROM attendees WHERE workshop = $1";
			const response = await pool.query(template, [req.body.workshop]);

			let attendeePresent = false;
			for(let i = 0; i<response.rowCount; i++){
				if(response.rows[i].attendee == attendee){
					attendeePresent = true;
					res.json({error: 'attendee already enrolled'})
				}
			}
			if(attendeePresent == false){
				try{
					const template = "insert into attendees (workshop, attendee) VALUES ($1, $2)";
					const response = await pool.query(template, [workshop, attendee])
					res.json({attendee: attendee, workshop: workshop})
				} catch(err){
					res.json(err)
				}
			}
		}
		catch(err){
			console.log(err);
		}	
	}
});


app.listen(app.get("port"), () => {
	console.log(`Find the server at http://localhost:${app.get("port")}`);
});