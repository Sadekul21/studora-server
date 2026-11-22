import jwt from 'jsonwebtoken'

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: 'Unauthorized access' })
    }
    req.user = decoded
    next()
  })
}

export default verifyToken
