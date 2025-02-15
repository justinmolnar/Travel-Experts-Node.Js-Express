/**
 * Index.js
 * Serves as the main file for our project.
 * Author: Daniel Palmer
 * Co-author: Justin Molnar
 * Co-author: Marat Nikitin
 * Co-author: Shifa Malik
 * CPRG 207 - Threaded Project
 * 2021-11-22
 */

//Include Dependencies
const dayjs = require("dayjs");
const express = require("express");
const app = express();
const mysql = require("mysql");
const dateFormatting= require("./scripts/dateFormatting");

//Define port for server
var port = 8000;

app.use(express.urlencoded({extended: true}))

// Establish Static folders
app.use(express.static("scripts"))
app.use(express.static("views", {"extensions": ["html", "htm"]}))
app.use(express.static("assets"))
app.use(express.static("styles"))

app.set("view engine", "ejs")

// Open server on port defined above
app.listen(port, ()=>{
    console.log(`Server started on port ${port}, url: http://localhost:${port}`)
});


// Server the homepage by default
app.get('/te-node', (req, res)=>{
    res.render('index')
});

// Below serves as navigation for the webpage
app.get('/', (req, res)=>{
    res.sendFile('index.html')
});


app.get('/te-node-register', (req, res)=>{
    const con = mysql.createConnection({
        host: "localhost",
		user: "db_user",
		password: "P@s$w0rd123!",
		database: "TravelExperts"
    });
    //Pulls the Agent name data from the database, then passes it down to the register page
    var agentNameQuery = "SELECT AgtFirstName, AgtLastName FROM agents"
    con.query(agentNameQuery, (err, results, fields)=>{
        if (err) throw err;
        res.render("register", {agents : results});
    });
    con.end()
});

app.get('/te-node-contact', (req, res)=>{
    const con = mysql.createConnection({
        host: "localhost",
		user: "db_user",
		password: "P@s$w0rd123!",
		database: "TravelExperts"
    });
    
    //Pulls agents name , phone number and e-mail from the database and passes to contact page    
    con.connect((err)=>{
        if (err) throw err;
        
        var agentQuery="select agents.agtFirstName, agents.agtLastName, agents.agtBusPhone, agents.AgtEmail from agents ORDER by agents.agtFirstName"; //fetching data from db, ordered by first name
        con.query(agentQuery, (err, results)=>{
            if(err)throw err;
            var agentData = results;
            var agencyQuery = "SELECT * FROM agencies"
            con.query(agencyQuery, (err, results)=>{
                if(err)throw err;
                res.render("contact",{result: agentData, agencies: results});
                con.end((err)=>{
                    if (err) throw err;
                });
            });
        });
    });
});

app.get('/te-node-login', (req, res)=>{
    res.render("login")
});

app.get('/te-node-thankyou', (req, res)=>{
    res.render("thankyou")
});

