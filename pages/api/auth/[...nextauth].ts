import NextAuth, { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

const findOrCreateUser = async (credentials: {
  username: string;
  email: string;
}) => {
  const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user`;
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(credentials),
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
};

export const nextAuthOptions: NextAuthOptions = {
  callbacks: {
    async signIn(params) {
      const email = params.profile.email || params.user.email || params.credentials?.email.value;
      const name = params.profile.name || params.user.name || email;
      const user = await findOrCreateUser({
        username: name!,
        email: email!,
      });
      return !!user;
    },
  },
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // ...add more providers here
  ],
};

if (process.env.NODE_ENV === 'development') {
  const credentialsProvider = CredentialsProvider({
    // The name to display on the sign in form (e.g. 'Sign in with...')
    name: 'Credentials',
    // The credentials is used to generate a suitable form on the sign in page.
    // You can specify whatever fields you are expecting to be submitted.
    // e.g. domain, username, password, 2FA token, etc.
    // You can pass any HTML attribute to the <input> tag through the object.
    credentials: {
      username: { label: 'Username', type: 'text', placeholder: 'ashketchum' },
      email: { label: 'Email', type: 'email', placeholder: 'ash.ketchum@example.com' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials, req) {
      // You need to provide your own logic here that takes the credentials
      // submitted and returns either a object representing a user or value
      // that is false/null if the credentials are invalid.
      // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
      // You can also use the `req` object to obtain additional parameters
      // (i.e., the request IP address)
      const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user`;
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(credentials),
        headers: { 'Content-Type': 'application/json' }
      });
      const user = await res.json();

      // If no error and we have user data, return it
      if (res.ok && user) {
        return user;
      }
      // Return null if user data could not be retrieved
      return null;
    },
  });
  nextAuthOptions.providers.push(credentialsProvider);
}

export default NextAuth(nextAuthOptions);
