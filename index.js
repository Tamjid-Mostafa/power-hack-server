const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const app = express();
const mongoose = require("mongoose");
const User = require("./model/user");
const cookieParser = require('cookie-parser');
const { json } = require("express");
// middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser())


/* ----------Database Connection---------- */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.j8jry5z.mongodb.net/power-hack?retryWrites=true&w=majority`;
mongoose.connect(uri, {

    useNewUrlParser: true,
    useUnifiedTopology: true 
    
    }, err => {
    if(err) throw err;
    console.log('Connected to MongoDB!!!')
    });

    /* --------- JWT ------ */
    app.put("/user/:email", async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result = await User.findOneAndUpdate(
          filter,
          updateDoc,
          options
        );
        const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
          expiresIn: "5h",
        });
        res.send({ result, token });
      });


    app.post("/api/registration", async (req, res) => {
        try {

            const { name, email, password } = req.body;

            if (!(name && email && password)) {
                res.status(400).send("All fields are required")
            }

            const existingUser = await User.findOne({ email })
            if (existingUser) {
                res.status(401).send("User already exists with this email")
            }


            const encPassword = await bcrypt.hash(password, 10)


            const user = await User.create({
                name,
                email,
                password: encPassword
            })
            
            const token = jwt.sign(
                {id: user._id, email},
                process.env.ACCESS_TOKEN,
                {
                    expiresIn: "2h"
                }
            )


            user.token = token
            user.password = undefined


            

            res.status(201).json({
                user,
                message: (user.name, "Registered Successfully")
            })

        }catch (error) {

        }
    })


/* app.post("/api/registration", async (req, res) => {
  const { name,email, password } = req.body;

  if (!name || typeof name !== "string") {
    return res.json({ status: "error", error: "Invalid name" });
  }
  if (!password || typeof password !== "string") {
    return res.json({ status: "error", error: "Invalid password" });
  }
  if (password.length < 5) {
    return res.json({
      status: "error",
      error: "Password too small. Should be atleast 6 characters",
    });
  }

  const pass = await bcrypt.genSalt(password, 10);;

  try {
    const response = User.create({
      name,
      email,
      pass,
    });
    console.log(response);
    if (response) {
        res.send({status: "ok", message: "Registered Successfully"})
    }
	} catch (error) {
		if (error.code === 11000) {
			// duplicate key
			return res.json({ status: 'error', error: 'User Email already in use' })
		}
		throw error
	}
}); */

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } =req.body;

        if (!(email && password)) {
            res.status(400).send("Required valid credential")
        }


        const user = await User.findOne({email})
        if (!user) {
            res.status(401).send("User not found")
        }

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                {if: user._id},
                process.env.ACCESS_TOKEN,
                {
                    expiresIn: "2h"
                }
            )
            user.token = token
            user.password = undefined

            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true
            }

            res.status(200).cookie("token", token, options).json({
                success: true,
                token,
                message: (user.name, "Successfully log in")
            })
            
        }

    } catch (error) {
        console.log(error);
    }
})


app.get("/", async (req, res) => {
  res.send("Power-Hack Server is Running");
});

app.listen(port, () => console.log(`Power-Hack Server is Running on ${port}`));
