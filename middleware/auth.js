const jwt = require("jsonwebtoken");
const auth = (req,res,next)=>{
  const authHeaders =req.headers.authorization;
  if(!authHeaders || !authHeaders.startsWith("Bearer ")){
    return res.status(401).json({message:"Authorization token is required!",success:false})
  }
  const token =authHeaders.split(" ")[1];
try {
    const decodedUser = jwt.verify(token,process.env.JWT_KEY);
  req.user = decodedUser;
  next();
} catch (error) {
  console.log(error);
  return res.status(401).json({message:"token is not valid",success:false})
}
}

module.exports = auth
