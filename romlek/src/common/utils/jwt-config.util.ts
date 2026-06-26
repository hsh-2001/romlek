import * as jose from 'jose';
import { UserRow } from '../../users/dto/users.dto';

const generateToken = async (user: UserRow): Promise<string> => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new jose.SignJWT({
    id: user.id,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);

  return token;
};

const verifyToken = async (token: string): Promise<jose.JWTVerifyResult> => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return jose.jwtVerify(token, secret);
};

export default {
  verifyToken,
  generateToken,
};
