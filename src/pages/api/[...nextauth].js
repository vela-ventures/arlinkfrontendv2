// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'

export default NextAuth({
  providers: [
    //Todo add all  the insof into a .env befor pushing if you see this it means i fucked up
    GitHubProvider({
      clientId: '1019455',
      clientSecret: 'Iv23lirgrDjq5GuGFWLU',
      scope: 'repo'
    })
  ],
  callbacks: {
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    }
  }
})