// Serves the login page when accessing customerhome, and orders pages.
// Pulls the path from the pages above, and serves pages accordingly
// When login button is clicked, the email is checked againts the database,
// if the email exists, it pulls the password associated with it.
// The password is compared with with submitted value, if they match the user is served the requested page.
app.post('/te-node-login', (req, res)=>{
    const con = mysql.createConnection({
        host: "localhost",
		user: "db_user",
		password: "P@s$w0rd123!",
		database: "TravelExperts"
    });
    // Checks the path that was redirected from
    if (req.query.path == "/te-node-customerhome"){
        con.connect((err)=>{
            if (err) throw err;
            // Selects the customer based on email provided
            var checkPassword = `SELECT CustPassword, CustomerId FROM customers WHERE CustEmail="${req.body.username}"`
            con.query(checkPassword, (err, results)=>{
                if (err) throw err;
                // Checks if the email exists in the database
                if (results.length == 0){
                    res.send(`<script>alert("Username and/or password are incorrect!"); window.location.href = "/te-node-login?path=${req.query.path}"; </script>`);
                }else{
                    // Checks if the provided password matches what is recorded in the database
                    if (req.body.password == results[0].CustPassword){
                        // Collects customer data from database
                        var customerQuery = `SELECT * FROM customers WHERE CustomerId="${results[0].CustomerId}"`
                        con.query(customerQuery, (err, results)=>{
                            if (err) throw err;
                            delete results[0].CustPassword
                            // Humanizes the Agent... converts from AgentId to Agent name
                            var agentName = `SELECT AgtFirstName, AgtLastName FROM agents WHERE AgentId="${results[0].AgentId}"`
                            var customerData = results;
                            con.query(agentName, (err, results)=>{
                                customerData[0].AgentId = `${results[0].AgtFirstName} ${results[0].AgtLastName}`
                            });
                            // Collect all bookings under customer name
                            var customerOrders = `SELECT * FROM bookings WHERE CustomerId="${results[0].CustomerId}"`
                            con.query(customerOrders, (err, results)=>{
                                if (err) throw err;
                                results.forEach((result) => {
                                    result.BookingDate = dateFormatting.formattedDateCust(result.BookingDate);
                                    // I ran into some timing issues here trying to work in the database,
                                    // so for the sake of time and simplicity I hard coded the values
                                    if (result.TripTypeId == 'B'){
                                        result.TripTypeId = "Business"
                                    }else if (result.TripTypeId == 'G'){
                                        result.TripTypeId = "Group"
                                    }else if (result.TripTypeId == 'L'){
                                        result.TripTypeId = "Leisure"
                                    };
                                });
                                res.render("customerhome", {customer: customerData[0], orders: results})
                                con.end((err)=>{
                                    if (err) throw err;
                                });
                            });
                        });
                    }else{
                        res.send(`<script>alert("Username and/or password are incorrect!"); window.location.href ="/te-node-login?path=${req.query.path}"; </script>`);
                    }
                }
            });
        });
    }else if(req.query.path =="/te-node-order"){
        con.connect((err)=>{
            if (err) throw err;
            // Selects the customer based on email provided
            var checkPassword = `SELECT CustPassword, CustomerId FROM customers WHERE CustEmail="${req.body.username}"`
            con.query(checkPassword, (err, results)=>{
                if (err) throw err;
                // Checks if the email exists in the database
                if (results.length == 0){
                    res.send(`<script>alert("Username and/or password are incorrect!"); window.location.href = "/te-node-login?path=${req.query.path}"; </script>`);
                }else{
                    // Checks if the provided password matches what is recorded in the database
                    if (req.body.password == results[0].CustPassword){
                        // Collects customer data from database
                        var customerQuery = `SELECT * FROM customers WHERE CustomerId="${results[0].CustomerId}"`
                        con.query(customerQuery, (err, results)=>{
                            if (err) throw err;
                            delete results[0].CustPassword
                            // Collects package data from database
                            var packagesQuery = `SELECT PackageId, PkgName, PkgStartDate FROM packages`
                            var customerData = results[0];
                            con.query(packagesQuery, (err, results)=>{
                                if (err) throw err;
                                for (var i = 0; i < results.length; i++){
                                    // Checks the package start date vs the current date,
                                    // Deleting anyrows that have expired
                                    if ( dayjs(results[i].PkgStartDate).diff(dayjs(), 'days') <= 0){
                                        delete results[i];
                                    };
                                };
                                res.render("order", {customer: customerData, packages: results})
                                con.end((err)=>{
                                    if (err) throw err;
                                });
                            });
                        });
                    }else{
                        res.send(`<script>alert("Username and/or password are incorrect!"); window.location.href = "/te-node-login?path=${req.query.path}"; </script>`);
                    }
                }
            });
        });
    };
});



// Post method that inserts account data into database
// Serves orderPlaced landing page on successful completion
app.post('/te-node-orderPlaced', (req, res)=>{
    const con = mysql.createConnection({
        host: "localhost",
		user: "db_user",
		password: "P@s$w0rd123!",
		database: "TravelExperts"
    });
    var splitPackage = req.body.package.split(" - ")
    var bookingNum = "ABC" + String(Math.floor(Math.random()*9)) + String(Math.floor(Math.random()*9)) + String(Math.floor(Math.random()*9))
    // Searches database for customer with provided email
    var customerIdQuery = `SELECT CustomerId FROM customers WHERE CustEmail="${req.body.email}"`
    con.query(customerIdQuery, (err, results)=>{
        if (err) throw err;
        var customerId = results[0].CustomerId
        var tripIdQuery = `SELECT TripTypeId from triptypes WHERE TTname="${req.body.type}"`
        con.query(tripIdQuery, (err, results)=>{
            if (err) throw err;
            var tripId = results[0].TripTypeId
            // Creates a booking record, inserting all neccesary values
            var addBooking ="INSERT INTO bookings(BookingDate, BookingNo, TravelerCount, CustomerId, TripTypeId, PackageId) VALUES (?,?,?,?,?,?)"
            con.query(addBooking, [dayjs().format(), bookingNum, req.body.groupSize, customerId, tripId, splitPackage[0]], (err, results)=>{
                if (err) throw err;
                res.render('orderPlaced')
                con.end((err)=>{
                    if (err) throw err;
                });
            });
        });
    });
    
});

