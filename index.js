import express from "express";

const app = express();

const port = process.env.PORT || 4000;
app.get('/api/user',(req,res)=>{
  res.send("Bittthhhccccchhh")
})
app.listen(port, () => {
  console.log(`Server Listening at http://localhost:${port}/`);
});
