const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5001;

// MiddleWare
app.use(
  cors({
    origin: ["http://localhost:5173", "https://r7t4d5-kikikorbo.web.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
app.use(express.json());

// mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v6p8m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Database
    const database = client.db("KI_KI_Lagbe");
    const userDetails = database.collection("UserDetails");

    // From Here Add All CRUD operation

    // Add Registration User Details in Database
    app.post("/userinformation", async (req, res) => {
      try {
        const info = req.body;
        console.log(info);

        const user = await userDetails.findOne({ email: info.email });
        if (user) {
          return res.status(400).send({ message: "User Already Registered" });
        }
        const result = await userDetails.insertOne(info);
        res
          .status(201)
          .send({ message: "User Created Succesfully", data: result });
      } catch (error) {
        console.log(error);
        if (error) {
          return res.status(500).send({ message: "Internal Problem" });
        }
      }
    });

    /// User Data Get
    app.get("/userinformation", async (req, res) => {
      const cursor = userDetails.find();
      const result = await cursor.toArray();
      if (!result) {
        return res.status(404).send({ message: "User not found" });
      }
      // console.log(result);
      res.send(result);
    });

    /// User Data Get by email
    app.get("/userinfo", async (req, res) => {
      const data = req.query.email;
      console.log(data);
      try {
        const email = req.query.email;

        if (!email) {
          return res
            .status(400)
            .send({ success: false, message: "Email is required" });
        }

        const user = await userDetails.findOne({ email });

        if (!user) {
          return res
            .status(404)
            .send({ success: false, message: "User not found" });
        }

        res.status(200).send({ success: true, user });
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Error fetching tasks", error });
      }
    });

    // post task
    app.post("/tasks", async (req, res) => {
      // try {
      //   const { userId, title, description } = req.body;
      //   console.log(req.body, userId);

      //   if (!userId || !title) {
      //     return res.status(400).json({
      //       success: false,
      //       message: "User ID and Title are required",
      //     });
      //   }

      //   const newTask = {
      //     id: new Date().getTime().toString(), // Unique Task ID
      //     title,
      //     description: description || "",
      //     timestamp: new Date().toLocaleDateString("en-GB"),
      //   };

      //   console.log(newTask);

      //   // Ensure the user exists and initializes the tasks object if missing
      //   const userExists = await userDetails.findOne({ email: userId });

      //   if (!userExists) {
      //     await userDetails.updateOne(
      //       { email: userId },
      //       {
      //         $set: {
      //           tasks: {
      //             toDo: [],
      //             inProgress: [],
      //             done: [],
      //           },
      //         },
      //       },
      //       { upsert: true }
      //     );
      //   } else if (!userExists.tasks) {
      //     // If the user exists but has no `tasks` field, initialize it
      //     await userDetails.updateOne(
      //       { email: userId },
      //       {
      //         $set: {
      //           "tasks.toDo": [],
      //           "tasks.inProgress": [],
      //           "tasks.done": [],
      //         },
      //       }
      //     );
      //   }

      //   // Now, push the new task into `toDo`
      //   const result = await userDetails.updateOne(
      //     { email: userId },
      //     { $push: { "tasks.toDo": newTask } }
      //   );

      //   console.log(result);
      //   if (result.modifiedCount === 0) {
      //     return res.status(404).send({ success: false, message: "User not found" });
      //   }

      //   res.status(201).send({
      //     success: true,
      //     message: "Task Added",
      //     task: newTask,
      //   });
      // } catch (error) {
      //   console.error("Error Adding Task:", error);
      //   res.status(500).send({
      //     success: false,
      //     message: "Error Adding Task",
      //     error,
      //   });
      // }

      try {
        const { userId, title, description, category } = req.body;

        if (!userId || !title || !category) {
          return res.status(400).json({
            success: false,
            message: "User ID, Title, and Category are required",
          });
        }

        const newTask = {
          id: new Date().getTime().toString(), // Unique Task ID
          title,
          description: description || "",
          timestamp: new Date().toLocaleDateString("en-GB"),
        };

        let userExists = await userDetails.findOne({ email: userId });

        // If user doesn't exist, create a new entry with category-wise structure
        if (!userExists) {
          userExists = await userDetails.create({
            email: userId,
            tasks: {
              toDo: [],
              inProgress: [],
              done: [],
            },
          });
        }

        // Ensure the user has the required task structure
        const updatedTasks = userExists.tasks || {
          toDo: [],
          inProgress: [],
          done: [],
        };

        // Push the new task into the correct category
        updatedTasks[category].push(newTask);

        // Update the user's tasks in the database
        await userDetails.updateOne(
          { email: userId },
          { $set: { tasks: updatedTasks } }
        );

        res.status(201).json({
          success: true,
          message: "Task Added Successfully",
          task: newTask,
          tasks: updatedTasks,
        });
      } catch (error) {
        console.error("Error Adding Task:", error);
        res.status(500).send({
          success: false,
          message: "Error Adding Task",
          error,
        });
      }
    });

    /**Drag Task to Another Category*/

    app.put("/tasks/move", async (req, res) => {
      try {
        const { userId, taskId, fromCategory, toCategory } = req.body;
        console.log(req.body);

        if (!userId || !taskId || !fromCategory || !toCategory) {
          return res.status(400).send({ error: "Invalid data provided" });
        }

        // Convert userId to ObjectId
        const user = await userDetails.findOne({ _id: new ObjectId(userId) });
        if (!user) return res.status(404).send({ error: "User not found" });

        // Find the task in the source category
        const taskIndex = user.tasks[fromCategory].findIndex(
          (task) => task.id === taskId
        );

        if (taskIndex === -1) {
          return res
            .status(400)
            .send({ error: "Task not found in source category" });
        }

        // Move task
        const [movedTask] = user.tasks[fromCategory].splice(taskIndex, 1);
        user.tasks[toCategory].push(movedTask);

        // Update the specific fields in the database
        await userDetails.updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              [`tasks.${fromCategory}`]: user.tasks[fromCategory],
              [`tasks.${toCategory}`]: user.tasks[toCategory],
            },
          }
        );

        res.json({ message: "Task moved successfully", tasks: user.tasks });
      } catch (error) {
        console.error("Error moving task:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!! Ki KI lagbe");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
