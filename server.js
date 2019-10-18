const express = require("express");
const path = require("path");
const ds = require("./data-service.js");
const testapi = require("./data/test.json");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const app = express();
const dataServiceComments = require("./data-service-comments.js");
const clientSessions = require("client-sessions");
const dataServiceAuth = require("./data-service-auth");
const http = require("http");
const xml = require("xml");
const fs = require("fs");
const nodemailer = require("nodemailer");

app.use(
  clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "someSecretorHashGen", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
  })
);
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.locals.session = req.session;
  next();
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.engine(
  ".hbs",
  exphbs({
    extname: ".hbs",
    defaultLayout: "layout",
    helpers: {
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      }
    }
  })
);
app.set("view engine", ".hbs");
var HTTP_PORT = process.env.PORT || 8080;

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

ds.initialize()
  .then(() => {
    dataServiceComments.initialize();
  })
  .catch(err => {
    console.log("serviceComments failed");
  })
  .then(() => {
    dataServiceAuth.initialize();
  })
  .catch(err => {
    console.log("serviceauth failed");
  })
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log("App listening on: " + HTTP_PORT);
    });
  })
  .catch(function (err) {
    res.send(err);
  });

app.get("/home", function (req, res) {
  console.log(testapi);
  res.render("home");
});

app.get("/about", function (req, res) {
  dataServiceComments
    .getAllComments()
    .then(data => {
      //console.log(data);
      res.render("about", { data: data });
    })
    .catch(er => {
      res.render("about");
    });
});

app.get("/employees/add", ensureLogin, (req, res) => {
  ds.getDepartments()
    .then(data => {
      res.render("addEmployee", { data: data, title: "Departments" });
    })
    .catch(err => {
      res.render("addEmployee", { data: {}, title: "Departments" });
    });
});
app.post("/employees/add", ensureLogin, (req, res) => {
  //console.log(req.body);
  ds.addEmployee(req.body).then(function () {
    res.redirect("/employees");
  });
});

app.get("/employee/:empNum", ensureLogin, (req, res) => {
  //:variable //when passing departments for selectable, it is not viewData.data, just viewData.departments
  let viewData = {};
  ds.getEmployeesByNum(req.params.empNum)
    .then(data => {
      viewData.data = data; // store emp data in data obj
    })
    .catch(() => {
      viewData.data = null;
    })
    .then(ds.getDepartments)
    .then(data => {
      viewData.departments = data;
      for (let i = 0; i < viewData.departments.length; i++) {
        if (viewData.departments[i].departmentId == viewData.data.department) {
          viewData.departments[i].selected = true;
        }
      }
    })
    .catch(() => {
      viewData.departments = [];
    })
    .then(() => {
      if (viewData.data == null) {
        res.status(404).send("Employee Not Found");
      } else {
        res.render("employee", { viewData: viewData });
      }
    });
});
app.post("/employee/update", ensureLogin, (req, res) => {
  //console.log(req.body);
  ds.updateEmployee(req.body).then(function (msg) {
    res.redirect("/employees");
  });
});

app.get("/employees", ensureLogin, (req, res) => {
  if (req.query.status) {
    ds.getEmployeesByStatus(req.query.status)
      .then(function (ebsarr) {
        res.render("employeeList", { data: ebsarr, title: "Employees" });
      })
      .catch(function (err) {
        res.render("employeeList", { data: {}, title: "Employees" });
      });
  } else if (req.query.manager) {
    ds.getEmployeesByManager(req.query.manager)
      .then(function (ebmarr) {
        res.render("employeeList", { data: ebmarr, title: "Employees" });
      })
      .catch(function (err) {
        res.render("employeeList", { data: {}, title: "Employees" });
      });
  } else if (req.query.department) {
    ds.getEmployeesByDepartment(req.query.department)
      .then(ebdarr => {
        res.render("employeeList", { data: ebdarr, title: "Employees" });
      })
      .catch(function (err) {
        res.render("employeeList", { data: {}, title: "Employees" });
      });
  } else {
    ds.getAllEmployees()
      .then(alarr => {
        res.render("employeeList", { data: alarr, title: "Employees" });
      })
      .catch(function (err) {
        res.render("employeeList", { data: {}, title: "Employees" });
      });
  }
});

app.get("/managers", ensureLogin, (req, res) => {
  ds.getManagers()
    .then(manArr => {
      res.render("employeeList", {
        data: manArr,
        title: "Employees (Managers)"
      });
    })
    .catch(function (err) {
      res.render("employeeList", { data: {}, title: "Departments" });
    });
});

app.get("/departments", ensureLogin, (req, res) => {
  ds.getDepartments()
    .then(depArr => {
      res.render("departmentList", { data: depArr, title: "Departments" });
    })
    .catch(function (err) {
      res.render("departmentList", { data: {}, title: "Departments" });
    });
});

