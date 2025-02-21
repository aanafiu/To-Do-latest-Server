const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5001;

// MiddleWare
app.use(
    cors({
      origin: ["http://localhost:5173"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Allowed methods
      allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    })
  );
app.use(express.json())

// mongodb

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v6p8m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Database
    const database = client.db("KI_KI_Lagbe");
    const userDetails = database.collection("UserDetails");

    // From Here Add All CRUD operation

    // Add Registration User Details in Database
    app.post("/userinformation",async(req,res)=>{

        try{
            const info = req.body;
            console.log(info);
    
            const user = await userDetails.findOne({email: info.email});
            if(user)
            {
                return res.status(400).send({message:"User Already Registered"});
            }
            const result = await userDetails.insertOne(info);
            res.status(201).send({message:"User Created Succesfully", data: result})
        }
        catch(error)
        {
            console.log(error)
            if(error)
            {
                return res.status(500).send({message:"Internal Problem"})
            }
        }
       
    })


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!! Ki KI lagbe')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})