app.post('/te-node-thankyou', (req, res)=>{
    const con = mysql.createConnection({
        host: "localhost",
		user: "db_user",
		password: "P@s$w0rd123!",
		database: "TravelExperts"
    });
    // The following code is used to verify that the email being
    // registered with has not been used in the with another account.
    con.connect((err)=>{
        if (err) throw err;
        // Attempts to pull the account that the requested email is linked to.
        // If the email query returns an empty array, the registration will proceed
        // If the email query returns an array with data, it alerts the user that
        // the email is already registered
        var emailQuery = `SELECT * FROM customers WHERE CustEmail="${req.body.email}"`
        con.query(emailQuery, (err, results)=>{
            if (err) throw err;
            if (results.length != 0){
                res.send('<script>alert("That email is already in use on this site!"); window.location.href = "/te-node-register"; </script>');
                return false;
            }else{
                var nameArray = req.body.agent.split(" ")
                // A database query to pull the ID of the agent that was selected in the registration page.
                // Filters by the first and last name
                var agentIdQuery = `SELECT AgentId FROM agents where AgtfirstName="${nameArray[0]}" and AgtLastName="${nameArray[1]}"`
                con.query(agentIdQuery, (err, results)=>{
                    if (err) throw err;
                    var agent = results[0].AgentId;
                    //Inserts the provided customer information into the Travel Experts database
                    var insertCustomer = "INSERT INTO customers (CustFirstName, CustLastName, CustAddress,"
                    + " CustCity, CustProv, CustPostal, CustCountry, CustHomePhone, CustBusPhone, CustEmail, AgentId, CustPassword)"
                    + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    con.query(
                        insertCustomer, 
                        [
                            req.body.fname, req.body.lname, req.body.address, req.body.city, req.body.province, req.body.postalcode,
                            req.body.country, req.body.phonenumber, req.body.phonenumber, req.body.email, agent, req.body.password
                        ], 
                        (err, results, field)=>{
                        if(err) throw err;
                        res.render("thankyou")
                        con.end((err)=>{
                            if (err) throw err;
                        });
                    });
                });
            };
        });
    });
});

/* This block below was created by Marat Nikitin*/
/*  data for /getpackages is retrieved from the database using an sql query:*/
app.get("/te-node-getpackages", (req, res)=>{
    var getConnection = ()=>{
        return mysql.createConnection({
            host: "localhost",
            user: "db_user",
            password: "P@s$w0rd123!",
            database: "TravelExperts"
        });
    };

    var conn = getConnection();
    conn.connect((err)=>{
        if (err) throw err;   
        var sql = "SELECT PkgName, PkgStartDate, PkgEndDate, PkgDesc, FORMAT(PkgBasePrice, 'C') as PkgBasePrice FROM packages";
        /* This query ensures that that first & last columns (Package ID & Agency's Commission) are not displayed on the Packages page.
            Normally, travel agencies do not disclose their commission openly and hide it inside the package's total price. */ 
        conn.query(sql, (err, results, fields)=>{
            if (err) throw err;
            for (var i = 0; i < results.length; i++){
                if ( dayjs(results[i].PkgEndDate).diff(dayjs(), 'days') <= 0){
                   results.splice(i, 1); /* Here we removed rows with expired packages */
                };
            };
            /* In the block below we set customized date-time format for humans */
            results.forEach((result) => {
                result.PkgStartDate = dateFormatting.formattedDate(result.PkgStartDate); 
                result.PkgEndDate = dateFormatting.formattedDate(result.PkgEndDate); 
            });
            res.render("packagesmysql", { result: results }); 
            /* packagesmysql.ejs file is used to display the information 
               about packages comprehensively */
            conn.end((err)=>{
                if (err) throw err;
            });
        });
    });
});
// Redirects the user to the login page
// Passes the path down to the login page as part of the query
// to give context to login page
app.get('/te-node-customerhome', (req, res)=>{
    var pathRequested = encodeURIComponent(`${req.url}`);
    res.redirect('/te-node-login?path=' + pathRequested)
});

// Redirects the user to the login page
// Passes the path down to the login page as part of the query
// to give context to login page
app.get('/te-node-order', (req, res)=>{
    var pathRequested = encodeURIComponent(`${req.url}`);
    res.redirect('/te-node-login?path=' + pathRequested)
})
// Catches 404 errors and renders 404 error page
app.use((req, res)=>{
    res.status(404).render("404")
});