app.get("/departments/add", ensureLogin, (req, res) => {
  res.render("addDepartment");
});

app.post("/departments/add", ensureLogin, (req, res) => {
  ds.addDepartment(req.body)
    .then(() => {
      res.redirect("/departments");
    })
    .catch(err => {
      console.log(err);
    });
});

app.post("/department/update", ensureLogin, (req, res) => {
  ds.updateDepartment(req.body).then(() => {
    res.redirect("/departments");
  });
});

app.get("/department/:departmentId", ensureLogin, (req, res) => {
  ds.getDepartmentById(req.params.departmentId)
    .then(depId => {
      res.render("department", { data: depId });
    })
    .catch(err => {
      res
        .status(404)
        .send("Page Not Found")
        .end();
    });
});

app.get("/employee/delete/:empNum", ensureLogin, (req, res) => {
  ds.deleteEmployeeByNum(req.params.empNum)
    .then(() => {
      res.redirect("/employees");
    })
    .catch(err => {
      res.status(500).send("Unable to Remove Employee / Employee not found");
    });
});

app.post("/about/addComment", (req, res) => {
  dataServiceComments
    .addComment(req.body)
    .then(() => {
      res.redirect("/about");
    })
    .catch(er => {
      console.log(er);
      res.redirect("/about");
    });
});

app.post("/about/addReply", (req, res) => {
  dataServiceComments
    .addReply(req.body)
    .then(() => {
      res.redirect("/about");
    })
    .catch(er => {
      console.log(er);
      res.redirect("/about");
    });
});

app.get("/login", (req, res) => {
  res.render("login", { data: {} });
});
app.post("/login", (req, res) => {
  dataServiceAuth
    .checkUser(req.body)
    .then(() => {
      req.session.user = { username: req.body.user };
      res.redirect("/employees");
    })
    .catch(err => {
      res.render("login", { errorMessage: err, user: req.body.user });
    });
});
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});
app.get("/register", (req, res) => {
  res.render("register", { data: {} });
});

app.post("/register", (req, res) => {
  dataServiceAuth
    .registerUser(req.body)
    .then(() => {
      res.render("register", { successMessage: "User created" });
    })
    .catch(err => {
      res.render("register", { errorMessage: err, user: req.body.user });
    });
});

app.get("/SpaceShooter", (req, res) => {
  res.render("spaceshooter");
});

app.get("/video", (req, res) => {
  res.render("video");
});

app.get("/graphjs", (req, res) => {
  res.render("graphjs");
});
app.get("/animation", (req, res) => {
  res.render("animationCanvas");
});
app.get("/animation2", (req, res) => {
  res.render("animationCanvas2");
});
app.get("/testapi", (req, res, next) => {
  res.send(JSON.stringify(testapi));
});
app.get("/apdnd", (req, res, next) => {
  res.render("apdnd");
});
app.get("/testapi2", (req, res, next) => {
  //res.set('Content-Type', 'text/xml');
  res.header("Content-Type", "text/xml");
  res.send(fs.readFileSync("./data/full.xml", { encoding: "utf-8" }));
  //res.send(testapi2);
});

app.get("/githubfinder", function (req, res) {
  res.render("githubfinder", { layout: false });
});
app.get("/", function (req, res) {
  res.render("homeparallax", { layout: false });
});
app.get("/lyrics", function (req, res) {
  res.render("lyrics", { layout: false });
});
app.get("/ahmun", function (req, res) {
  res.render("ahmun", { layout: false });
});
app.get("/speech", function (req, res) {
  res.render("speech", { layout: false });
});
app.get("/cheatsheets", function (req, res) {
  res.render("cheatsheets");
});

app.post("/send", (req, res) => {
  const output = `
    <p>You have a new contact request</p>
    <h3>Contact Details</h3>
    <ul>
        <li>Name: ${req.body.name}</li>
        <li>Company ${req.body.company}</li>
        <li>Email: ${req.body.email}</li>
        <li>Phone: ${req.body.phone}</li>
    </ul>
    <h3>Message</h3>
    <p>${req.body.message}</p>
    `;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "redacted", // generated ethereal user
      pass: "redacted" // generated ethereal password
    },
    tls: { rejectUnauthorized: false }
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: '"nm Contact" <testanalyticsjk@gmail.com>', // sender address
    to: "kwanjas0412@gmail.com", // list of receivers
    subject: "Node Contact Request", // Subject line
    text: "Hello world?", // plain text body
    html: output // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.redirect("home");
  });
});

app.use((req, res) => {
  res
    .status(404)
    .send("Page Not Found")
    .end();
});
