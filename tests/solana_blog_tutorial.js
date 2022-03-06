/// As on 6.03.2022 I have having the below issues while making tests: If someone can Help, I shall be obliged ..

//   1 passing (3s)
//   1 failing

//   1) SolanaBlogTutorial
//        can send a blog:
//      Error: 102: The program could not deserialize the given instruction
//       at Function.parse (node_modules/@project-serum/anchor/dist/cjs/error.js:40:20)
//       at Object.rpc [as makePost] (node_modules/@project-serum/anchor/dist/cjs/program/namespace/rpc.js:38:61)
//       at processTicksAndRejections (node:internal/process/task_queues:96:5)
//       at async Context.<anonymous> (tests/solana_blog_tutorial.js:73:21)

const assert = require('assert');
const anchor = require('@project-serum/anchor');
const { PublicKey } = require("@solana/web3.js");
const { SystemProgram } = anchor.web3;
const { Buffer, SlowBuffer } = require('buffer');
const { decode } = require('borsh');

// Specify provider environment. 
const provider = anchor.Provider.env();
//Set provider.
anchor.setProvider(provider);
//Specify the workspace 
const program = anchor.workspace.SolanaBlogTutorial;
//const programID = await connection.programID(program);
const programId = new PublicKey("5ftRvxoMzkEQGoF5queGKoh7Bow9dP8bXhdh1R5GEFEk");





describe('SolanaBlogTutorial', () => {

  //This test we are not using Keypair.generate() as below....
  //const blogAccount = anchor.web3.Keypair.generate();
  //Instead we query {PublicKey} to inform us using seeds + bump, on the created blogAccount (i.e. PDA in Solana Terminology)..

  console.log("🚀 Starting test....");

  try {
    it('gets initialized', async () => {
      const { blogAccount, bump } = await getProgramDerivedBlogAddress();

     
      let tx = await program.rpc.initializeBlog(new anchor.BN(bump), {
        accounts: {
          blogAccount: blogAccount,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        //signers: [blogAccount],
      });
      console.log("Starting `Initialize` test..");
      //Console.log the Transaction signature of the Initialization procedure. 
      console.log("Initialization transaction signature : ", tx);

      //Asserts and console.logs
      const account = await getBlogAccount();
      assert.equal(account.authority.toBase58(), provider.wallet.publicKey.toBase58());
      assert.equal(account.postCount.toNumber(), 0);

      console.log('👀 Account Authority pubKey : ', account.authority.toBase58());
      console.log("👀 Account count is :", account.postCount.toNumber());
    });
  } catch (error) {
    console.log(error);
  }


  try {
    it('can send a blog', async () => {
      const { blogAccount } = await getProgramDerivedBlogAddress();
      const { postAccount, bump } = await getProgramDerivedPostAddress();
      
      let firstTx = await program.rpc.makePost('Suveett', 'Blog Tutorial', 'Jai Guru Ji', 'slug', new anchor.BN(bump), {
        accounts: {
          blogAccount: blogAccount,
          postAccount: postAccount,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }
        // signers[blogAccount, postAccount]
      });
      console.log("Starting `postBlog` test ");
      //Console.log the Transaction signature of the postBlog procedure. 
      console.log("PostBlog transaction signature", firstTx);
      const blog = await getBlogAccount();
      const post = await getPostAccount();

      //Asserts and Console Logs
      assert.equal(post.author.toBase58(), provider.wallet.publicKey.toBase58());
      assert.equal(post.authorName, "Suveett");
      assert.equal(post.title, "Blog Tutorial");
      assert.equal(post.content, "Jai Guru Ji");
      assert.ok(post.timestamp);
      console.log("Authority PubKey is : ", post.author.toBase58());
      console.log('👀 New Blog content :', post.content);
      console.log('👀 This BlogPost author"s name is : ', post.authorName);
      console.log('👀 Blog Timestamp is :', post.timestamp);
      console.log("👀 The number of Posts made by Author :", blog.postCount.toNumber());
      
    });
  } catch (error) {
    console.log(error);
  }



  

});





