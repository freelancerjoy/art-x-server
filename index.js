const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(
  "sk_test_51NI12FJ2Ak22GPskC9IC2pc2gF5yJIAmAmfOd65CjNkBJT6R2vA1jtiIybeI0CZZppkO4QGBIZEgHZl7taDq4FFM008iioOH7H"
);
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ArtX server is Running");
});
app.get("/test", (req, res) => {
  res.send("ki hoyse");
});

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PSASSWORD}@cluster0.dkc5olm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const userCollection = client.db("artxDB").collection("users");
    const classCollection = client.db("artxDB").collection("classes");
    const paymentCollection = client.db("artxDB").collection("payment");
    const selectClassCollection = client
      .db("artxDB")
      .collection("selectClasses");

    // Admin/instractor/student check route
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role === "student") {
        const result = { student: user?.role === "student" };
        res.send(result);
        return;
      }
      if (user?.role === "admin") {
        const result = { admin: user?.role === "admin" };
        res.send(result);
        return;
      }
      if (user?.role === "instractor") {
        const result = { instractor: user?.role === "instractor" };
        res.send(result);
        return;
      }
    });

    // instrator
    app.get("/instractor", async (req, res) => {
      const query = { role: "instractor" };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // selected class student
    app.get("/selectclass", async (req, res) => {
      let quary = {};
      if (req.query?.email) {
        quary = { email: req.query.email, payment: null };
      } else {
        return;
      }
      console.log(quary);
      const result = await selectClassCollection.find(quary).toArray();
      res.send(result);
    });
    // Enrolled class by student
    app.get("/myenrolledclass", async (req, res) => {
      let quary = {};
      if (req.query?.email) {
        quary = { email: req.query.email, payment: "succesed" };
      } else {
        return;
      }
      console.log(quary);
      const result = await selectClassCollection.find(quary).toArray();
      res.send(result);
    });

    // update payment by student
    app.patch("/selectclass/:id", async (req, res) => {
      const id = req.params.id;
      let quary = {};
      if (req.query?.email) {
        quary = { _id: new ObjectId(id), email: req.query.email };
      }
      const update = req.body;
      console.log(id, update);
      const updateStatus = {
        $set: {
          payment: update.payment,
        },
      };
      const result = await selectClassCollection.updateOne(quary, updateStatus);
      res.send(result);
    });
    // Available sit less
    app.patch("/enrolled/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const update = req.body;
      console.log(id, update);
      const updateStatus = {
        $set: {
          availablesit: update.availablesit - 1,
          enrolled: update.enrolled + 1,
        },
      };
      const result = await classCollection.updateOne(query, updateStatus);
      res.send(result);
    });

    // select class
    app.post("/selectclass", async (req, res) => {
      const selectClass = req.body;
      const result = await selectClassCollection.insertOne(selectClass);
      res.send(result);
    });

    // all classe
    app.get("/allclasses", async (req, res) => {
      const allclasses = await classCollection.find().toArray();
      res.send(allclasses);
    });
    // Popular classe
    app.get("/popularclass", async (req, res) => {
      const query = {};
      const options = {
        sort: { enrolled: -1 },
      };
      const allclasses = await classCollection.find(query, options).toArray();
      res.send(allclasses);
    });

    // update status
    app.patch("/statusclass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = req.body;
      console.log(id, update);
      const updateStatus = {
        $set: {
          status: update.status,
        },
      };
      const result = await classCollection.updateOne(query, updateStatus);
      res.send(result);
    });
    // update user role
    app.patch("/updateuser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatrole = req.body;
      console.log(id, updatrole);
      const updateuser = {
        $set: {
          role: updatrole.role,
        },
      };

      const result = await userCollection.updateOne(query, updateuser);
      res.send(result);
    });

    //
    app.get("/classes", async (req, res) => {
      let quary = {};
      if (req.query?.email) {
        quary = { email: req.query.email };
      } else {
        return;
      }
      const result = await classCollection.find(quary).toArray();
      res.send(result);
    });

    // save classes
    app.post("/addclass", async (req, res) => {
      const course = req.body;
      console.log(course);
      const result = await classCollection.insertOne(course);
      res.send(result);
    });

    // user save
    app.post("/users", async (req, res) => {
      const user = req.body;
      const quary = { email: user.email };
      const existUser = await userCollection.findOne(quary);
      if (existUser) {
        return;
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // Payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const totalPrice = price * 100;
      console.log(price);
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalPrice,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // Payment save
    app.post("/paymentsucces", async (req, res) => {
      const succes = req.body;
      const result = await paymentCollection.insertOne(succes);
      res.send(result);
    });
    // Payment get
    app.get("/paymentsucces", async (req, res) => {
      let quary = {};
      if (req.query?.email) {
        quary = { email: req.query.email };
      } else {
        return;
      }
      // sort by update id
      const result = await paymentCollection
        .find(quary)
        .sort({ _id: -1 })
        .toArray((err, sortresult) => {
          if (err) {
            console.error("Error retrieving documents:", err);
            return;
          }
          console.log("Documents:", sortresult);
        });

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`ArtX server is Running:${port}`);
});
