import dotenv from "dotenv";
import connectDB from "./db/database.js";
import app from "./app.js";
const PORT = process.env.PORT || 8000;
dotenv.config({
  path: "./.env",
});
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at port ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log("Error on running server", error);
    });
  })
  .catch((err) => console.log("MongoDB Connection Failed", err));
