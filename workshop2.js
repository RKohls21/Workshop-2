const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const dateFormat = require('dateformat');
app.set("port", (8080));
app.use(bodyParser.json({ type: "application/json" }));
app.use(bodyParser.urlencoded({ extended: true }));

const Pool = require("pg").Pool;
const config = {
    host: "localhost",
    user: "postgres",
    password: "hello123",
    database: "server2"
};

const pool = new Pool(config);

app.get("/hello", (req, res) => {
    res.json("Suh cuh")
})

// FIXME in sql table, change table username to usernames or users. idk yet.
// as of now, only adds user or if username is taken, gives username taken error.
app.post("/create-user", async (req, res) => {
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const username = req.body.username;
    const email = req.body.email

    try{
        const t1 = "SELECT username FROM attendees WHERE username = $1";
        const res1 = await pool.query(t1, [req.body.username]);

        if (res1.rowCount > 0){
            res.json({ status: 'username taken'});
        } else {
            const template = "INSERT INTO attendees (firstname, lastname, username, email) VALUES ($1, $2, $3, $4)";
            const response = await pool.query(template, [firstname, lastname, username, email]);
            res.json({ status: "user added"});
        }
    } catch (err){
        res.json({ error: "error. error. " + err});
    }

});

app.delete("/delete-user", async (req, res) => {
    try {
        const template = "DELETE FROM attendees WHERE username = $1";
        const response = await pool.query(template, [req.query.username]);
        res.json({status: "deleted"});
    } catch(err){
        res.json({ status: "error " + err})
    }
});

app.get("/list-users", async (req, res) => {
    try{
        const template1 = "SELECT username, firstname, lastname, email FROM attendees"
        const template2 = "SELECT firstname, lastname FROM attendees";
        var response;
        if (req.query.type == 'full'){
            response = await pool.query(template1, []);
            var t = response.rows.map(function(item) {
                return item;
            })
            res.json({ users: t})
            
        } else if (req.query.type == 'summary'){
            response = await pool.query(template2, []);
            var n = response.rows.map(function(item){
                return item;
            })
            res.json({ users: n})

        } else {
            res.json({ status: "no arguments"})
        }
    } catch(err){
        res.json({ error: err})
    }
});

app.post("/add-workshop", async (req, res) => {
    const title = req.body.title;
    const date = req.body.date;
    const location = req.body.location;
    const maxseats = req.body.maxseats;
    const instructor = req.body.instructor;

    try {
        const t1 = "SELECT title FROM workshop where title = $1 and date = $2 and location = $3";
        const res1 = await pool.query(t1, [title, date, location]);

        if (res1.rowCount > 0){
            res.json({ status: "workshop already in database"});
        } else {
            const template = "INSERT INTO workshop (title, date, location, maxseats, instructor) VALUES ($1, $2, $3, $4, $5)";
            response = await pool.query(template, [title, date, location, maxseats, instructor]);
            res.json({ status: "workshop added"});
        }
    } catch(err){
        res.json({ error: "error: " + err})
    }
});

app.post("/enroll", async (req, res) => {
    const title = req.body.title;
    const date = req.body.date;
    const location = req.body.location;
    const username = req.body.username;

    try {
        const t1 = "SELECT username FROM attendees WHERE username = $1"
        const res1 = await pool.query(t1, [username]);
        if (res1.rowCount == 0){
            res.json({ status: "username not in database" }); 
        } else {
            const t2 = "SELECT id FROM workshop WHERE title = $1 and date = $2 and location = $3";
            const res2 = await pool.query(t2, [title, date, location]);

            if (res2.rowCount == 0){
                res.json({ status: "workshop does not exist"})
            } else {
                const workshop_id = res2.rows[0].id;

                const t3 = "SELECT attendee FROM workshop_attendees where attendee = $1 and workshop_id = $2";
                const res3 = await pool.query(t3, [username, workshop_id]);
                if (res3.rowCount > 0){
                    res.json({ status: "user already enrolled"});
                } else {
                    const t4 = "SELECT attendee FROM workshop_attendees WHERE workshop_id = $1";
                    const res4 = await pool.query(t4, [workshop_id])
                    const enlisted_attendees = res4.rowCount;
                    const t5 = "SELECT maxseats FROM workshop WHERE id = $1";
                    const res5 = await pool.query(t5, [workshop_id]);
                    const max_size = res5.rows[0].maxseats;
                    if (enlisted_attendees >= max_size){
                        res.json({ status: "no seats available"})
                    } else {
                        const template = "INSERT INTO workshop_attendees (attendee, workshop_id) VALUES ($1, $2)";
                        const response = await pool.query(template, [username, workshop_id]);
                        res.json({ status: "user added"});
                    }
                }
            }
        }

    } catch(err){
        res.json({ status: "error " + err})
    }
});

app.get("/list-workshops", async (req, res) => {
    try{
        const template = "SELECT title, date, location FROM workshop";
        const response = await pool.query(template, []);
        var results = [];
        for (x in response.rows){
            console.log(x)
            results.push({title: response.rows[x].title, date: dateFormat(response.rows[x].date,
                "yyyy-mm-dd"), location: response.rows[x].location})
        }
        res.json({ workshops: results});
    } catch(err) {
        res.json("error " + err);
    }
})

app.get("/attendees", async (req, res) =>{
    try{
        const t1 = "SELECT id FROM workshop WHERE title = $1 and date = $2 and location = $3";
        const res1 = await pool.query(t1, [req.query.title, req.query.date, req.query.location]);

        if (res1.rows == 0){
            res.json({ error: "workshop does not exist"});
        } else {
            const wshop_id = res1.rows[0].id;
            console.log(wshop_id);

            const template = "SELECT attendees.firstname, attendees.lastname\
             from attendees JOIN workshop_attendees ON attendees.username = \
             workshop_attendees.attendee WHERE workshop_attendees.workshop_id = $1";
            const response = await pool.query(template, [wshop_id]);
            var results = [];
            for(x in response.rows){
                results.push({ firstname: response.rows[x].firstname, lastname: response.rows[x].lastname})
            }
            console.log(response);
            res.json({ attendees: results});
        }
    } catch(err){
        res.json({ error: "error " + err})
    }
})

app.listen(app.get("port"), () => {
    console.log(`Find server at http://localhost:${app.get("port")}`);
});
